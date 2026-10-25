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
      _id: String(this.items.length + 1),
      ...dto,
      status: dto.status ?? 'pending',
    };
    this.items.push(item);
    return Promise.resolve(item);
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
      .send(body)
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
