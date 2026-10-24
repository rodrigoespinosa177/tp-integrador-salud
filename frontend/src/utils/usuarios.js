export const ETIQUETA_ROL = {
  patient: 'Paciente',
  nurse: 'Enfermero/a',
  administrator: 'Administrador',
};

// El back devuelve birthdate como fecha completa ("1995-05-15T00:00:00.000Z"),
// pero el input de fecha necesita "1995-05-15"
export function normalizarUsuario(u) {
  return { ...u, birthdate: u.birthdate ? u.birthdate.slice(0, 10) : '' };
}
