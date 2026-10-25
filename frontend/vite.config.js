import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Simula un navegador para poder renderizar componentes
    environment: 'jsdom',
    // Archivo que se ejecuta antes de cada test
    setupFiles: './src/setupTests.js',
  },
});
