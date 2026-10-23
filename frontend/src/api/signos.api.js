import { USE_MOCKS } from '../config';
import { apiTurnos } from './http';
import { signos, turnos, esperar, nuevoId } from '../mocks/datos';

export async function obtenerSignosPorTurno(turnoId) {
  if (USE_MOCKS) {
    await esperar();
    return signos.filter((s) => s.medical_appointment_id === turnoId);
  }
  const { data } = await apiTurnos.get(`/appointments/${turnoId}/signs`);
  return data;
}

export async function crearSignos(datos) {
  if (USE_MOCKS) {
    await esperar();
    const existeTurno = turnos.some(
      (t) => t._id === datos.medical_appointment_id,
    );
    if (!existeTurno) throw new Error('El turno no existe');
    const nuevo = {
      _id: nuevoId('s'),
      date: new Date().toISOString(),
      ...datos,
    };
    signos.push(nuevo);
    return nuevo;
  }
  const { data } = await apiTurnos.post('/signs-and-symptoms', datos);
  return data;
}
