import { useState } from 'react';
import { ETIQUETA_ESTADO, hoyISO } from '../utils/turnos';

const VACIO = {
  patient_id: '',
  date: '',
  hour: '',
  motive: '',
  status: 'pending',
};

// inicial (opcional): turno a editar
// listaPacientes (opcional): muestra el selector de paciente (admin)
// permitirEstado (opcional): muestra el selector de estado (admin)
export default function FormularioTurno({
  inicial,
  listaPacientes,
  permitirEstado = false,
  onGuardar,
  onCancelar,
}) {
  const esEdicion = Boolean(inicial);
  const [datos, setDatos] = useState({ ...VACIO, ...inicial });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!esEdicion && datos.date < hoyISO()) {
      setError('La fecha no puede ser anterior a hoy');
      return;
    }

    // Solo mandamos los campos que este formulario maneja
    const aEnviar = {
      date: datos.date,
      hour: datos.hour,
      motive: datos.motive,
    };
    if (listaPacientes) aEnviar.patient_id = datos.patient_id;
    if (permitirEstado) aEnviar.status = datos.status;

    setGuardando(true);
    try {
      await onGuardar(aEnviar);
      if (!esEdicion) setDatos(VACIO);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{esEdicion ? 'Editar turno' : 'Sacar turno'}</h2>

      {listaPacientes && (
        <label>
          Paciente
          <select
            name="patient_id"
            value={datos.patient_id}
            onChange={handleChange}
            required
          >
            <option value="">Elegí un paciente</option>
            {listaPacientes.map((p) => (
              <option key={p._id} value={p._id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Fecha
        <input
          type="date"
          name="date"
          min={esEdicion ? undefined : hoyISO()}
          value={datos.date}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Hora
        <input
          type="time"
          name="hour"
          value={datos.hour}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Motivo
        <input
          type="text"
          name="motive"
          value={datos.motive}
          onChange={handleChange}
          required
        />
      </label>

      {permitirEstado && (
        <label>
          Estado
          <select name="status" value={datos.status} onChange={handleChange}>
            {Object.entries(ETIQUETA_ESTADO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={guardando}>
        {guardando
          ? 'Guardando...'
          : esEdicion
            ? 'Guardar cambios'
            : 'Sacar turno'}
      </button>
      {onCancelar && (
        <button type="button" onClick={onCancelar}>
          Cancelar
        </button>
      )}
    </form>
  );
}
