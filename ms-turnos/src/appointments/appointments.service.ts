import {
  BadRequestException,
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
    const { patient_id: _p, assigned_by_id: _a, status, ...datos } = dto;

    if (user.rol === Rol.PATIENT) {
      // Un paciente solo se saca turnos a sí mismo y siempre quedan pendientes
      if (dto.patient_id && dto.patient_id !== user.id) {
        throw new ForbiddenException('Solo podés sacar turnos para vos');
      }
      return this.appointmentModel.create({
        ...datos,
        patient_id: user.id,
        assigned_by_id: user.id,
      });
    }

    if (!dto.patient_id) {
      throw new BadRequestException('patient_id es obligatorio');
    }
    await this.usuariosClient.assertPacienteActivo(dto.patient_id, user.token);
    return this.appointmentModel.create({
      ...datos,
      status,
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
      const soloCancela =
        Object.keys(dto).length === 1 &&
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

    return this.applyUpdate(id, dto);
  }

  // Cambio de estado hecho por el sistema (ej. al registrar signos); no depende de un usuario
  applyUpdate(
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentDocument> {
    return this.appointmentModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec()
      .then((appointment) => {
        if (!appointment) {
          throw new NotFoundException(`Turno ${id} no encontrado`);
        }
        return appointment;
      });
  }

  async remove(id: string): Promise<void> {
    const deleted = isValidObjectId(id)
      ? await this.appointmentModel.findByIdAndDelete(id).exec()
      : null;
    if (!deleted) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
  }
}
