import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreateSignAndSymptomDto {
  @ApiProperty({ example: '665f1c2e8b3a4c0012a4d222' })
  @Field()
  @IsString()
  @IsNotEmpty()
  medical_appointment_id: string;

  @ApiPropertyOptional({
    example: '665f1c2e8b3a4c0012a4d111',
    description: 'Se ignora: siempre es el enfermero del token',
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nurse_id?: string;

  @ApiProperty({ example: 'PA 120/80 · T 36.5 °C · FC 72 · SpO2 98%' })
  @Field()
  @IsString()
  @IsNotEmpty()
  vital_signs: string;

  @ApiProperty({ example: 'Cefalea frontal desde hace 2 días' })
  @Field()
  @IsString()
  @IsNotEmpty()
  symptoms: string;

  @ApiProperty({ example: 'Se indica hidratación y control' })
  @Field()
  @IsString()
  @IsNotEmpty()
  observations: string;

  @ApiPropertyOptional({
    example: '2026-10-28T09:45:00.000Z',
    description: 'Por defecto, el momento del registro',
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;
}
