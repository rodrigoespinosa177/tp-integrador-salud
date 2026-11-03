import { USE_MOCKS_TURNOS as USE_MOCKS } from '../config';
import { apiTurnos } from './http';
import { signos, turnos, esperar, nuevoId } from '../mocks/datos';
import { VENTANA_EDICION_MS } from '../utils/signos';

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
    const turno = turnos.find((t) => t._id === datos.medical_appointment_id);
    if (!turno) throw new Error('El turno no existe');
    if (turno.status !== 'confirmed' && turno.status !== 'completed') {
      throw new Error('Solo se pueden registrar signos en turnos confirmados');
    }
    if (signos.some((s) => s.medical_appointment_id === turno._id)) {
      throw new Error('Este turno ya tiene signos y síntomas registrados');
    }
    const nuevo = {
      _id: nuevoId('s'),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...datos,
    };
    signos.push(nuevo);
    turno.status = 'completed';
    return nuevo;
  }
  const { data } = await apiTurnos.post('/signs-and-symptoms', datos);
  return data;
}

// Nota de seguimiento: se puede agregar en cualquier momento (también pasados los 5
// minutos) y no se edita ni se borra. nurseId solo lo usa el modo mock.
export async function agregarObservacion(id, text, nurseId) {
  if (USE_MOCKS) {
    await esperar();
    const registro = signos.find((s) => s._id === id);
    if (!registro) throw new Error('Registro no encontrado');
    registro.additional_observations = [
      ...(registro.additional_observations ?? []),
      { text, nurse_id: nurseId, date: new Date().toISOString() },
    ];
    return { ...registro };
  }
  const { data } = await apiTurnos.post(
    `/signs-and-symptoms/${id}/observations`,
    {
      text,
    },
  );
  return data;
}

// Solo signos vitales, síntomas y observaciones; el back rechaza si pasaron más de 5 minutos
export async function actualizarSignos(id, cambios) {
  if (USE_MOCKS) {
    await esperar();
    const registro = signos.find((s) => s._id === id);
    if (!registro) throw new Error('Registro no encontrado');
    const creado = new Date(registro.createdAt ?? registro.date).getTime();
    if (Date.now() - creado > VENTANA_EDICION_MS) {
      throw new Error(
        'Solo se puede modificar un registro dentro de los 5 minutos de su creación',
      );
    }
    Object.assign(registro, cambios);
    return { ...registro };
  }
  const { data } = await apiTurnos.patch(`/signs-and-symptoms/${id}`, cambios);
  return data;
}
