import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateSignAndSymptomDto } from './dto/create-sign-and-symptom.dto';
import { UpdateSignAndSymptomDto } from './dto/update-sign-and-symptom.dto';
import { SignAndSymptom } from './sign-and-symptom.schema';
import { SignsAndSymptomsService } from './signs-and-symptoms.service';

const idParam = { name: 'id', description: 'ObjectId del registro' };

@ApiTags('signs-and-symptoms')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token faltante o inválido' })
@ApiForbiddenResponse({ description: 'Sin permisos para esta operación' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('signs-and-symptoms')
export class SignsAndSymptomsController {
  constructor(private readonly signsService: SignsAndSymptomsService) {}

  @Post()
  @Roles(Rol.NURSE)
  @ApiOperation({
    summary: 'Registrar signos y síntomas de un turno (solo enfermero)',
  })
  @ApiCreatedResponse({ description: 'Registro creado', type: SignAndSymptom })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  create(@Body() dto: CreateSignAndSymptomDto, @CurrentUser() user: AuthUser) {
    return this.signsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar registros (el paciente solo ve los de sus turnos; filtro opcional por turno)',
  })
  @ApiQuery({
    name: 'medical_appointment_id',
    required: false,
    description: 'Devuelve solo los registros de este turno',
  })
  @ApiOkResponse({ description: 'Lista de registros', type: [SignAndSymptom] })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('medical_appointment_id') appointmentId?: string,
  ) {
    return this.signsService.findAll(user, appointmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un registro por id' })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Registro encontrado', type: SignAndSymptom })
  @ApiNotFoundResponse({ description: 'El registro no existe' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.signsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Rol.NURSE, Rol.ADMINISTRATOR)
  @ApiOperation({
    summary:
      'Actualizar un registro (el enfermero solo los suyos; el administrador cualquiera)',
  })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Registro actualizado', type: SignAndSymptom })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'El registro no existe' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSignAndSymptomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Rol.NURSE, Rol.ADMINISTRATOR)
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Eliminar un registro (el enfermero solo los suyos; el administrador cualquiera)',
  })
  @ApiParam(idParam)
  @ApiNoContentResponse({ description: 'Registro eliminado' })
  @ApiNotFoundResponse({ description: 'El registro no existe' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.signsService.remove(id, user);
  }
}

// Ruta que consume el frontend: GET /appointments/:id/signs
@ApiTags('signs-and-symptoms')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token faltante o inválido' })
@ApiForbiddenResponse({ description: 'Sin permisos para esta operación' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentSignsController {
  constructor(private readonly signsService: SignsAndSymptomsService) {}

  @Get(':id/signs')
  @ApiOperation({
    summary:
      'Listar los signos y síntomas de un turno (el paciente solo de los suyos)',
  })
  @ApiParam({ name: 'id', description: 'ObjectId del turno' })
  @ApiOkResponse({ description: 'Lista de registros', type: [SignAndSymptom] })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  findByAppointment(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.signsService.findByAppointment(id, user);
  }
}
