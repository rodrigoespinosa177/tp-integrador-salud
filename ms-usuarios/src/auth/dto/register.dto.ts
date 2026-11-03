import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del paciente' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del paciente' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: '40123456', description: 'DNI del paciente (solo números)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7,8}$/, { message: 'El DNI debe tener 7 u 8 dígitos numéricos' })
  dni: string;

  @ApiProperty({ example: 'juan.perez@test.com', description: 'Correo único' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+5492611234567', description: 'Teléfono de contacto' })
  @IsString()
  @IsOptional()
  phone?: string;
}