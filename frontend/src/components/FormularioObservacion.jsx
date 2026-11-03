import { useState } from 'react';

// Nota de seguimiento sobre un registro de signos: solo se agrega, no se edita ni se borra
export default function FormularioObservacion({ onGuardar, onCancelar }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await onGuardar(texto.trim());
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nueva observación
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={1000}
          required
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={guardando || !texto.trim()}>
        {guardando ? 'Guardando...' : 'Agregar observación'}
      </button>
      <button type="button" className="secundario" onClick={onCancelar}>
        Cancelar
      </button>
    </form>
  );
}
