// Identificador que cambia cada vez que se levanta la app (npm run dev) o se
// construye de nuevo (npm run build, docker compose up --build).
// Se define en vite.config.js. La intro y las guías lo guardan para saber que
// ya aparecieron en este arranque: al recargar la página no vuelven a salir,
// pero al levantar la app de nuevo sí.

/* global __ARRANQUE__ */
// typeof evita un error si falta la definición (por ejemplo, en algún test)
export const ARRANQUE =
  typeof __ARRANQUE__ !== 'undefined' ? String(__ARRANQUE__) : 'sin-arranque';
