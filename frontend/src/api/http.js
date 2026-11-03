import axios from 'axios';
import { API_USUARIOS, API_TURNOS } from '../config';

function crearCliente(baseURL) {
  const cliente = axios.create({ baseURL });

  // Agrega el token a cada pedido
  cliente.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Ordena los errores que devuelve el back
  cliente.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
      const mensaje = error.response?.data?.message;
      if (mensaje) {
        // NestJS devuelve una lista cuando fallan varias validaciones
        const texto = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
        error.response.data.message = texto;
        error.message = texto;
      }

      // Token vencido o inválido: cerramos la sesión (salvo en el login)
      const esLogin = error.config?.url?.startsWith('/auth/');
      if (error.response?.status === 401 && !esLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      return Promise.reject(error);
    },
  );

  return cliente;
}

export const apiUsuarios = crearCliente(API_USUARIOS);
export const apiTurnos = crearCliente(API_TURNOS);
