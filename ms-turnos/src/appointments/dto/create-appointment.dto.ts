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
  @ApiProperty({ example: '665f1c2e8b3a4c0012a4d111' })
  @Field()
  @IsString()
  @IsNotEmpty()
  patient_id: string;

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

  @ApiProperty({ example: '665f1c2e8b3a4c0012a4d111' })
  @Field()
  @IsString()
  @IsNotEmpty()
  assigned_by_id: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, default: 'pending' })
  @Field(() => AppointmentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
