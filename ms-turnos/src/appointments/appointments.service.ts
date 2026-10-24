import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
  ) {}

  create(dto: CreateAppointmentDto): Promise<AppointmentDocument> {
    return this.appointmentModel.create(dto);
  }

  findAll(patientId?: string): Promise<AppointmentDocument[]> {
    const filter = patientId ? { patient_id: patientId } : {};
    return this.appointmentModel.find(filter).sort({ date: 1, hour: 1 }).exec();
  }

  async findOne(id: string): Promise<AppointmentDocument> {
    const appointment = isValidObjectId(id)
      ? await this.appointmentModel.findById(id).exec()
      : null;
    if (!appointment) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
    return appointment;
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentDocument> {
    const appointment = isValidObjectId(id)
      ? await this.appointmentModel
          .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
          .exec()
      : null;
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
}
