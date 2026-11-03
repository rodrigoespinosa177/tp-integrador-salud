import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import type { AuthUser } from '../auth/auth-user';
import { Rol } from '../auth/rol.enum';
import { UsuariosClient } from '../auth/usuarios-client.service';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment, AppointmentDocument } from './appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

// Quita las propiedades sin valor: el DTO transformado las trae todas como undefined
function soloDefinidos(dto: UpdateAppointmentDto): UpdateAppointmentDto {
  return Object.fromEntries(
    Object.entries(dto).filter(([, valor]) => valor !== undefined),
  );
}

const MENSAJE_HORARIO_OCUPADO = 'Ya hay un turno reservado en esa fecha y hora';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly usuariosClient: UsuariosClient,
  ) {}

  async create(
    dto: CreateAppointmentDto,
    user: AuthUser,
  ): Promise<AppointmentDocument> {
    const {
      patient_id: _p,
      assigned_by_id: _a,
      status,
      is_overbooking: sobreturno,
      ...datos
    } = dto;

    if (user.rol === Rol.PATIENT) {
      // Un paciente solo se saca turnos a sí mismo y siempre quedan pendientes
      if (dto.patient_id && dto.patient_id !== user.id) {
        throw new ForbiddenException('Solo podés sacar turnos para vos');
      }
      if (sobreturno) {
        throw new ForbiddenException(
          'Solo el administrador puede dar sobreturnos',
        );
      }
      await this.assertHorarioLibre(dto.date, dto.hour);
      return this.crear({
        ...datos,
        patient_id: user.id,
        assigned_by_id: user.id,
      });
    }

    if (!dto.patient_id) {
      throw new BadRequestException('patient_id es obligatorio');
    }
    await this.usuariosClient.assertPacienteActivo(dto.patient_id, user.token);
    // Un sobreturno se salta la regla de horario único
    if (status !== AppointmentStatus.CANCELLED && !sobreturno) {
      await this.assertHorarioLibre(dto.date, dto.hour);
    }
    return this.crear({
      ...datos,
      status,
      is_overbooking: Boolean(sobreturno),
      patient_id: dto.patient_id,
      assigned_by_id: user.id,
    });
  }

  async findAll(
    user: AuthUser,
    patientId?: string,
  ): Promise<AppointmentDocument[]> {
    if (user.rol === Rol.PATIENT) {
      if (patientId && patientId !== user.id) {
        throw new ForbiddenException('Solo podés ver tus propios turnos');
      }
      patientId = user.id;
    }
    const filter = patientId ? { patient_id: patientId } : {};
    return this.appointmentModel.find(filter).sort({ date: 1, hour: 1 }).exec();
  }

  // Horas ya reservadas (turnos no cancelados) de una fecha. No expone datos de
  // pacientes, por eso la puede consultar cualquier usuario logueado.
  occupiedHours(date: string): Promise<string[]> {
    return this.appointmentModel
      .distinct('hour', {
        date,
        status: { $ne: AppointmentStatus.CANCELLED },
      })
      .exec()
      .then((horas) => [...horas].sort());
  }

  // Sin chequeo de permisos: para uso interno de otros servicios
  async findOne(id: string): Promise<AppointmentDocument> {
    const appointment = isValidObjectId(id)
      ? await this.appointmentModel.findById(id).exec()
      : null;
    if (!appointment) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
    return appointment;
  }

  // Un paciente solo puede ver sus turnos; administrador y enfermero ven todos
  async findOneFor(id: string, user: AuthUser): Promise<AppointmentDocument> {
    const appointment = await this.findOne(id);
    if (user.rol === Rol.PATIENT && appointment.patient_id !== user.id) {
      throw new ForbiddenException('Este turno no es tuyo');
    }
    return appointment;
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    user: AuthUser,
  ): Promise<AppointmentDocument> {
    const actual = await this.findOneFor(id, user);

    if (user.rol === Rol.PATIENT) {
      // Lo único que puede hacer un paciente es cancelar su turno
      // (con transform, el DTO trae todas las claves; las no enviadas valen undefined)
      const soloCancela =
        Object.keys(soloDefinidos(dto)).length === 1 &&
        dto.status === AppointmentStatus.CANCELLED;
      if (!soloCancela) {
        throw new ForbiddenException(
          'Un paciente solo puede cancelar su turno',
        );
      }
      if (actual.status === AppointmentStatus.COMPLETED) {
        throw new BadRequestException('Un turno atendido no se puede cancelar');
      }
    } else if (dto.patient_id && dto.patient_id !== actual.patient_id) {
      await this.usuariosClient.assertPacienteActivo(
        dto.patient_id,
        user.token,
      );
    }

    // Reservar, mover o reactivar un turno exige que el horario esté libre
    const estadoFinal = dto.status ?? actual.status;
    const cambiaHorario =
      (dto.date !== undefined && dto.date !== actual.date) ||
      (dto.hour !== undefined && dto.hour !== actual.hour) ||
      (actual.status === AppointmentStatus.CANCELLED &&
        estadoFinal !== AppointmentStatus.CANCELLED);
    const esSobreturno = dto.is_overbooking ?? actual.is_overbooking ?? false;
    if (
      estadoFinal !== AppointmentStatus.CANCELLED &&
      cambiaHorario &&
      !esSobreturno
    ) {
      await this.assertHorarioLibre(
        dto.date ?? actual.date,
        dto.hour ?? actual.hour,
        id,
      );
    }

    return this.applyUpdate(id, dto);
  }

  // Cambio de estado hecho por el sistema (ej. al registrar signos); no depende de un usuario
  async applyUpdate(
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentDocument> {
    let appointment: AppointmentDocument | null;
    try {
      appointment = await this.appointmentModel
        .findByIdAndUpdate(id, soloDefinidos(dto), {
          new: true,
          runValidators: true,
        })
        .exec();
    } catch (error) {
      throw this.aConflicto(error);
    }
    if (!appointment) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
    return appointment;
  }

  async remove(id: string): Promise<void> {
    const deleted = isValidObjectId(id)
      ? await this.appointmentModel.findByIdAndDelete(id).exec()
      : null;
    if (!deleted) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
  }

  // Un horario (fecha + hora) admite un solo turno no cancelado, sea cual sea el paciente
  private async assertHorarioLibre(
    date: string,
    hour: string,
    excluirId?: string,
  ): Promise<void> {
    const ocupado = await this.appointmentModel.exists({
      date,
      hour,
      status: { $ne: AppointmentStatus.CANCELLED },
      ...(excluirId && { _id: { $ne: excluirId } }),
    });
    if (ocupado) {
      throw new ConflictException(MENSAJE_HORARIO_OCUPADO);
    }
  }

  private async crear(
    datos: Partial<Appointment>,
  ): Promise<AppointmentDocument> {
    try {
      return await this.appointmentModel.create(datos);
    } catch (error) {
      throw this.aConflicto(error);
    }
  }

  // Si dos pedidos pasan el chequeo a la vez, el índice único corta al segundo
  private aConflicto(error: unknown): unknown {
    return (error as { code?: number })?.code === 11000
      ? new ConflictException(MENSAJE_HORARIO_OCUPADO)
      : error;
  }
}
