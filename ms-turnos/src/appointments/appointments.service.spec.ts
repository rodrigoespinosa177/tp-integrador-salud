import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { AuthUser } from '../auth/auth-user';
import { Rol } from '../auth/rol.enum';
import { UsuariosClient } from '../auth/usuarios-client.service';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.schema';
import { AppointmentsService } from './appointments.service';

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

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const exec = jest.fn();
  const model = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
  const usuariosClient = { assertPacienteActivo: jest.fn() };

  const datos = { date: '2026-10-28', hour: '09:30', motive: 'Control' };

  beforeEach(async () => {
    jest.resetAllMocks();
    model.find.mockReturnValue({ sort: () => ({ exec }) });
    const module = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getModelToken(Appointment.name), useValue: model },
        { provide: UsuariosClient, useValue: usuariosClient },
      ],
    }).compile();
    service = module.get(AppointmentsService);
  });

  describe('create', () => {
    it('un paciente se saca el turno a sí mismo y queda pendiente', async () => {
      model.create.mockResolvedValue({});

      await service.create(
        {
          ...datos,
          patient_id: 'u3',
          assigned_by_id: 'otro',
          status: AppointmentStatus.CONFIRMED,
        },
        paciente,
      );

      expect(model.create).toHaveBeenCalledWith({
        ...datos,
        patient_id: 'u3',
        assigned_by_id: 'u3',
      });
      expect(usuariosClient.assertPacienteActivo).not.toHaveBeenCalled();
    });

    it('un paciente no puede sacar turnos para otro', async () => {
      await expect(
        service.create({ ...datos, patient_id: 'u9' }, paciente),
      ).rejects.toThrow(ForbiddenException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('el administrador crea el turno de un paciente validado y queda como quien lo asignó', async () => {
      model.create.mockResolvedValue({});

      await service.create(
        { ...datos, patient_id: 'u3', assigned_by_id: 'otro' },
        admin,
      );

      expect(usuariosClient.assertPacienteActivo).toHaveBeenCalledWith(
        'u3',
        't1',
      );
      expect(model.create).toHaveBeenCalledWith({
        ...datos,
        status: undefined,
        patient_id: 'u3',
        assigned_by_id: 'u1',
      });
    });

    it('el administrador debe indicar el paciente', async () => {
      await expect(service.create(datos, admin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('no crea el turno si el paciente no existe', async () => {
      usuariosClient.assertPacienteActivo.mockRejectedValue(
        new BadRequestException(),
      );

      await expect(
        service.create({ ...datos, patient_id: 'u9' }, admin),
      ).rejects.toThrow(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('un paciente solo ve sus turnos', async () => {
      exec.mockResolvedValue([]);

      await service.findAll(paciente);

      expect(model.find).toHaveBeenCalledWith({ patient_id: 'u3' });
    });

    it('un paciente no puede pedir los turnos de otro', async () => {
      await expect(service.findAll(paciente, 'u9')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('el administrador ve todos o filtra por paciente', async () => {
      exec.mockResolvedValue([]);

      await service.findAll(admin);
      await service.findAll(admin, 'u3');

      expect(model.find).toHaveBeenNthCalledWith(1, {});
      expect(model.find).toHaveBeenNthCalledWith(2, { patient_id: 'u3' });
    });
  });

  describe('findOneFor', () => {
    it('lanza NotFoundException si el turno no existe', async () => {
      model.findById.mockReturnValue({ exec: () => Promise.resolve(null) });

      await expect(
        service.findOneFor('665f1c2e8b3a4c0012a4d111', admin),
      ).rejects.toThrow(NotFoundException);
    });

    it('un paciente no ve el turno de otro', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve({ patient_id: 'u9' }),
      });

      await expect(
        service.findOneFor('665f1c2e8b3a4c0012a4d111', paciente),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const id = '665f1c2e8b3a4c0012a4d111';
    const propio = (status: AppointmentStatus) => ({
      patient_id: 'u3',
      status,
    });

    it('un paciente puede cancelar su turno', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(propio(AppointmentStatus.PENDING)),
      });
      model.findByIdAndUpdate.mockReturnValue({
        exec: () => Promise.resolve({}),
      });

      await service.update(
        id,
        { status: AppointmentStatus.CANCELLED },
        paciente,
      );

      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });

    it.each([
      { status: AppointmentStatus.CONFIRMED },
      { status: AppointmentStatus.CANCELLED, motive: 'otro' },
      { date: '2026-11-01' },
    ])('un paciente no puede hacer el cambio %j', async (cambio) => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(propio(AppointmentStatus.PENDING)),
      });

      await expect(service.update(id, cambio, paciente)).rejects.toThrow(
        ForbiddenException,
      );
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('un paciente no cancela un turno ya atendido', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(propio(AppointmentStatus.COMPLETED)),
      });

      await expect(
        service.update(id, { status: AppointmentStatus.CANCELLED }, paciente),
      ).rejects.toThrow(BadRequestException);
    });

    it('al reasignar el turno, el administrador valida al nuevo paciente', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(propio(AppointmentStatus.PENDING)),
      });
      model.findByIdAndUpdate.mockReturnValue({
        exec: () => Promise.resolve({}),
      });

      await service.update(id, { patient_id: 'u4' }, admin);

      expect(usuariosClient.assertPacienteActivo).toHaveBeenCalledWith(
        'u4',
        't1',
      );
    });
  });
});
