import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Appointment } from './../src/appointments/appointment.schema';
import { AppointmentsController } from './../src/appointments/appointments.controller';
import { AppointmentsService } from './../src/appointments/appointments.service';

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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        AppointmentsService,
        {
          provide: getModelToken(Appointment.name),
          useValue: new FakeAppointmentModel(),
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
    patient_id: 'u3',
    date: '2026-10-28',
    hour: '09:30',
    motive: 'Control general',
    assigned_by_id: 'u3',
  };

  it('POST /appointments crea un turno y GET /appointments lo lista', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .send(body)
      .expect(201)
      .expect(({ body: created }) => {
        expect(created.status).toBe('pending');
        expect(created.patient_id).toBe('u3');
      });

    await request(app.getHttpServer())
      .get('/appointments')
      .query({ patient_id: 'u3' })
      .expect(200)
      .expect(({ body: list }) => expect(list).toHaveLength(1));
  });

  it('POST /appointments rechaza un body inválido con 400', () => {
    return request(app.getHttpServer())
      .post('/appointments')
      .send({ ...body, hour: '25:99', extra: 'no permitido' })
      .expect(400);
  });
});
