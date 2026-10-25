const env = import.meta.env;

// Cada microservicio se conecta por separado.
// Los mocks se apagan solo si se pone 'false' en el .env
export const USE_MOCKS_USUARIOS = env.VITE_USE_MOCKS_USUARIOS !== 'false';
export const USE_MOCKS_TURNOS = env.VITE_USE_MOCKS_TURNOS !== 'false';

// Todo pasa por el api-gateway
export const API_USUARIOS =
  env.VITE_API_USUARIOS_URL || 'http://localhost:3000';
export const API_TURNOS = env.VITE_API_TURNOS_URL || 'http://localhost:3000';
