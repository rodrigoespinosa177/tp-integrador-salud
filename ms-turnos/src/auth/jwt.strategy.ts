import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from './auth-user';
import { Rol } from './rol.enum';

// El token lo firma ms-usuarios con el mismo JWT_SECRET; acá solo se verifica
// la firma, sin consultar la base de usuarios.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('Falta la variable de entorno JWT_SECRET');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(
    req: { headers: { authorization?: string } },
    payload: { sub: string; email: string; rol: Rol },
  ): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      token: req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '',
    };
  }
}
