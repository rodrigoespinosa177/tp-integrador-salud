import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type SignAndSymptomDocument = HydratedDocument<SignAndSymptom>;

// Nota de seguimiento que se suma al registro una vez pasada la ventana de edición.
// Solo se agregan: no se editan ni se borran.
@ObjectType()
@Schema({ _id: false })
export class AdditionalObservation {
  @ApiProperty({ example: 'El paciente refiere mejoría' })
  @Field()
  @Prop({ required: true })
  text: string;

  @ApiProperty({
    example: '665f1c2e8b3a4c0012a4d111',
    description: 'Id del enfermero que escribió la nota',
  })
  @Field()
  @Prop({ required: true })
  nurse_id: string;

  @ApiProperty({ example: '2026-10-28T11:20:00.000Z' })
  @Field(() => Date)
  @Prop({ type: Date, default: Date.now })
  date: Date;
}

const AdditionalObservationSchema = SchemaFactory.createForClass(
  AdditionalObservation,
);

@ObjectType()
@Schema({ collection: 'signs_and_symptoms', timestamps: true })
export class SignAndSymptom {
  @ApiProperty({ example: '665f1c2e8b3a4c0012a4d999' })
  @Field(() => ID)
  _id: string;

  @ApiProperty({
    example: '665f1c2e8b3a4c0012a4d222',
    description: 'Id del turno (MedicalAppointment) al que pertenece',
  })
  @Field()
  @Prop({ required: true, unique: true })
  medical_appointment_id: string;

  @ApiProperty({
    example: '665f1c2e8b3a4c0012a4d111',
    description: 'Id del enfermero que registró los signos',
  })
  @Field()
  @Prop({ required: true, index: true })
  nurse_id: string;

  @ApiProperty({ example: '2026-10-28T09:45:00.000Z' })
  @Field(() => Date)
  @Prop({ type: Date, default: Date.now })
  date: Date;

  @ApiProperty({ example: 'PA 120/80 · T 36.5 °C · FC 72 · SpO2 98%' })
  @Field()
  @Prop({ required: true })
  vital_signs: string;

  @ApiProperty({ example: 'Cefalea frontal desde hace 2 días' })
  @Field()
  @Prop({ required: true })
  symptoms: string;

  @ApiProperty({ example: 'Se indica hidratación y control' })
  @Field()
  @Prop({ required: true })
  observations: string;

  @ApiProperty({
    type: [AdditionalObservation],
    description: 'Notas de seguimiento agregadas después del registro',
  })
  @Field(() => [AdditionalObservation])
  @Prop({ type: [AdditionalObservationSchema], default: [] })
  additional_observations: AdditionalObservation[];

  @ApiPropertyOptional({ example: '2026-10-23T22:05:46.429Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2026-10-23T22:05:46.429Z' })
  updatedAt?: Date;
}

export const SignAndSymptomSchema =
  SchemaFactory.createForClass(SignAndSymptom);
