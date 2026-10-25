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
import { CreateSignAndSymptomDto } from './dto/create-sign-and-symptom.dto';
import { UpdateSignAndSymptomDto } from './dto/update-sign-and-symptom.dto';
import { SignAndSymptom } from './sign-and-symptom.schema';
import { SignsAndSymptomsService } from './signs-and-symptoms.service';

const idParam = { name: 'id', description: 'ObjectId del registro' };

@ApiTags('signs-and-symptoms')
@Controller('signs-and-symptoms')
export class SignsAndSymptomsController {
  constructor(private readonly signsService: SignsAndSymptomsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar signos y síntomas de un turno' })
  @ApiCreatedResponse({ description: 'Registro creado', type: SignAndSymptom })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  create(@Body() dto: CreateSignAndSymptomDto) {
    return this.signsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar registros (filtro opcional por turno)',
  })
  @ApiQuery({
    name: 'medical_appointment_id',
    required: false,
    description: 'Devuelve solo los registros de este turno',
  })
  @ApiOkResponse({ description: 'Lista de registros', type: [SignAndSymptom] })
  findAll(@Query('medical_appointment_id') appointmentId?: string) {
    return this.signsService.findAll(appointmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un registro por id' })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Registro encontrado', type: SignAndSymptom })
  @ApiNotFoundResponse({ description: 'El registro no existe' })
  findOne(@Param('id') id: string) {
    return this.signsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un registro (campos parciales)' })
  @ApiParam(idParam)
  @ApiOkResponse({ description: 'Registro actualizado', type: SignAndSymptom })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'El registro no existe' })
  update(@Param('id') id: string, @Body() dto: UpdateSignAndSymptomDto) {
    return this.signsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar un registro' })
  @ApiParam(idParam)
  @ApiNoContentResponse({ description: 'Registro eliminado' })
  @ApiNotFoundResponse({ description: 'El registro no existe' })
  remove(@Param('id') id: string) {
    return this.signsService.remove(id);
  }
}

// Ruta que consume el frontend: GET /appointments/:id/signs
@ApiTags('signs-and-symptoms')
@Controller('appointments')
export class AppointmentSignsController {
  constructor(private readonly signsService: SignsAndSymptomsService) {}

  @Get(':id/signs')
  @ApiOperation({ summary: 'Listar los signos y síntomas de un turno' })
  @ApiParam({ name: 'id', description: 'ObjectId del turno' })
  @ApiOkResponse({ description: 'Lista de registros', type: [SignAndSymptom] })
  @ApiNotFoundResponse({ description: 'El turno no existe' })
  findByAppointment(@Param('id') id: string) {
    return this.signsService.findByAppointment(id);
  }
}
