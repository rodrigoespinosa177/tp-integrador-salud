import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UsuariosService } from './usuarios.service';
import { UsuarioModel } from './models/usuario.model';
import { Rol } from './enums/rol.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Mismo criterio que el REST: hay que mandar el JWT y ser Administrator
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRATOR)
@Resolver(() => UsuarioModel)
export class UsuariosResolver {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Query(() => [UsuarioModel], {
    name: 'usuarios',
    description: 'Obtener lista de usuarios, opcionalmente filtrados por rol',
  })
  async getUsuarios(
    @Args('rol', { type: () => Rol, nullable: true }) rol?: Rol,
  ): Promise<UsuarioModel[]> {
    const usuarios = await this.usuariosService.findAll();
    if (rol) {
      return usuarios.filter((u) => u.rol === rol) as unknown as UsuarioModel[];
    }
    return usuarios as unknown as UsuarioModel[];
  }

  @Query(() => UsuarioModel, {
    name: 'usuario',
    description: 'Obtener un usuario específico por su ID',
  })
  async getUsuarioById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<UsuarioModel> {
    const usuario = await this.usuariosService.findById(id);
    return usuario as unknown as UsuarioModel;
  }
}