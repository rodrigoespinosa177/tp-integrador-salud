import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const usuario = await this.usuariosService.findByEmail(email);

    if (!usuario || !usuario.is_active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: usuario._id,
      email: usuario.email,
      rol: usuario.rol,
      first_name: usuario.first_name,
      last_name: usuario.last_name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: usuario._id,
        email: usuario.email,
        rol: usuario.rol,
        first_name: usuario.first_name,
        last_name: usuario.last_name,
      },
    };
  }
}