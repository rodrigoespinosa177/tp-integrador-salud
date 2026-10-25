import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  ParseEnumPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Rol } from './enums/rol.enum';
import { EstadoUsuarios } from './enums/estado-usuarios.enum';
import type { UsuarioDocument } from './schemas/usuario.schema';

// Todos los endpoints requieren estar logueado. Los de /me los puede usar cualquier
// rol; el resto (CRUD de usuarios) está restringido a Administrator con @Roles.
@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Las rutas /me y /dni/:dni van antes de /:id para que no se confundan con un ID.

  @Get('me')
  @ApiOperation({
    summary: 'Ver mi propio perfil (cualquier usuario logueado)',
  })
  @ApiResponse({ status: 200, description: 'Datos del usuario logueado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  getPerfil(@CurrentUser() usuario: UsuarioDocument) {
    return this.usuariosService.findById(usuario._id.toString());
  }

  @Patch('me')
  @ApiOperation({
    summary:
      'Modificar mis propios datos (cualquier usuario logueado, sin poder cambiar rol ni estado)',
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o campos no permitidos (rol, is_active).',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 409, description: 'El email o el DNI ya existen.' })
  updatePerfil(
    @CurrentUser() usuario: UsuarioDocument,
    @Body() updatePerfilDto: UpdatePerfilDto,
  ) {
    return this.usuariosService.update(usuario._id.toString(), updatePerfilDto);
  }

  @Get('dni/:dni')
  @Roles(Rol.ADMINISTRATOR)
  @ApiOperation({ summary: 'Buscar un usuario por DNI (solo Administrator)' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido: se requiere rol Administrator.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un usuario con ese DNI.',
  })
  findByDni(@Param('dni') dni: string) {
    return this.usuariosService.findByDni(dni);
  }

  @Get('pacientes')
  @Roles(Rol.ADMINISTRATOR, Rol.NURSE)
  @ApiOperation({
    summary: 'Listar los pacientes activos (Administrator y Nurse)',
  })
  @ApiResponse({ status: 200, description: 'Lista de pacientes activos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido: se requiere rol Administrator o Nurse.',
  })
  findPacientes() {
    return this.usuariosService.findPacientes();
  }

  @Post()
  @Roles(Rol.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Creación administrativa de usuarios (solo Administrator)',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado: token faltante o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido: se requiere rol Administrator.',
  })
  @ApiResponse({ status: 409, description: 'El email o el DNI ya existen.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @Roles(Rol.ADMINISTRATOR)
  @ApiOperation({
    summary:
      'Listar los usuarios del sistema, por defecto solo los activos (solo Administrator)',
  })
  @ApiQuery({
    name: 'estado',
    enum: EstadoUsuarios,
    required: false,
    description: 'Filtra por estado. Si se omite, devuelve solo los activos.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.' })
  @ApiResponse({ status: 400, description: 'Valor de estado inválido.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido: se requiere rol Administrator.',
  })
  findAll(
    @Query(
      'estado',
      new ParseEnumPipe(EstadoUsuarios, { optional: true }),
    )
    estado?: EstadoUsuarios,
  ) {
    return this.usuariosService.findAll(estado);
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Obtener el detalle de un usuario por su ID (solo Administrator)',
  })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido: se requiere rol Administrator.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.usuariosService.findById(id);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRATOR)
  @ApiOperation({
    summary:
      'Modificar los datos de cualquier usuario, incluido rol y estado (solo Administrator)',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido: se requiere rol Administrator.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'El email o el DNI ya existen.' })
  update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @CurrentUser() usuario: UsuarioDocument,
  ) {
    // Evita que el admin se quite sus propios permisos o se desactive por esta vía
    const esUnoMismo = id === usuario._id.toString();
    const cambiaRol =
      updateUsuarioDto.rol !== undefined &&
      updateUsuarioDto.rol !== usuario.rol;
    if (esUnoMismo && (cambiaRol || updateUsuarioDto.is_active === false)) {
      throw new ForbiddenException(
        'No podés cambiar tu propio rol ni desactivarte a vos mismo',
      );
    }
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRATOR)
  @ApiOperation({
    summary:
      'Eliminación lógica: desactiva al usuario sin borrarlo de la BD (solo Administrator)',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario desactivado correctamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido: se requiere rol Administrator.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  remove(@Param('id') id: string, @CurrentUser() usuario: UsuarioDocument) {
    if (id === usuario._id.toString()) {
      throw new ForbiddenException(
        'Un administrador no puede eliminarse a sí mismo',
      );
    }
    return this.usuariosService.remove(id);
  }
}
