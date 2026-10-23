export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
export const API_USUARIOS =
  import.meta.env.VITE_API_USUARIOS_URL || 'http://localhost:3001';
export const API_TURNOS =
  import.meta.env.VITE_API_TURNOS_URL || 'http://localhost:3002';
