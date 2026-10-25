import { USE_MOCKS_TURNOS as USE_MOCKS } from '../config';
import { apiTurnos } from './http';
import { turnos, esperar, nuevoId } from '../mocks/datos';

const MENSAJE_HORARIO_OCUPADO = 'Ya hay un turno reservado en esa fecha y hora';

// Igual que el back: un horario admite un solo turno no cancelado, de cualquier paciente
function horarioOcupado(date, hour, excluirId) {
  return turnos.some(
    (t) =>
      t._id !== excluirId &&
      t.date === date &&
      t.hour === hour &&
      t.status !== 'cancelled',
  );
}

export async function obtenerTurnosPorPaciente(patientId) {
  if (USE_MOCKS) {
    await esperar();
    return turnos.filter((t) => t.patient_id === patientId);
  }
  const { data } = await apiTurnos.get('/appointments', {
    params: { patient_id: patientId },
  });
  return data;
}

// Horas ya reservadas en una fecha ("YYYY-MM-DD"). Lo puede pedir cualquier rol:
// el paciente solo ve sus turnos, así que no alcanza con listarlos.
export async function obtenerHorariosOcupados(fecha) {
  if (USE_MOCKS) {
    await esperar();
    return turnos
      .filter((t) => t.date === fecha && t.status !== 'cancelled')
      .map((t) => t.hour)
      .sort();
  }
  const { data } = await apiTurnos.get('/appointments/availability', {
    params: { date: fecha },
  });
  return data;
}

export async function crearTurno(datos) {
  if (USE_MOCKS) {
    await esperar();
    if (
      datos.status !== 'cancelled' &&
      !datos.is_overbooking &&
      horarioOcupado(datos.date, datos.hour)
    ) {
      throw new Error(MENSAJE_HORARIO_OCUPADO);
    }
    const nuevo = {
      _id: nuevoId('t'),
      status: 'pending',
      is_overbooking: false,
      ...datos,
    };
    turnos.push(nuevo);
    return nuevo;
  }
  const { data } = await apiTurnos.post('/appointments', datos);
  return data;
}

export async function cancelarTurno(id) {
  return actualizarTurno(id, { status: 'cancelled' });
}

export async function obtenerTurnos() {
  if (USE_MOCKS) {
    await esperar();
    return [...turnos];
  }
  const { data } = await apiTurnos.get('/appointments');
  return data;
}

export async function actualizarTurno(id, cambios) {
  if (USE_MOCKS) {
    await esperar();
    const turno = turnos.find((t) => t._id === id);
    if (!turno) throw new Error('Turno no encontrado');
    const final = { ...turno, ...cambios };
    const reservaHorario =
      final.status !== 'cancelled' &&
      (final.date !== turno.date ||
        final.hour !== turno.hour ||
        turno.status === 'cancelled');
    if (
      reservaHorario &&
      !final.is_overbooking &&
      horarioOcupado(final.date, final.hour, id)
    ) {
      throw new Error(MENSAJE_HORARIO_OCUPADO);
    }
    Object.assign(turno, cambios);
    return { ...turno };
  }
  const { data } = await apiTurnos.patch(`/appointments/${id}`, cambios);
  return data;
}

export async function eliminarTurno(id) {
  if (USE_MOCKS) {
    await esperar();
    const indice = turnos.findIndex((t) => t._id === id);
    if (indice === -1) throw new Error('Turno no encontrado');
    turnos.splice(indice, 1);
    return;
  }
  await apiTurnos.delete(`/appointments/${id}`);
}
