import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Rol } from '../usuarios/enums/rol.enum';
import { UsuarioDocument } from '../usuarios/schemas/usuario.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<UsuarioDocument> {
    const user = await this.usuariosService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Un usuario dado de baja (eliminación lógica) no puede iniciar sesión
    if (!user.is_active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      rol: user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    // Forzamos el rol PATIENT en el backend
    const nuevoUsuario = {
      ...registerDto,
      rol: Rol.PATIENT,
    };

    const usuarioCreado = await this.usuariosService.create(nuevoUsuario);

    const payload = {
      sub: usuarioCreado._id.toString(),
      email: usuarioCreado.email,
      rol: usuarioCreado.rol,
    };

    return {
      message: 'Paciente registrado exitosamente',
      usuario: {
        id: usuarioCreado._id,
        email: usuarioCreado.email,
        dni: usuarioCreado.dni,
        first_name: usuarioCreado.first_name,
        last_name: usuarioCreado.last_name,
        rol: usuarioCreado.rol,
      },
      access_token: this.jwtService.sign(payload),
    };
  }
}