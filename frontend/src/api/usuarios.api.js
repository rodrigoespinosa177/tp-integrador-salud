import { USE_MOCKS } from '../config';
import { apiUsuarios } from './http';
import { usuarios, esperar, nuevoId } from '../mocks/datos';

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

export async function crearUsuario(datos) {
  if (USE_MOCKS) {
    await esperar();
    if (usuarios.some((u) => u.email === datos.email)) {
      throw new Error('Ya existe un usuario con ese email');
    }
    const nuevo = { _id: nuevoId('u'), ...datos };
    usuarios.push(nuevo);
    const { password: _omitida, ...sinPassword } = nuevo;
    return sinPassword;
  }
  const { data } = await apiUsuarios.post('/users', datos);
  return data;
}

export async function actualizarUsuario(id, cambios) {
  if (USE_MOCKS) {
    await esperar();
    const usuario = usuarios.find((u) => u._id === id);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (
      cambios.email &&
      usuarios.some((u) => u.email === cambios.email && u._id !== id)
    ) {
      throw new Error('Ya existe un usuario con ese email');
    }
    Object.assign(usuario, cambios);
    const { password: _omitida, ...sinPassword } = usuario;
    return sinPassword;
  }
  const { data } = await apiUsuarios.patch(`/users/${id}`, cambios);
  return data;
}

export async function eliminarUsuario(id) {
  if (USE_MOCKS) {
    await esperar();
    const indice = usuarios.findIndex((u) => u._id === id);
    if (indice === -1) throw new Error('Usuario no encontrado');
    usuarios.splice(indice, 1);
    return;
  }
  await apiUsuarios.delete(`/users/${id}`);
}
