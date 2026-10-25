export const ETIQUETA_ESTADO = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Atendido',
};

// Franjas de atención: de 08:00 a 17:00, cada 30 minutos
export function generarHorarios(inicio = '08:00', fin = '17:00', paso = 30) {
  const aMinutos = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
  const horarios = [];
  for (let m = aMinutos(inicio); m <= aMinutos(fin); m += paso) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    horarios.push(`${hh}:${mm}`);
  }
  return horarios;
}

export const HORARIOS = generarHorarios();

// Hora actual en formato "HH:mm" (hora local)
export function horaActual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// "2026-10-28" → "28/10/2026"
export function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

// Fecha de hoy en hora argentina, formato "2026-10-23"
export function hoyISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// "2026-10-28" → { dia: "28", mes: "oct", diaSemana: "miércoles" }
// Se arma la fecha con año, mes y día para que no se corra por la zona horaria
export function partesFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  return {
    dia: String(dia),
    mes: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
    diaSemana: d.toLocaleDateString('es-AR', { weekday: 'long' }),
  };
}

// El turno activo (pendiente o confirmado) más cercano desde hoy
export function proximoTurno(turnos) {
  const hoy = hoyISO();
  return turnos
    .filter(
      (t) =>
        (t.status === 'pending' || t.status === 'confirmed') && t.date >= hoy,
    )
    .sort((a, b) =>
      `${a.date} ${a.hour}`.localeCompare(`${b.date} ${b.hour}`),
    )[0];
}
