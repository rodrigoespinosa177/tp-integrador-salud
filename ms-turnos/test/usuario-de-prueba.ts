import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthUser } from './../src/auth/auth-user';
import { Rol } from './../src/auth/rol.enum';

export const ADMIN: AuthUser = {
  id: 'u1',
  email: 'admin@x.com',
  rol: Rol.ADMINISTRATOR,
  token: 'token-admin',
};
export const ENFERMERO: AuthUser = {
  id: 'u2',
  email: 'nurse@x.com',
  rol: Rol.NURSE,
  token: 'token-nurse',
};
export const PACIENTE: AuthUser = {
  id: 'u3',
  email: 'patient@x.com',
  rol: Rol.PATIENT,
  token: 'token-patient',
};
export const OTRO_PACIENTE: AuthUser = {
  id: 'u9',
  email: 'otro@x.com',
  rol: Rol.PATIENT,
  token: 'token-otro-patient',
};

const USUARIOS: Record<string, AuthUser> = Object.fromEntries(
  [ADMIN, ENFERMERO, PACIENTE, OTRO_PACIENTE].map((u) => [u.token, u]),
);

// Reemplaza al JwtAuthGuard: sin "Authorization: Bearer <token-de-prueba>" responde
// 401; con uno de los tokens de arriba carga el usuario correspondiente en req.user.
export const jwtGuardDePrueba = {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = String(req.headers.authorization ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    const user = USUARIOS[token];
    if (!user) {
      throw new UnauthorizedException();
    }
    req.user = user;
    return true;
  },
};
