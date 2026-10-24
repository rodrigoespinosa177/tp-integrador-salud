import { USE_MOCKS_USUARIOS } from '../config';
import { apiUsuarios } from './http';
import { usuarios, esperar } from '../mocks/datos';
import { normalizarUsuario } from '../utils/usuarios';

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

  //El back devuelve solo el token
  const { data } = await apiUsuarios.post('/auth/login', { email, password });
  const token = data.access_token;

  //Con ese token pedimos los datos del usuario logueado
  const { data: user } = await apiUsuarios.get('/usuarios/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  return { token, user: normalizarUsuario(user) };
}
