import { Field, InputType } from '@nestjs/graphql';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Se declaran los campos a mano (en vez de PartialType) porque el PartialType de
// @nestjs/graphql no copia la metadata de Swagger y el body quedaría vacío en /api/docs.
// medical_appointment_id y nurse_id no se pueden modificar.
@InputType()
export class UpdateSignAndSymptomDto {
  @ApiPropertyOptional({ example: 'PA 120/80 · T 36.5 °C · FC 72 · SpO2 98%' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  vital_signs?: string;

  @ApiPropertyOptional({ example: 'Cefalea frontal desde hace 2 días' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  symptoms?: string;

  @ApiPropertyOptional({ example: 'Se indica hidratación y control' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  observations?: string;

  @ApiPropertyOptional({ example: '2026-10-28T09:45:00.000Z' })
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;
}
