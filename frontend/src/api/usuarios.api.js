import { USE_MOCKS_USUARIOS } from '../config';
import { apiUsuarios } from './http';
import { usuarios, esperar, nuevoId } from '../mocks/datos';
import { normalizarUsuario } from '../utils/usuarios';

function sinPassword({ password: _omitida, ...resto }) {
  return resto;
}

export async function obtenerUsuarios(rol) {
  if (USE_MOCKS_USUARIOS) {
    await esperar();
    return usuarios.filter((u) => !rol || u.rol === rol).map(sinPassword);
  }

  // Los pacientes se piden a /usuarios/pacientes (lo pueden ver admin y enfermero)
  if (rol === 'patient') {
    const { data } = await apiUsuarios.get('/usuarios/pacientes');
    return data.map(normalizarUsuario);
  }

  // El listado completo es solo para el admin
  const { data } = await apiUsuarios.get('/usuarios');
  return data.filter((u) => !rol || u.rol === rol).map(normalizarUsuario);
}

export async function crearUsuario(datos) {
  if (USE_MOCKS_USUARIOS) {
    await esperar();
    if (usuarios.some((u) => u.email === datos.email)) {
      throw new Error('Ya existe un usuario con ese email');
    }
    if (usuarios.some((u) => u.dni === datos.dni)) {
      throw new Error('Ya existe un usuario con ese DNI');
    }
    const nuevo = { _id: nuevoId('u'), ...datos };
    usuarios.push(nuevo);
    return sinPassword(nuevo);
  }
  const { data } = await apiUsuarios.post('/usuarios', datos);
  return normalizarUsuario(data);
}

export async function actualizarUsuario(id, cambios) {
  if (USE_MOCKS_USUARIOS) {
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
    return sinPassword(usuario);
  }
  const { data } = await apiUsuarios.patch(`/usuarios/${id}`, cambios);
  return normalizarUsuario(data);
}

// El propio usuario edita sus datos (no puede cambiar su rol)
export async function actualizarMiPerfil(id, cambios) {
  if (USE_MOCKS_USUARIOS) return actualizarUsuario(id, cambios);
  const { data } = await apiUsuarios.patch('/usuarios/me', cambios);
  return normalizarUsuario(data);
}

export async function eliminarUsuario(id) {
  if (USE_MOCKS_USUARIOS) {
    await esperar();
    const indice = usuarios.findIndex((u) => u._id === id);
    if (indice === -1) throw new Error('Usuario no encontrado');
    usuarios.splice(indice, 1);
    return;
  }
  // En el back es una baja lógica: el usuario queda inactivo
  await apiUsuarios.delete(`/usuarios/${id}`);
}
