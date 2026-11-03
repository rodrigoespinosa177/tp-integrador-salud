import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioDocument } from '../../usuarios/schemas/usuario.schema';

// Devuelve el usuario que cargó JwtStrategy.validate en request.user
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioDocument =>
    ctx.switchToHttp().getRequest().user,
);
