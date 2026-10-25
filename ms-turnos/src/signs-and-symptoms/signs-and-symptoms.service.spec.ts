import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentStatus } from '../appointments/appointment-status.enum';
import type { AuthUser } from '../auth/auth-user';
import { Rol } from '../auth/rol.enum';
import { SignAndSymptom } from './sign-and-symptom.schema';
import {
  SignsAndSymptomsService,
  VENTANA_EDICION_MS,
} from './signs-and-symptoms.service';

const enfermero: AuthUser = {
  id: 'u2',
  email: 'n@x.com',
  rol: Rol.NURSE,
  token: 't2',
};
const paciente: AuthUser = {
  id: 'u3',
  email: 'p@x.com',
  rol: Rol.PATIENT,
  token: 't3',
};
const admin: AuthUser = {
  id: 'u1',
  email: 'a@x.com',
  rol: Rol.ADMINISTRATOR,
  token: 't1',
};

describe('SignsAndSymptomsService', () => {
  let service: SignsAndSymptomsService;
  const exec = jest.fn();
  const model = {
    create: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  const appointmentsService = {
    findOne: jest.fn(),
    findOneFor: jest.fn(),
    findAll: jest.fn(),
    applyUpdate: jest.fn(),
  };

  const dto = {
    medical_appointment_id: '665f1c2e8b3a4c0012a4d222',
    vital_signs: 'PA 120/80',
    symptoms: 'Cefalea',
    observations: 'Hidratación',
  };
  const idRegistro = '665f1c2e8b3a4c0012a4d333';
  const registroDe = (nurse_id: string, creadoHaceMs = 0) => ({
    nurse_id,
    medical_appointment_id: dto.medical_appointment_id,
    createdAt: new Date(Date.now() - creadoHaceMs),
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    model.find.mockReturnValue({ sort: () => ({ exec }) });
    const module = await Test.createTestingModule({
      providers: [
        SignsAndSymptomsService,
        { provide: getModelToken(SignAndSymptom.name), useValue: model },
        { provide: AppointmentsService, useValue: appointmentsService },
      ],
    }).compile();
    service = module.get(SignsAndSymptomsService);
  });

  describe('create', () => {
    it('crea el registro a nombre del enfermero del token y marca el turno como atendido', async () => {
      appointmentsService.findOne.mockResolvedValue({
        status: AppointmentStatus.CONFIRMED,
      });
      model.create.mockResolvedValue({});

      await service.create({ ...dto, nurse_id: 'otro' }, enfermero);

      expect(appointmentsService.findOne).toHaveBeenCalledWith(
        dto.medical_appointment_id,
      );
      expect(model.create).toHaveBeenCalledWith({ ...dto, nurse_id: 'u2' });
      expect(appointmentsService.applyUpdate).toHaveBeenCalledWith(
        dto.medical_appointment_id,
        { status: AppointmentStatus.COMPLETED },
      );
    });

    it('no vuelve a actualizar el estado si el turno ya estaba atendido', async () => {
      appointmentsService.findOne.mockResolvedValue({
        status: AppointmentStatus.COMPLETED,
      });
      model.create.mockResolvedValue({});

      await service.create(dto, enfermero);

      expect(model.create).toHaveBeenCalled();
      expect(appointmentsService.applyUpdate).not.toHaveBeenCalled();
    });

    it.each([AppointmentStatus.PENDING, AppointmentStatus.CANCELLED])(
      'rechaza el registro si el turno está %s',
      async (status) => {
        appointmentsService.findOne.mockResolvedValue({ status });

        await expect(service.create(dto, enfermero)).rejects.toThrow(
          BadRequestException,
        );
        expect(model.create).not.toHaveBeenCalled();
      },
    );

    it('un turno se registra una sola vez', async () => {
      appointmentsService.findOne.mockResolvedValue({
        status: AppointmentStatus.COMPLETED,
      });
      model.exists.mockResolvedValue({ _id: 'ya-existe' });

      await expect(service.create(dto, enfermero)).rejects.toThrow(
        ConflictException,
      );
      expect(model.exists).toHaveBeenCalledWith({
        medical_appointment_id: dto.medical_appointment_id,
      });
      expect(model.create).not.toHaveBeenCalled();
    });

    it('convierte el error de índice duplicado en ConflictException', async () => {
      appointmentsService.findOne.mockResolvedValue({
        status: AppointmentStatus.CONFIRMED,
      });
      model.create.mockRejectedValue({ code: 11000 });

      await expect(service.create(dto, enfermero)).rejects.toThrow(
        ConflictException,
      );
      expect(appointmentsService.applyUpdate).not.toHaveBeenCalled();
    });

    it('no crea el registro si el turno no existe', async () => {
      appointmentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(dto, enfermero)).rejects.toThrow(
        NotFoundException,
      );
      expect(model.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('el enfermero y el administrador ven todo, con filtro opcional por turno', async () => {
      exec.mockResolvedValue([]);

      await service.findAll(enfermero);
      await service.findAll(admin, 'turno1');

      expect(model.find).toHaveBeenNthCalledWith(1, {});
      expect(model.find).toHaveBeenNthCalledWith(2, {
        medical_appointment_id: 'turno1',
      });
    });

    it('un paciente solo ve los registros de sus turnos', async () => {
      appointmentsService.findAll.mockResolvedValue([
        { _id: 'turno1' },
        { _id: 'turno2' },
      ]);
      exec.mockResolvedValue([]);

      await service.findAll(paciente);

      expect(appointmentsService.findAll).toHaveBeenCalledWith(paciente);
      expect(model.find).toHaveBeenCalledWith({
        medical_appointment_id: { $in: ['turno1', 'turno2'] },
      });
    });

    it('un paciente no puede pedir los registros de un turno ajeno', async () => {
      appointmentsService.findOneFor.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(service.findAll(paciente, 'turno9')).rejects.toThrow(
        ForbiddenException,
      );
      expect(model.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si el registro no existe', async () => {
      model.findById.mockReturnValue({ exec: () => Promise.resolve(null) });

      await expect(service.findOne(idRegistro, admin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('un paciente solo ve registros de turnos suyos', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(registroDe('u2')),
      });
      appointmentsService.findOneFor.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(service.findOne(idRegistro, paciente)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addObservation', () => {
    it.each([
      ['dentro de la ventana de edición', 0],
      ['pasados los 5 minutos', VENTANA_EDICION_MS + 60_000],
    ])(
      'agrega la nota a nombre del enfermero del token %s',
      async (_c, hace) => {
        model.findById.mockReturnValue({
          exec: () => Promise.resolve(registroDe('u8', hace)),
        });
        model.findByIdAndUpdate.mockReturnValue({
          exec: () => Promise.resolve({}),
        });

        await service.addObservation(
          idRegistro,
          { text: 'Mejoría' },
          enfermero,
        );

        expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
          idRegistro,
          {
            $push: {
              additional_observations: {
                text: 'Mejoría',
                nurse_id: 'u2',
                date: expect.any(Date),
              },
            },
          },
          expect.anything(),
        );
      },
    );

    it('lanza NotFoundException si el registro no existe', async () => {
      model.findById.mockReturnValue({ exec: () => Promise.resolve(null) });

      await expect(
        service.addObservation(idRegistro, { text: 'Nota' }, enfermero),
      ).rejects.toThrow(NotFoundException);
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('update / remove', () => {
    beforeEach(() => {
      model.findByIdAndUpdate.mockReturnValue({
        exec: () => Promise.resolve({}),
      });
      model.findByIdAndDelete.mockReturnValue({
        exec: () => Promise.resolve({}),
      });
    });

    it('el enfermero modifica y borra sus propios registros', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(registroDe('u2')),
      });

      await service.update(idRegistro, { symptoms: 'Fiebre' }, enfermero);
      await service.remove(idRegistro, enfermero);

      expect(model.findByIdAndUpdate).toHaveBeenCalled();
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(idRegistro);
    });

    it('el enfermero no toca los registros de otro enfermero', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(registroDe('u8')),
      });

      await expect(
        service.update(idRegistro, { symptoms: 'Fiebre' }, enfermero),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.remove(idRegistro, enfermero)).rejects.toThrow(
        ForbiddenException,
      );
      expect(model.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('dentro de los 5 minutos todavía se puede modificar y borrar', async () => {
      model.findById.mockReturnValue({
        exec: () =>
          Promise.resolve(registroDe('u2', VENTANA_EDICION_MS - 1000)),
      });

      await service.update(idRegistro, { symptoms: 'Fiebre' }, enfermero);
      await service.remove(idRegistro, enfermero);

      expect(model.findByIdAndUpdate).toHaveBeenCalled();
      expect(model.findByIdAndDelete).toHaveBeenCalled();
    });

    it.each([
      ['enfermero', enfermero],
      ['administrador', admin],
    ])(
      'pasados los 5 minutos ni el %s puede modificar ni borrar',
      async (_rol, usuario) => {
        model.findById.mockReturnValue({
          exec: () =>
            Promise.resolve(registroDe('u2', VENTANA_EDICION_MS + 1000)),
        });

        await expect(
          service.update(idRegistro, { symptoms: 'Fiebre' }, usuario),
        ).rejects.toThrow(ForbiddenException);
        await expect(service.remove(idRegistro, usuario)).rejects.toThrow(
          ForbiddenException,
        );
        expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(model.findByIdAndDelete).not.toHaveBeenCalled();
      },
    );

    it('el administrador puede modificar cualquier registro', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(registroDe('u8')),
      });

      await service.update(idRegistro, { symptoms: 'Fiebre' }, admin);

      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
