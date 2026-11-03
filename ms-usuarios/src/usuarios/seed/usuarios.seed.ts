import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UsuariosService } from '../usuarios.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { Rol } from '../enums/rol.enum';

export const USUARIOS_SEMILLA: CreateUsuarioDto[] = [
  {
    first_name: 'Ruben',
    last_name: 'Ledesma',
    dni: '40111222',
    email: 'ruben.admin@test.com',
    password: 'Password123!',
    rol: Rol.ADMINISTRATOR,
    phone: '+5492611112233',
  },
  {
    first_name: 'Santiago',
    last_name: 'Enfermero',
    dni: '40333444',
    email: 'santiago.enfermero@test.com',
    password: 'Password123!',
    rol: Rol.NURSE,
    phone: '+5492614445566',
  },
  {
    first_name: 'Rodrigo',
    last_name: 'Paciente',
    dni: '40555666',
    email: 'rodrigo.paciente@test.com',
    password: 'Password123!',
    rol: Rol.PATIENT,
    phone: '+5492617778899',
  },
];

// Carga los usuarios de prueba al arrancar. Es idempotente: si el email ya
// existe lo saltea. Se desactiva con SEED_USERS=false.
@Injectable()
export class UsuariosSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsuariosSeed.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  async onApplicationBootstrap() {
    if (process.env.SEED_USERS === 'false') return;

    for (const dto of USUARIOS_SEMILLA) {
      const existe = await this.usuariosService.findByEmail(dto.email);
      if (existe) continue;

      try {
        await this.usuariosService.create(dto);
        this.logger.log(`Usuario semilla creado: ${dto.email} (${dto.rol})`);
      } catch (error: any) {
        this.logger.warn(`No se pudo crear ${dto.email}: ${error.message}`);
      }
    }
  }
}
