import axios from 'axios';
import { API_USUARIOS, API_TURNOS } from '../config';

function crearCliente(baseURL) {
  const cliente = axios.create({ baseURL });

  cliente.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return cliente;
}

export const apiUsuarios = crearCliente(API_USUARIOS);
export const apiTurnos = crearCliente(API_TURNOS);
