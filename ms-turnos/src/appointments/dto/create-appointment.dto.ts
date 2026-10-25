import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { AppointmentStatus } from '../appointment-status.enum';

@InputType()
export class CreateAppointmentDto {
  @ApiPropertyOptional({
    example: '665f1c2e8b3a4c0012a4d111',
    description:
      'Paciente del turno. Obligatorio para el administrador; si el que crea es un paciente, siempre se usa su propio id',
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  patient_id?: string;

  @ApiProperty({ example: '2026-10-28', description: 'Formato YYYY-MM-DD' })
  @Field()
  @IsDateString({ strict: true })
  date: string;

  @ApiProperty({ example: '09:30', description: 'Formato HH:mm' })
  @Field()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hour debe tener formato HH:mm',
  })
  hour: string;

  @ApiProperty({ example: 'Control general' })
  @Field()
  @IsString()
  @IsNotEmpty()
  motive: string;

  @ApiPropertyOptional({
    example: '665f1c2e8b3a4c0012a4d111',
    description: 'Se ignora: siempre es el usuario del token',
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assigned_by_id?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, default: 'pending' })
  @Field(() => AppointmentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
