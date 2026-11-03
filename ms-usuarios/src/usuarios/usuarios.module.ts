import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UsuariosResolver } from './usuarios.resolver';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema';
import { UsuariosSeed } from './seed/usuarios.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosResolver, UsuariosSeed],
  exports: [UsuariosService, MongooseModule],
})
export class UsuariosModule {}