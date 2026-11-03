import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';
import { SignAndSymptom } from './../src/signs-and-symptoms/sign-and-symptom.schema';
import {
  AppointmentSignsController,
  SignsAndSymptomsController,
} from './../src/signs-and-symptoms/signs-and-symptoms.controller';
import { SignsAndSymptomsService } from './../src/signs-and-symptoms/signs-and-symptoms.service';
import {
  ADMIN,
  ENFERMERO,
  OTRO_PACIENTE,
  PACIENTE,
  jwtGuardDePrueba,
} from './usuario-de-prueba';

const TURNO_ID = '665f1c2e8b3a4c0012a4d222';

// Modelo en memoria: el e2e no necesita una instancia de MongoDB.
class FakeSignModel {
  private items: Record<string, unknown>[] = [];

  create(dto: Record<string, unknown>) {
    const item = {
      // ObjectId válido (24 hex), como pide isValidObjectId en el servicio
      _id: String(this.items.length + 1).padStart(24, '0'),
      // Creado hace 10 minutos: ya pasó la ventana de edición
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      additional_observations: [],
      ...dto,
    };
    this.items.push(item);
    return Promise.resolve(item);
  }

  findById(id: string) {
    const item = this.items.find((i) => i._id === id);
    return { exec: () => Promise.resolve(item ?? null) };
  }

  findByIdAndUpdate(
    id: string,
    cambios: {
      $push?: { additional_observations: unknown };
      [campo: string]: unknown;
    },
  ) {
    const item = this.items.find((i) => i._id === id);
    if (item && cambios.$push) {
      (item.additional_observations as unknown[]).push(
        cambios.$push.additional_observations,
      );
    } else if (item) {
      Object.assign(item, cambios);
    }
    return { exec: () => Promise.resolve(item ?? null) };
  }

  exists(filter: { medical_appointment_id: string }) {
    const existe = this.items.find(
      (i) => i.medical_appointment_id === filter.medical_appointment_id,
    );
    return Promise.resolve(existe ? { _id: existe._id } : null);
  }

  find(filter: { medical_appointment_id?: string }) {
    const result = this.items.filter(
      (i) =>
        !filter.medical_appointment_id ||
        i.medical_appointment_id === filter.medical_appointment_id,
    );
    return { sort: () => ({ exec: () => Promise.resolve(result) }) };
  }
}

describe('SignsAndSymptoms (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SignsAndSymptomsController, AppointmentSignsController],
      providers: [
        SignsAndSymptomsService,
        {
          provide: getModelToken(SignAndSymptom.name),
          useValue: new FakeSignModel(),
        },
        {
          provide: AppointmentsService,
          useValue: {
            findOne: () =>
              Promise.resolve({ _id: TURNO_ID, status: 'confirmed' }),
            // El turno es de PACIENTE: otro paciente lo ve como ajeno
            findOneFor: (_id: string, user: { id: string; rol: string }) =>
              user.rol === 'patient' && user.id !== PACIENTE.id
                ? Promise.reject(new ForbiddenException())
                : Promise.resolve({ _id: TURNO_ID, patient_id: PACIENTE.id }),
            applyUpdate: () =>
              Promise.resolve({ _id: TURNO_ID, status: 'completed' }),
          },
        },
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
    medical_appointment_id: TURNO_ID,
    vital_signs: 'PA 120/80 · T 36.5 °C',
    symptoms: 'Cefalea',
    observations: 'Hidratación',
  };
  const como = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('sin token responde 401', () => {
    return request(app.getHttpServer())
      .get(`/appointments/${TURNO_ID}/signs`)
      .expect(401);
  });

  it('el enfermero registra signos a su nombre y el paciente dueño del turno los lista', async () => {
    await request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .set(como(ENFERMERO.token))
      .send({ ...body, nurse_id: 'otro' })
      .expect(201)
      .expect(({ body: created }) => {
        expect(created.nurse_id).toBe(ENFERMERO.id);
      });

    await request(app.getHttpServer())
      .get(`/appointments/${TURNO_ID}/signs`)
      .set(como(PACIENTE.token))
      .expect(200)
      .expect(({ body: list }) => expect(list).toHaveLength(1));
  });

  it('un turno se registra una sola vez', async () => {
    await request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .set(como(ENFERMERO.token))
      .send(body)
      .expect(201);

    await request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .set(como(ENFERMERO.token))
      .send(body)
      .expect(409);
  });

  describe('observaciones adicionales', () => {
    async function crearRegistro() {
      const { body: creado } = await request(app.getHttpServer())
        .post('/signs-and-symptoms')
        .set(como(ENFERMERO.token))
        .send(body)
        .expect(201);
      return creado._id as string;
    }

    it('pasados los 5 minutos el registro no se edita, pero se le puede agregar una observación', async () => {
      const id = await crearRegistro();

      await request(app.getHttpServer())
        .patch(`/signs-and-symptoms/${id}`)
        .set(como(ENFERMERO.token))
        .send({ symptoms: 'Otro' })
        .expect(403);

      await request(app.getHttpServer())
        .post(`/signs-and-symptoms/${id}/observations`)
        .set(como(ENFERMERO.token))
        .send({ text: 'El paciente refiere mejoría' })
        .expect(201)
        .expect(({ body: registro }) => {
          expect(registro.additional_observations).toHaveLength(1);
          expect(registro.additional_observations[0]).toMatchObject({
            text: 'El paciente refiere mejoría',
            nurse_id: ENFERMERO.id,
          });
        });
    });

    it('solo el enfermero puede agregar observaciones', async () => {
      const id = await crearRegistro();

      for (const token of [PACIENTE.token, ADMIN.token]) {
        await request(app.getHttpServer())
          .post(`/signs-and-symptoms/${id}/observations`)
          .set(como(token))
          .send({ text: 'Nota' })
          .expect(403);
      }
    });

    it('rechaza una observación vacía con 400 y un registro inexistente con 404', async () => {
      const id = await crearRegistro();

      await request(app.getHttpServer())
        .post(`/signs-and-symptoms/${id}/observations`)
        .set(como(ENFERMERO.token))
        .send({ text: '' })
        .expect(400);
      await request(app.getHttpServer())
        .post('/signs-and-symptoms/000000000000000000000999/observations')
        .set(como(ENFERMERO.token))
        .send({ text: 'Nota' })
        .expect(404);
    });
  });

  it('un paciente ajeno al turno no puede ver los signos', () => {
    return request(app.getHttpServer())
      .get(`/appointments/${TURNO_ID}/signs`)
      .set(como(OTRO_PACIENTE.token))
      .expect(403);
  });

  it('solo el enfermero puede registrar signos', async () => {
    await request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .set(como(PACIENTE.token))
      .send(body)
      .expect(403);
    await request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .set(como(ADMIN.token))
      .send(body)
      .expect(403);
  });

  it('POST /signs-and-symptoms rechaza un body inválido con 400', () => {
    return request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .set(como(ENFERMERO.token))
      .send({ ...body, symptoms: '', extra: 'no permitido' })
      .expect(400);
  });
});
