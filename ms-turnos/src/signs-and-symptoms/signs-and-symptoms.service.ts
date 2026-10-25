import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '../appointments/appointment-status.enum';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { AppointmentsService } from '../appointments/appointments.service';
import { CreateSignAndSymptomDto } from './dto/create-sign-and-symptom.dto';
import { UpdateSignAndSymptomDto } from './dto/update-sign-and-symptom.dto';
import {
  SignAndSymptom,
  SignAndSymptomDocument,
} from './sign-and-symptom.schema';

@Injectable()
export class SignsAndSymptomsService {
  constructor(
    @InjectModel(SignAndSymptom.name)
    private readonly signModel: Model<SignAndSymptomDocument>,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async create(dto: CreateSignAndSymptomDto): Promise<SignAndSymptomDocument> {
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

    const registro = await this.signModel.create(dto);

    // Registrar los signos es la atención: el turno pasa a "atendido"
    if (turno.status !== AppointmentStatus.COMPLETED) {
      await this.appointmentsService.update(dto.medical_appointment_id, {
        status: AppointmentStatus.COMPLETED,
      });
    }

    return registro;
  }

  findAll(appointmentId?: string): Promise<SignAndSymptomDocument[]> {
    const filter = appointmentId
      ? { medical_appointment_id: appointmentId }
      : {};
    return this.signModel.find(filter).sort({ date: 1 }).exec();
  }

  async findByAppointment(
    appointmentId: string,
  ): Promise<SignAndSymptomDocument[]> {
    await this.appointmentsService.findOne(appointmentId);
    return this.findAll(appointmentId);
  }

  async findOne(id: string): Promise<SignAndSymptomDocument> {
    const sign = isValidObjectId(id)
      ? await this.signModel.findById(id).exec()
      : null;
    if (!sign) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
    return sign;
  }

  async update(
    id: string,
    dto: UpdateSignAndSymptomDto,
  ): Promise<SignAndSymptomDocument> {
    const sign = isValidObjectId(id)
      ? await this.signModel
          .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
          .exec()
      : null;
    if (!sign) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
    return sign;
  }

  async remove(id: string): Promise<void> {
    const deleted = isValidObjectId(id)
      ? await this.signModel.findByIdAndDelete(id).exec()
      : null;
    if (!deleted) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
  }
}
