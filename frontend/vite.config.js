import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Un número distinto cada vez que se levanta la app: así la intro y las guías
  // aparecen una vez por arranque (ver src/utils/arranque.js)
  define: {
    __ARRANQUE__: JSON.stringify(Date.now().toString()),
  },
  test: {
    // Simula un navegador para poder renderizar componentes
    environment: 'jsdom',
    // Archivo que se ejecuta antes de cada test
    setupFiles: './src/setupTests.js',
  },
});
