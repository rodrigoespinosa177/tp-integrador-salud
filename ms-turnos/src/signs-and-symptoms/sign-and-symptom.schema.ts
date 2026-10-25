import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type SignAndSymptomDocument = HydratedDocument<SignAndSymptom>;

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
  @Prop({ required: true, index: true })
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

  @ApiPropertyOptional({ example: '2026-10-23T22:05:46.429Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2026-10-23T22:05:46.429Z' })
  updatedAt?: Date;
}

export const SignAndSymptomSchema = SchemaFactory.createForClass(SignAndSymptom);
