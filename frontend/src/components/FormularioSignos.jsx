import { useState } from 'react';

const VACIO = { vital_signs: '', symptoms: '', observations: '' };

// inicial (opcional): registro a editar
export default function FormularioSignos({ inicial, onGuardar, onCancelar }) {
  const esEdicion = Boolean(inicial);
  const [datos, setDatos] = useState({
    vital_signs: inicial?.vital_signs ?? '',
    symptoms: inicial?.symptoms ?? '',
    observations: inicial?.observations ?? '',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await onGuardar(datos);
      if (!esEdicion) setDatos(VACIO);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>
        {esEdicion ? 'Editar signos y síntomas' : 'Registrar signos y síntomas'}
      </h3>

      <label>
        Signos vitales
        <input
          type="text"
          name="vital_signs"
          placeholder="PA 120/80 · T 36.5 °C · FC 72 · SpO2 98%"
          value={datos.vital_signs}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Síntomas
        <textarea
          name="symptoms"
          value={datos.symptoms}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Observaciones
        <textarea
          name="observations"
          value={datos.observations}
          onChange={handleChange}
          required
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={guardando}>
        {guardando
          ? 'Guardando...'
          : esEdicion
            ? 'Guardar cambios'
            : 'Guardar registro'}
      </button>
      {onCancelar && (
        <button type="button" className="secundario" onClick={onCancelar}>
          Cancelar
        </button>
      )}
    </form>
  );
}
