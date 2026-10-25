import {
  BadRequestException,
  ConflictException,
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
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
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
    distinct: jest.fn(),
    exists: jest.fn(),
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
        is_overbooking: false,
        patient_id: 'u3',
        assigned_by_id: 'u1',
      });
    });

    it('rechaza el turno si el horario ya está ocupado, sea cual sea el paciente', async () => {
      model.exists.mockResolvedValue({ _id: 'otro' });

      await expect(
        service.create({ ...datos, patient_id: 'u3' }, paciente),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({ ...datos, patient_id: 'u3' }, admin),
      ).rejects.toThrow(ConflictException);
      expect(model.exists).toHaveBeenCalledWith({
        date: datos.date,
        hour: datos.hour,
        status: { $ne: AppointmentStatus.CANCELLED },
      });
      expect(model.create).not.toHaveBeenCalled();
    });

    it('el administrador puede dar un sobreturno en un horario ocupado', async () => {
      model.exists.mockResolvedValue({ _id: 'otro' });
      model.create.mockResolvedValue({});

      await service.create(
        { ...datos, patient_id: 'u3', is_overbooking: true },
        admin,
      );

      expect(model.exists).not.toHaveBeenCalled();
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ patient_id: 'u3', is_overbooking: true }),
      );
    });

    it('un paciente no puede pedir un sobreturno', async () => {
      await expect(
        service.create({ ...datos, is_overbooking: true }, paciente),
      ).rejects.toThrow(ForbiddenException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('convierte el error de índice duplicado en ConflictException', async () => {
      model.create.mockRejectedValue({ code: 11000 });

      await expect(service.create(datos, paciente)).rejects.toThrow(
        ConflictException,
      );
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

  describe('occupiedHours', () => {
    it('devuelve ordenadas las horas de los turnos no cancelados de la fecha', async () => {
      model.distinct.mockReturnValue({
        exec: () => Promise.resolve(['11:00', '09:30']),
      });

      const horas = await service.occupiedHours('2026-10-28');

      expect(model.distinct).toHaveBeenCalledWith('hour', {
        date: '2026-10-28',
        status: { $ne: AppointmentStatus.CANCELLED },
      });
      expect(horas).toEqual(['09:30', '11:00']);
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

      // Como llega en producción: instancia del DTO (claves no enviadas = undefined)
      const dto = Object.assign(new UpdateAppointmentDto(), {
        status: AppointmentStatus.CANCELLED,
      });

      await service.update(id, dto, paciente);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { status: AppointmentStatus.CANCELLED },
        expect.anything(),
      );
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

    it('no deja mover el turno a un horario ocupado y excluye al propio turno del chequeo', async () => {
      model.findById.mockReturnValue({
        exec: () =>
          Promise.resolve({
            ...propio(AppointmentStatus.PENDING),
            date: '2026-10-28',
            hour: '09:30',
          }),
      });
      model.exists.mockResolvedValue({ _id: 'otro' });

      await expect(
        service.update(id, { hour: '10:00' }, admin),
      ).rejects.toThrow(ConflictException);
      expect(model.exists).toHaveBeenCalledWith({
        date: '2026-10-28',
        hour: '10:00',
        status: { $ne: AppointmentStatus.CANCELLED },
        _id: { $ne: id },
      });
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('el administrador puede mover un turno a un horario ocupado si es sobreturno', async () => {
      model.findById.mockReturnValue({
        exec: () =>
          Promise.resolve({
            ...propio(AppointmentStatus.PENDING),
            date: '2026-10-28',
            hour: '09:30',
          }),
      });
      model.findByIdAndUpdate.mockReturnValue({
        exec: () => Promise.resolve({}),
      });
      model.exists.mockResolvedValue({ _id: 'otro' });

      await service.update(id, { hour: '10:00', is_overbooking: true }, admin);

      expect(model.exists).not.toHaveBeenCalled();
      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('un paciente no puede marcar su turno como sobreturno', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(propio(AppointmentStatus.PENDING)),
      });

      await expect(
        service.update(id, { is_overbooking: true }, paciente),
      ).rejects.toThrow(ForbiddenException);
    });

    it('reactivar un turno cancelado también exige horario libre', async () => {
      model.findById.mockReturnValue({
        exec: () =>
          Promise.resolve({
            ...propio(AppointmentStatus.CANCELLED),
            date: '2026-10-28',
            hour: '09:30',
          }),
      });
      model.exists.mockResolvedValue({ _id: 'otro' });

      await expect(
        service.update(id, { status: AppointmentStatus.CONFIRMED }, admin),
      ).rejects.toThrow(ConflictException);
    });

    it('cancelar nunca consulta el horario', async () => {
      model.findById.mockReturnValue({
        exec: () => Promise.resolve(propio(AppointmentStatus.PENDING)),
      });
      model.findByIdAndUpdate.mockReturnValue({
        exec: () => Promise.resolve({}),
      });

      await service.update(id, { status: AppointmentStatus.CANCELLED }, admin);

      expect(model.exists).not.toHaveBeenCalled();
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
