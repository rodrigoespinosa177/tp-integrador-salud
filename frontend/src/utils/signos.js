// Igual que el back: un registro se puede modificar solo 5 minutos después de crearse
export const VENTANA_EDICION_MS = 5 * 60 * 1000;

// ¿El enfermero puede editar este registro? Debe ser suyo y estar dentro de la ventana.
// (el back es quien decide: acá solo se decide si mostrar el botón)
export function puedeEditarSigno(registro, usuarioId, ahora = Date.now()) {
  if (registro.nurse_id !== usuarioId) return false;
  const creado = new Date(registro.createdAt ?? registro.date).getTime();
  return ahora - creado <= VENTANA_EDICION_MS;
}
