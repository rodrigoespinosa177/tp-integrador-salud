// Decide si se muestra la presentación animada.
// Sale una vez cada vez que se levanta la app: al recargar no se repite, pero
// con un nuevo "npm run dev" (o un nuevo build de Docker) vuelve a aparecer.
// Se puede forzar agregando ?intro a la dirección (por ejemplo: localhost:5173/?intro).
import { ARRANQUE } from '../../utils/arranque';

const CLAVE = 'ambo-intro-vista';

export function debeMostrarseIntro() {
  try {
    if (new URLSearchParams(window.location.search).has('intro')) return true;
    // Si la persona pidió "reducir movimiento" en su sistema, no se muestra sola
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return false;
    return localStorage.getItem(CLAVE) !== ARRANQUE;
  } catch {
    return false;
  }
}

export function marcarIntroVista() {
  try {
    localStorage.setItem(CLAVE, ARRANQUE);
  } catch {
    // Sin almacenamiento disponible: va a volver a salir, no se rompe nada
  }
}
