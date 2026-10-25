import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { AppointmentStatus } from '../appointments/appointment-status.enum';
import { AppointmentsService } from '../appointments/appointments.service';
import type { AuthUser } from '../auth/auth-user';
import { Rol } from '../auth/rol.enum';
import { AddObservationDto } from './dto/add-observation.dto';
import { CreateSignAndSymptomDto } from './dto/create-sign-and-symptom.dto';
import { UpdateSignAndSymptomDto } from './dto/update-sign-and-symptom.dto';
import {
  SignAndSymptom,
  SignAndSymptomDocument,
} from './sign-and-symptom.schema';

// Pasado este tiempo desde que se creó, un registro ya no se puede modificar ni borrar
export const VENTANA_EDICION_MS = 5 * 60 * 1000;

const MENSAJE_YA_REGISTRADO =
  'Este turno ya tiene signos y síntomas registrados';

@Injectable()
export class SignsAndSymptomsService {
  constructor(
    @InjectModel(SignAndSymptom.name)
    private readonly signModel: Model<SignAndSymptomDocument>,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  // El enfermero que registra es siempre el del token (nurse_id del body se ignora)
  async create(
    dto: CreateSignAndSymptomDto,
    user: AuthUser,
  ): Promise<SignAndSymptomDocument> {
    // Lanza NotFoundException si el turno no existe
    const turno = await this.appointmentsService.findOne(
      dto.medical_appointment_id,
    );

    // Solo se atienden turnos confirmados (o ya atendidos, para sumar otro registro)
    if (
      turno.status !== AppointmentStatus.CONFIRMED &&
      turno.status !== AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Solo se pueden registrar signos en turnos confirmados',
      );
    }

    // Un turno se registra una sola vez
    if (
      await this.signModel.exists({
        medical_appointment_id: dto.medical_appointment_id,
      })
    ) {
      throw new ConflictException(MENSAJE_YA_REGISTRADO);
    }

    const { nurse_id: _ignorado, ...datos } = dto;
    let registro: SignAndSymptomDocument;
    try {
      registro = await this.signModel.create({
        ...datos,
        nurse_id: user.id,
      });
    } catch (error) {
      // Si dos pedidos pasan el chequeo a la vez, el índice único corta al segundo
      if ((error as { code?: number })?.code === 11000) {
        throw new ConflictException(MENSAJE_YA_REGISTRADO);
      }
      throw error;
    }

    // Registrar los signos es la atención: el turno pasa a "atendido"
    if (turno.status !== AppointmentStatus.COMPLETED) {
      await this.appointmentsService.applyUpdate(dto.medical_appointment_id, {
        status: AppointmentStatus.COMPLETED,
      });
    }

    return registro;
  }

  async findAll(
    user: AuthUser,
    appointmentId?: string,
  ): Promise<SignAndSymptomDocument[]> {
    if (user.rol !== Rol.PATIENT) {
      const filter = appointmentId
        ? { medical_appointment_id: appointmentId }
        : {};
      return this.signModel.find(filter).sort({ date: 1 }).exec();
    }

    // Un paciente solo ve los registros de sus propios turnos
    if (appointmentId) {
      await this.appointmentsService.findOneFor(appointmentId, user);
      return this.signModel
        .find({ medical_appointment_id: appointmentId })
        .sort({ date: 1 })
        .exec();
    }
    const propios = await this.appointmentsService.findAll(user);
    return this.signModel
      .find({
        medical_appointment_id: { $in: propios.map((t) => String(t._id)) },
      })
      .sort({ date: 1 })
      .exec();
  }

  async findByAppointment(
    appointmentId: string,
    user: AuthUser,
  ): Promise<SignAndSymptomDocument[]> {
    await this.appointmentsService.findOneFor(appointmentId, user);
    return this.findAll(user, appointmentId);
  }

  async findOne(id: string, user: AuthUser): Promise<SignAndSymptomDocument> {
    const sign = await this.findById(id);
    if (user.rol === Rol.PATIENT) {
      await this.appointmentsService.findOneFor(
        sign.medical_appointment_id,
        user,
      );
    }
    return sign;
  }

  async update(
    id: string,
    dto: UpdateSignAndSymptomDto,
    user: AuthUser,
  ): Promise<SignAndSymptomDocument> {
    await this.findEditable(id, user);
    // El DTO transformado trae todas las claves; las no enviadas valen undefined
    const cambios = Object.fromEntries(
      Object.entries(dto).filter(([, valor]) => valor !== undefined),
    );
    const sign = await this.signModel
      .findByIdAndUpdate(id, cambios, { new: true, runValidators: true })
      .exec();
    if (!sign) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
    return sign;
  }

  // Pasada la ventana de edición el registro queda cerrado, pero cualquier enfermero
  // puede sumarle notas de seguimiento. Solo se agregan: no se editan ni se borran.
  async addObservation(
    id: string,
    dto: AddObservationDto,
    user: AuthUser,
  ): Promise<SignAndSymptomDocument> {
    await this.findById(id);
    const sign = await this.signModel
      .findByIdAndUpdate(
        id,
        {
          $push: {
            additional_observations: {
              text: dto.text,
              nurse_id: user.id,
              date: new Date(),
            },
          },
        },
        { new: true, runValidators: true },
      )
      .exec();
    if (!sign) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
    return sign;
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.findEditable(id, user);
    await this.signModel.findByIdAndDelete(id).exec();
  }

  private async findById(id: string): Promise<SignAndSymptomDocument> {
    const sign = isValidObjectId(id)
      ? await this.signModel.findById(id).exec()
      : null;
    if (!sign) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
    return sign;
  }

  // Solo dentro de los primeros 5 minutos (para todos los roles). Un enfermero
  // modifica únicamente sus propios registros; el administrador cualquiera.
  private async findEditable(
    id: string,
    user: AuthUser,
  ): Promise<SignAndSymptomDocument> {
    const sign = await this.findById(id);
    const creado = sign.createdAt?.getTime() ?? 0;
    if (Date.now() - creado > VENTANA_EDICION_MS) {
      throw new ForbiddenException(
        'Solo se puede modificar un registro dentro de los 5 minutos de su creación',
      );
    }
    if (user.rol === Rol.NURSE && sign.nurse_id !== user.id) {
      throw new ForbiddenException('Este registro lo cargó otro enfermero');
    }
    return sign;
  }
}
