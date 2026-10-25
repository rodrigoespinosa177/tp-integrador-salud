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
import { Appointment } from './appointment.schema';
import { AppointmentsService } from './appointments.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const idParam = { name: 'id', description: 'ObjectId del turno' };

@ApiTags('appointments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token faltante o inválido' })
@ApiForbiddenResponse({ description: 'Sin permisos para esta operación' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Rol.ADMINISTRATOR, Rol.PATIENT)
  @ApiOperation({
    summary:
      'Crear un turno (paciente: para sí mismo; administrador: para cualquier paciente)',
  })
  @ApiCreatedResponse({
    description: 'Turno creado (estado pending por defecto)',
    type: Appointment,
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar turnos (el paciente solo ve los suyos; filtro opcional por paciente para el resto)',
  })
  @ApiQuery({
    name: 'patient_id',
    required: false,
    description: 'Devuelve solo los turnos de este paciente',
  })
  @ApiOkResponse({ description: 'Lista de turnos', type: [Appointment] })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('patient_id') patientId?: string,
  ) {
    return this.appointmentsService.findAll(user, patientId);
  }

  // Va antes de :id para que "availability" no se tome como un id
  @Get('availability')
  @ApiOperation({
    summary: 'Horas ya reservadas en una fecha (cualquier usuario logueado)',
  })
  @ApiQuery({
    name: 'date',
    description: 'Fecha a consultar, formato YYYY-MM-DD',
    example: '2026-10-28',
  })
  @ApiOkResponse({
    description: 'Horas ocupadas, ordenadas',
    schema: { type: 'array', items: { type: 'string', example: '09:30' } },
  })
  @ApiBadRequestResponse({ description: 'Fecha inválida' })
  occupiedHours(@Query() query: AvailabilityQueryDto) {
    return this.appointmentsService.occupiedHours(query.date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno por id' })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Turno encontrado', type: Appointment })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.findOneFor(id, user);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRATOR, Rol.PATIENT)
  @ApiOperation({
    summary:
      'Actualizar un turno (el paciente solo puede cancelar el suyo; el administrador puede todo)',
  })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Turno actualizado', type: Appointment })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRATOR)
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar un turno (solo administrador)' })
  @ApiParam(idParam)
  @ApiNoContentResponse({ description: 'Turno eliminado' })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
