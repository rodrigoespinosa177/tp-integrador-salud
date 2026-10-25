import { USE_MOCKS_USUARIOS } from '../config';
import { apiUsuarios } from './http';
import { usuarios, esperar, nuevoId } from '../mocks/datos';
import { normalizarUsuario } from '../utils/usuarios';

// Con el token recién obtenido, pide los datos del usuario logueado
async function obtenerPerfil(token) {
  const { data } = await apiUsuarios.get('/usuarios/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizarUsuario(data);
}

export async function login(email, password) {
  if (USE_MOCKS_USUARIOS) {
    await esperar();
    const user = usuarios.find(
      (u) => u.email === email && u.password === password,
    );
    if (!user) throw new Error('Email o contraseña incorrectos');
    const { password: _omitida, ...userSinPassword } = user;
    return { token: 'token-de-prueba', user: userSinPassword };
  }

  const { data } = await apiUsuarios.post('/auth/login', { email, password });
  return {
    token: data.access_token,
    user: await obtenerPerfil(data.access_token),
  };
}

// Registro público: el back siempre asigna el rol paciente
export async function registrar(datos) {
  if (USE_MOCKS_USUARIOS) {
    await esperar();
    if (usuarios.some((u) => u.email === datos.email)) {
      throw new Error('Ya existe un usuario con ese email');
    }
    const nuevo = { _id: nuevoId('u'), ...datos, rol: 'patient' };
    usuarios.push(nuevo);
    const { password: _omitida, ...userSinPassword } = nuevo;
    return { token: 'token-de-prueba', user: userSinPassword };
  }

  const { data } = await apiUsuarios.post('/auth/register', datos);
  return {
    token: data.access_token,
    user: await obtenerPerfil(data.access_token),
  };
}
