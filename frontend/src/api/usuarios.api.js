import { USE_MOCKS } from '../config';
import { apiUsuarios } from './http';
import { usuarios, esperar } from '../mocks/datos';

export async function obtenerUsuarios(rol) {
  if (USE_MOCKS) {
    await esperar();
    return usuarios
      .filter((u) => !rol || u.rol === rol)
      .map(({ password: _omitida, ...u }) => u);
  }
  const { data } = await apiUsuarios.get('/users', {
    params: rol ? { rol } : {},
  });
  return data;
}
