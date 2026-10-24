import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from './enums/rol.enum';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario (registro público o admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuarios (Solo Administrator)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios activos.' })
  @ApiResponse({ status: 401, description: 'No autorizado (falta token).' })
  @ApiResponse({ status: 403, description: 'Prohibido (rol insuficiente).' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRATOR, Rol.NURSE, Rol.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  findById(@Param('id') id: string) {
    return this.usuariosService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRATOR, Rol.NURSE, Rol.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario por ID' })
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar usuario (Solo Administrator)' })
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}