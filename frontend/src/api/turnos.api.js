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
  if (USE_MOCKS) {
    await esperar();
    const turno = turnos.find((t) => t._id === id);
    if (!turno) throw new Error('Turno no encontrado');
    turno.status = 'cancelled';
    return { ...turno };
  }
  const { data } = await apiTurnos.patch(`/appointments/${id}`, {
    status: 'cancelled',
  });
  return data;
}
