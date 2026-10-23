import { USE_MOCKS } from '../config';
import { apiTurnos } from './http';
import { turnos, esperar, nuevoId } from '../mocks/datos';

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

export async function crearTurno(datos) {
  if (USE_MOCKS) {
    await esperar();
    const nuevo = { _id: nuevoId('t'), status: 'pending', ...datos };
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
