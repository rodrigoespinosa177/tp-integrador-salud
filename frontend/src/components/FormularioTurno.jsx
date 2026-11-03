import { useEffect, useState } from 'react';
import { obtenerHorariosOcupados } from '../api/turnos.api';
import { ETIQUETA_ESTADO, horaActual, hoyISO } from '../utils/turnos';
import SelectorHora from './SelectorHora';

const VACIO = {
  patient_id: '',
  date: '',
  hour: '',
  motive: '',
  status: 'pending',
  is_overbooking: false,
};

// inicial (opcional): turno a editar
// listaPacientes (opcional): muestra el selector de paciente (admin)
// permitirEstado (opcional): muestra el selector de estado (admin)
// permitirSobreturno (opcional): muestra la opción de sobreturno (admin)
export default function FormularioTurno({
  inicial,
  listaPacientes,
  permitirEstado = false,
  permitirSobreturno = false,
  onGuardar,
  onCancelar,
}) {
  const esEdicion = Boolean(inicial);
  const [datos, setDatos] = useState({ ...VACIO, ...inicial });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  // Horarios ocupados de la fecha elegida; se descartan si la fecha cambió mientras cargaban
  const [consulta, setConsulta] = useState({ fecha: '', horas: [] });

  useEffect(() => {
    if (!datos.date) return;
    let vigente = true;
    obtenerHorariosOcupados(datos.date)
      .then((horas) => vigente && setConsulta({ fecha: datos.date, horas }))
      // Si falla, no bloqueamos nada: el back igual rechaza un horario ocupado
      .catch(() => vigente && setConsulta({ fecha: datos.date, horas: [] }));
    return () => {
      vigente = false;
    };
  }, [datos.date]);

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  // Al desmarcar el sobreturno, una hora ocupada deja de ser válida: se vuelve a elegir
  function handleSobreturno(e) {
    const marcado = e.target.checked;
    const ocupada =
      consulta.fecha === datos.date && consulta.horas.includes(datos.hour);
    setDatos({
      ...datos,
      is_overbooking: marcado,
      hour: !marcado && ocupada ? '' : datos.hour,
    });
  }

  // Al cambiar de día, la hora elegida puede no estar disponible: se vuelve a elegir
  function handleFecha(e) {
    setDatos({ ...datos, date: e.target.value, hour: '' });
  }

  const cargandoHorarios = Boolean(datos.date) && consulta.fecha !== datos.date;
  let ocupados = cargandoHorarios ? null : consulta.horas;
  // Al editar, el horario del propio turno no cuenta como ocupado
  if (ocupados && esEdicion && inicial.date === datos.date) {
    ocupados = ocupados.filter((h) => h !== inicial.hour);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!esEdicion && datos.date < hoyISO()) {
      setError('La fecha no puede ser anterior a hoy');
      return;
    }
    if (!datos.hour) {
      setError('Elegí un horario');
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
    if (permitirSobreturno) aEnviar.is_overbooking = datos.is_overbooking;

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
          onChange={handleFecha}
          required
        />
      </label>

      <label>
        Hora
        <SelectorHora
          hayFecha={Boolean(datos.date)}
          valor={datos.hour}
          ocupados={ocupados}
          sobreturno={permitirSobreturno && Boolean(datos.is_overbooking)}
          desdeHora={datos.date === hoyISO() ? horaActual() : undefined}
          onChange={(hour) => setDatos({ ...datos, hour })}
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

      {permitirSobreturno && (
        <label className="casilla">
          <input
            type="checkbox"
            name="is_overbooking"
            checked={Boolean(datos.is_overbooking)}
            onChange={handleSobreturno}
          />
          Sobreturno (permite reservar un horario que ya está ocupado)
        </label>
      )}

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
        <button type="button" className="secundario" onClick={onCancelar}>
          Cancelar
        </button>
      )}
    </form>
  );
}
