import { useState } from 'react';
import { hoyISO } from '../utils/turnos';

const VACIO = { date: '', hour: '', motive: '' };

export default function FormularioTurno({ onGuardar }) {
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Un solo handler para todos los campos: usa el "name" del input
  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (datos.date < hoyISO()) {
      setError('La fecha no puede ser anterior a hoy');
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(datos);
      setDatos(VACIO);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sacar turno</h2>

      <label>
        Fecha
        <input
          type="date"
          name="date"
          min={hoyISO()}
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

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Sacar turno'}
      </button>
    </form>
  );
}
