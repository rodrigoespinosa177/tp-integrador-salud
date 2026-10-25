import { Field, InputType } from '@nestjs/graphql';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { AppointmentStatus } from '../appointment-status.enum';

// Se declaran los campos a mano (en vez de PartialType) porque el PartialType de
// @nestjs/graphql no copia la metadata de Swagger y el body quedaría vacío en /api/docs.
// assigned_by_id no se puede modificar.
@InputType()
export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: '665f1c2e8b3a4c0012a4d111' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  patient_id?: string;

  @ApiPropertyOptional({
    example: '2026-10-28',
    description: 'Formato YYYY-MM-DD',
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({ example: '09:30', description: 'Formato HH:mm' })
  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hour debe tener formato HH:mm',
  })
  hour?: string;

  @ApiPropertyOptional({ example: 'Control general' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  motive?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, example: 'cancelled' })
  @Field(() => AppointmentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
