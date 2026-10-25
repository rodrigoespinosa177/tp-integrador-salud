import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { SignAndSymptom } from './../src/signs-and-symptoms/sign-and-symptom.schema';
import {
  AppointmentSignsController,
  SignsAndSymptomsController,
} from './../src/signs-and-symptoms/signs-and-symptoms.controller';
import { SignsAndSymptomsService } from './../src/signs-and-symptoms/signs-and-symptoms.service';

const TURNO_ID = '665f1c2e8b3a4c0012a4d222';

// Modelo en memoria: el e2e no necesita una instancia de MongoDB.
class FakeSignModel {
  private items: Record<string, unknown>[] = [];

  create(dto: Record<string, unknown>) {
    const item = { _id: String(this.items.length + 1), ...dto };
    this.items.push(item);
    return Promise.resolve(item);
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
        { provide: getModelToken(SignAndSymptom.name), useValue: new FakeSignModel() },
        {
          provide: AppointmentsService,
          useValue: { findOne: () => Promise.resolve({ _id: TURNO_ID }) },
        },
      ],
    }).compile();

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
    nurse_id: 'u2',
    vital_signs: 'PA 120/80 · T 36.5 °C',
    symptoms: 'Cefalea',
    observations: 'Hidratación',
  };

  it('POST /signs-and-symptoms crea un registro y GET /appointments/:id/signs lo lista', async () => {
    await request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .send(body)
      .expect(201)
      .expect(({ body: created }) => {
        expect(created.nurse_id).toBe('u2');
      });

    await request(app.getHttpServer())
      .get(`/appointments/${TURNO_ID}/signs`)
      .expect(200)
      .expect(({ body: list }) => expect(list).toHaveLength(1));
  });

  it('POST /signs-and-symptoms rechaza un body inválido con 400', () => {
    return request(app.getHttpServer())
      .post('/signs-and-symptoms')
      .send({ ...body, symptoms: '', extra: 'no permitido' })
      .expect(400);
  });
});
