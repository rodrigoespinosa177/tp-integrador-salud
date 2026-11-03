import { ARRANQUE } from '../utils/arranque';

// Recuerda qué guías ya se mostraron en este arranque de la app.
// Cada guía aparece sola una vez por arranque; al recargar la página no vuelve,
// con un nuevo "npm run dev" (o un nuevo build) sí. Siempre se puede abrir a mano.
const PREFIJO = 'ambo-guia-';

export function yaSeVioLaGuia(clave) {
  try {
    return localStorage.getItem(PREFIJO + clave) === ARRANQUE;
  } catch {
    return true;
  }
}

export function marcarGuiaVista(clave) {
  try {
    localStorage.setItem(PREFIJO + clave, ARRANQUE);
  } catch {
    // Sin almacenamiento disponible: la guía vuelve a aparecer, no se rompe nada
  }
}
