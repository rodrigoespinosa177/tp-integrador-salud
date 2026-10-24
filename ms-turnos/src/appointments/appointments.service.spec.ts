import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.schema';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const model = {
    create: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getModelToken(Appointment.name), useValue: model },
      ],
    }).compile();
    service = module.get(AppointmentsService);
  });

  it('crea un turno con los datos recibidos', async () => {
    const dto = {
      patient_id: 'u3',
      date: '2026-10-28',
      hour: '09:30',
      motive: 'Control general',
      assigned_by_id: 'u3',
    };
    model.create.mockResolvedValue({
      ...dto,
      status: AppointmentStatus.PENDING,
    });

    const result = await service.create(dto);

    expect(model.create).toHaveBeenCalledWith(dto);
    expect(result.status).toBe(AppointmentStatus.PENDING);
  });

  it('lanza NotFoundException si el turno no existe', async () => {
    model.findById.mockReturnValue({ exec: () => Promise.resolve(null) });

    await expect(service.findOne('665f1c2e8b3a4c0012a4d111')).rejects.toThrow(
      NotFoundException,
    );
  });
});
