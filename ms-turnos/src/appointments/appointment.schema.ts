import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { AppointmentStatus } from './appointment-status.enum';

export type AppointmentDocument = HydratedDocument<Appointment>;

@ObjectType()
@Schema({ collection: 'medical_appointments', timestamps: true })
export class Appointment {
  @ApiProperty({ example: '665f1c2e8b3a4c0012a4d999' })
  @Field(() => ID)
  _id: string;

  @ApiProperty({ example: '665f1c2e8b3a4c0012a4d111' })
  @Field()
  @Prop({ required: true, index: true })
  patient_id: string;

  @ApiProperty({ example: '2026-10-28', description: 'Formato YYYY-MM-DD' })
  @Field()
  @Prop({ required: true })
  date: string;

  @ApiProperty({ example: '09:30', description: 'Formato HH:mm' })
  @Field()
  @Prop({ required: true })
  hour: string;

  @ApiProperty({ enum: AppointmentStatus, example: 'pending' })
  @Field(() => AppointmentStatus)
  @Prop({
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @ApiProperty({ example: 'Control general' })
  @Field()
  @Prop({ required: true })
  motive: string;

  @ApiProperty({
    example: '665f1c2e8b3a4c0012a4d111',
    description: 'Id del usuario que asignó el turno',
  })
  @Field()
  @Prop({ required: true })
  assigned_by_id: string;

  @ApiProperty({
    example: false,
    description:
      'Sobreturno: turno extra en un horario que ya tiene otro. Solo lo carga el administrador',
  })
  @Field()
  @Prop({ type: Boolean, default: false })
  is_overbooking: boolean;

  @ApiPropertyOptional({ example: '2026-10-23T22:05:46.429Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2026-10-23T22:05:46.429Z' })
  updatedAt?: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Un solo turno activo por fecha y hora; los cancelados no ocupan el horario y los
// sobreturnos (is_overbooking: true) quedan fuera del índice a propósito.
// (Mongo no admite $ne en un filtro parcial, por eso se listan los estados activos
// y se pide is_overbooking: false; los turnos viejos sin el campo no entran al índice,
// pero el chequeo del servicio los sigue cubriendo.)
AppointmentSchema.index(
  { date: 1, hour: 1 },
  {
    unique: true,
    partialFilterExpression: {
      is_overbooking: false,
      status: {
        $in: [
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.COMPLETED,
        ],
      },
    },
  },
);
