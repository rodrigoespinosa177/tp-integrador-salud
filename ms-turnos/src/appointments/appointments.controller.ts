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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Appointment } from './appointment.schema';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const idParam = { name: 'id', description: 'ObjectId del turno' };

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un turno' })
  @ApiCreatedResponse({
    description: 'Turno creado (estado pending por defecto)',
    type: Appointment,
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar turnos (filtro opcional por paciente)' })
  @ApiQuery({
    name: 'patient_id',
    required: false,
    description: 'Devuelve solo los turnos de este paciente',
  })
  @ApiOkResponse({ description: 'Lista de turnos', type: [Appointment] })
  findAll(@Query('patient_id') patientId?: string) {
    return this.appointmentsService.findAll(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno por id' })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Turno encontrado', type: Appointment })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un turno (campos parciales)' })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Turno actualizado', type: Appointment })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar un turno' })
  @ApiParam(idParam)
  @ApiNoContentResponse({ description: 'Turno eliminado' })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
