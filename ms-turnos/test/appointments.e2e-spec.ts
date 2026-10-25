import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Appointment } from './../src/appointments/appointment.schema';
import { AppointmentsController } from './../src/appointments/appointments.controller';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';
import { UsuariosClient } from './../src/auth/usuarios-client.service';
import {
  ADMIN,
  ENFERMERO,
  OTRO_PACIENTE,
  PACIENTE,
  jwtGuardDePrueba,
} from './usuario-de-prueba';

// Modelo en memoria: el e2e no necesita una instancia de MongoDB.
class FakeAppointmentModel {
  private items: Record<string, unknown>[] = [];

  create(dto: Record<string, unknown>) {
    // Igual que Mongoose: un status undefined toma el valor por defecto
    const item = {
      // ObjectId válido (24 hex), como pide isValidObjectId en el servicio
      _id: String(this.items.length + 1).padStart(24, '0'),
      ...dto,
      status: dto.status ?? 'pending',
    };
    this.items.push(item);
    return Promise.resolve(item);
  }

  exists(filter: { date: string; hour: string }) {
    const ocupado = this.items.find(
      (i) =>
        i.date === filter.date &&
        i.hour === filter.hour &&
        i.status !== 'cancelled',
    );
    return Promise.resolve(ocupado ? { _id: ocupado._id } : null);
  }

  distinct(_campo: string, filter: { date: string }) {
    const horas = this.items
      .filter((i) => i.date === filter.date && i.status !== 'cancelled')
      .map((i) => i.hour);
    return { exec: () => Promise.resolve(horas) };
  }

  findById(id: string) {
    const item = this.items.find((i) => i._id === id);
    return { exec: () => Promise.resolve(item ?? null) };
  }

  findByIdAndUpdate(id: string, cambios: Record<string, unknown>) {
    const item = this.items.find((i) => i._id === id);
    if (item) Object.assign(item, cambios);
    return { exec: () => Promise.resolve(item ?? null) };
  }

  find(filter: { patient_id?: string }) {
    const result = this.items.filter(
      (i) => !filter.patient_id || i.patient_id === filter.patient_id,
    );
    return { sort: () => ({ exec: () => Promise.resolve(result) }) };
  }
}

describe('Appointments (e2e)', () => {
  let app: INestApplication<App>;
  const usuariosClient = { assertPacienteActivo: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    usuariosClient.assertPacienteActivo.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        AppointmentsService,
        {
          provide: getModelToken(Appointment.name),
          useValue: new FakeAppointmentModel(),
        },
        { provide: UsuariosClient, useValue: usuariosClient },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtGuardDePrueba)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const body = {
    date: '2026-10-28',
    hour: '09:30',
    motive: 'Control general',
  };
  const como = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('sin token responde 401', () => {
    return request(app.getHttpServer()).get('/appointments').expect(401);
  });

  it('un paciente crea su turno (el patient_id sale del token) y solo ve los suyos', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(PACIENTE.token))
      .send({ ...body, patient_id: PACIENTE.id, assigned_by_id: PACIENTE.id })
      .expect(201)
      .expect(({ body: created }) => {
        expect(created.status).toBe('pending');
        expect(created.patient_id).toBe(PACIENTE.id);
        expect(created.assigned_by_id).toBe(PACIENTE.id);
      });

    // Turno de otro paciente, que PACIENTE no debe ver
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(OTRO_PACIENTE.token))
      .send({ ...body, hour: '11:00' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/appointments')
      .set(como(PACIENTE.token))
      .expect(200)
      .expect(({ body: list }) => {
        expect(list).toHaveLength(1);
        expect(list[0].patient_id).toBe(PACIENTE.id);
      });

    await request(app.getHttpServer())
      .get('/appointments')
      .set(como(PACIENTE.token))
      .query({ patient_id: OTRO_PACIENTE.id })
      .expect(403);
  });

  it('no deja reservar dos turnos en la misma fecha y hora (sobreturno)', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(PACIENTE.token))
      .send(body)
      .expect(201);

    // Mismo paciente, mismo horario
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(PACIENTE.token))
      .send(body)
      .expect(409);

    // Otro paciente, mismo horario
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(OTRO_PACIENTE.token))
      .send(body)
      .expect(409);

    // Otro horario: libre
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(OTRO_PACIENTE.token))
      .send({ ...body, hour: '10:00' })
      .expect(201);
  });

  describe('PATCH /appointments/:id como paciente', () => {
    // Pasa por el ValidationPipe: el body llega como instancia del DTO
    async function crearTurnoDe(token: string) {
      const { body: creado } = await request(app.getHttpServer())
        .post('/appointments')
        .set(como(token))
        .send(body)
        .expect(201);
      return creado._id as string;
    }

    it('puede cancelar su propio turno', async () => {
      const id = await crearTurnoDe(PACIENTE.token);

      await request(app.getHttpServer())
        .patch(`/appointments/${id}`)
        .set(como(PACIENTE.token))
        .send({ status: 'cancelled' })
        .expect(200)
        .expect(({ body: turno }) => expect(turno.status).toBe('cancelled'));
    });

    it('no puede hacer otro cambio que cancelar', async () => {
      const id = await crearTurnoDe(PACIENTE.token);

      await request(app.getHttpServer())
        .patch(`/appointments/${id}`)
        .set(como(PACIENTE.token))
        .send({ status: 'confirmed' })
        .expect(403);
      await request(app.getHttpServer())
        .patch(`/appointments/${id}`)
        .set(como(PACIENTE.token))
        .send({ status: 'cancelled', motive: 'otro motivo' })
        .expect(403);
    });

    it('no puede cancelar el turno de otro paciente', async () => {
      const id = await crearTurnoDe(OTRO_PACIENTE.token);

      await request(app.getHttpServer())
        .patch(`/appointments/${id}`)
        .set(como(PACIENTE.token))
        .send({ status: 'cancelled' })
        .expect(403);
    });
  });

  it('GET /appointments/availability devuelve las horas ocupadas de la fecha a cualquier rol', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(OTRO_PACIENTE.token))
      .send({ ...body, hour: '11:00' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(OTRO_PACIENTE.token))
      .send({ ...body, hour: '09:30' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/appointments/availability')
      .set(como(PACIENTE.token))
      .query({ date: body.date })
      .expect(200)
      .expect(['09:30', '11:00']);

    await request(app.getHttpServer())
      .get('/appointments/availability')
      .set(como(PACIENTE.token))
      .query({ date: '2026-11-02' })
      .expect(200)
      .expect([]);
  });

  it('GET /appointments/availability exige una fecha válida', () => {
    return request(app.getHttpServer())
      .get('/appointments/availability')
      .set(como(PACIENTE.token))
      .query({ date: 'mañana' })
      .expect(400);
  });

  it('solo el administrador puede dar sobreturnos', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(PACIENTE.token))
      .send(body)
      .expect(201);

    // El paciente no puede forzar el horario ocupado
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(OTRO_PACIENTE.token))
      .send({ ...body, is_overbooking: true })
      .expect(403);

    // Sin la marca, el administrador tampoco
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(ADMIN.token))
      .send({ ...body, patient_id: OTRO_PACIENTE.id })
      .expect(409);

    // Con la marca, el administrador sí
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(ADMIN.token))
      .send({ ...body, patient_id: OTRO_PACIENTE.id, is_overbooking: true })
      .expect(201)
      .expect(({ body: creado }) => {
        expect(creado.is_overbooking).toBe(true);
      });
  });

  it('un paciente no puede sacar un turno a nombre de otro', () => {
    return request(app.getHttpServer())
      .post('/appointments')
      .set(como(PACIENTE.token))
      .send({ ...body, patient_id: OTRO_PACIENTE.id })
      .expect(403);
  });

  it('el administrador crea el turno de un paciente y queda como quien lo asignó', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(ADMIN.token))
      .send({ ...body, patient_id: PACIENTE.id })
      .expect(201)
      .expect(({ body: created }) => {
        expect(created.assigned_by_id).toBe(ADMIN.id);
      });

    expect(usuariosClient.assertPacienteActivo).toHaveBeenCalledWith(
      PACIENTE.id,
      ADMIN.token,
    );
  });

  it('el enfermero ve todos los turnos pero no puede crearlos', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .set(como(ENFERMERO.token))
      .send({ ...body, patient_id: PACIENTE.id })
      .expect(403);

    await request(app.getHttpServer())
      .get('/appointments')
      .set(como(ENFERMERO.token))
      .expect(200);
  });

  it('solo el administrador puede eliminar turnos', () => {
    return request(app.getHttpServer())
      .delete('/appointments/1')
      .set(como(PACIENTE.token))
      .expect(403);
  });

  it('POST /appointments rechaza un body inválido con 400', () => {
    return request(app.getHttpServer())
      .post('/appointments')
      .set(como(ADMIN.token))
      .send({ ...body, patient_id: PACIENTE.id, hour: '25:99', extra: 'x' })
      .expect(400);
  });
});
