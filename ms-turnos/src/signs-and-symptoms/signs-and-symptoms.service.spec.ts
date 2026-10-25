import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AppointmentsService } from '../appointments/appointments.service';
import { SignAndSymptom } from './sign-and-symptom.schema';
import { SignsAndSymptomsService } from './signs-and-symptoms.service';

describe('SignsAndSymptomsService', () => {
  let service: SignsAndSymptomsService;
  const model = {
    create: jest.fn(),
    findById: jest.fn(),
  };
  const appointmentsService = { findOne: jest.fn() };

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

  it('crea el registro cuando el turno existe', async () => {
    appointmentsService.findOne.mockResolvedValue({});
    model.create.mockResolvedValue({ ...dto });

    const result = await service.create(dto);

    expect(appointmentsService.findOne).toHaveBeenCalledWith(
      dto.medical_appointment_id,
    );
    expect(model.create).toHaveBeenCalledWith(dto);
    expect(result.nurse_id).toBe('u2');
  });

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
