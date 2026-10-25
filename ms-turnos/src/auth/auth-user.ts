import { Rol } from './rol.enum';

// Usuario autenticado, armado a partir del JWT que emite ms-usuarios
export interface AuthUser {
  id: string;
  email: string;
  rol: Rol;
  // Token original, para reenviarlo a ms-usuarios en las validaciones internas
  token: string;
}
