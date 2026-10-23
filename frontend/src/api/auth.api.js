import { USE_MOCKS } from '../config';
import { apiUsuarios } from './http';
import { usuarios, esperar } from '../mocks/datos';

export async function login(email, password) {
  if (USE_MOCKS) {
    await esperar();
    const user = usuarios.find(
      (u) => u.email === email && u.password === password,
    );
    if (!user) throw new Error('Email o contraseña incorrectos');
    const { password: _omitida, ...userSinPassword } = user;
    return { token: 'token-de-prueba', user: userSinPassword };
  }

  const { data } = await apiUsuarios.post('/auth/login', { email, password });
  return data;
}
