import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentStatus } from '../appointments/appointment-status.enum';
import { SignAndSymptom } from './sign-and-symptom.schema';
import { SignsAndSymptomsService } from './signs-and-symptoms.service';

describe('SignsAndSymptomsService', () => {
  let service: SignsAndSymptomsService;
  const model = {
    create: jest.fn(),
    findById: jest.fn(),
  };
  const appointmentsService = { findOne: jest.fn(), update: jest.fn() };

  const dto = {
    medical_appointment_id: '665f1c2e8b3a4c0012a4d222',
    nurse_id: 'u2',
    vital_signs: 'PA 120/80',
    symptoms: 'Cefalea',
    observations: 'Hidratación',
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SignsAndSymptomsService,
        { provide: getModelToken(SignAndSymptom.name), useValue: model },
        { provide: AppointmentsService, useValue: appointmentsService },
      ],
    }).compile();
    service = module.get(SignsAndSymptomsService);
  });

  it('crea el registro y marca el turno confirmado como atendido', async () => {
    appointmentsService.findOne.mockResolvedValue({
      status: AppointmentStatus.CONFIRMED,
    });
    model.create.mockResolvedValue({ ...dto });

    const result = await service.create(dto);

    expect(appointmentsService.findOne).toHaveBeenCalledWith(
      dto.medical_appointment_id,
    );
    expect(model.create).toHaveBeenCalledWith(dto);
    expect(appointmentsService.update).toHaveBeenCalledWith(
      dto.medical_appointment_id,
      {
        status: AppointmentStatus.COMPLETED,
      },
    );
    expect(result.nurse_id).toBe('u2');
  });

  it('no vuelve a actualizar el estado si el turno ya estaba atendido', async () => {
    appointmentsService.findOne.mockResolvedValue({
      status: AppointmentStatus.COMPLETED,
    });
    model.create.mockResolvedValue({ ...dto });

    await service.create(dto);

    expect(model.create).toHaveBeenCalled();
    expect(appointmentsService.update).not.toHaveBeenCalled();
  });

  it.each([AppointmentStatus.PENDING, AppointmentStatus.CANCELLED])(
    'rechaza el registro si el turno está %s',
    async (status) => {
      appointmentsService.findOne.mockResolvedValue({ status });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    },
  );

  it('no crea el registro si el turno no existe', async () => {
    appointmentsService.findOne.mockRejectedValue(new NotFoundException());

    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si el registro no existe', async () => {
    model.findById.mockReturnValue({ exec: () => Promise.resolve(null) });

    await expect(service.findOne('665f1c2e8b3a4c0012a4d111')).rejects.toThrow(
      NotFoundException,
    );
  });
});
