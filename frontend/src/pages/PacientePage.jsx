import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  obtenerTurnosPorPaciente,
  crearTurno,
  cancelarTurno,
} from '../api/turnos.api';
import TablaTurnos from '../components/TablaTurnos';
import FormularioTurno from '../components/FormularioTurno';

export default function PacientePage() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Al entrar a la página, trae los turnos del paciente
  useEffect(() => {
    obtenerTurnosPorPaciente(user._id)
      .then(setTurnos)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [user._id]);

  async function handleCrear(datos) {
    const nuevo = await crearTurno({
      ...datos,
      patient_id: user._id,
      assigned_by_id: user._id,
    });
    setTurnos((prev) => [...prev, nuevo]);
  }

  async function handleCancelar(id) {
    if (!window.confirm('¿Seguro que querés cancelar este turno?')) return;
    try {
      const actualizado = await cancelarTurno(id);
      setTurnos((prev) => prev.map((t) => (t._id === id ? actualizado : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1>Mis turnos</h1>

      {error && <p role="alert">{error}</p>}

      {cargando ? (
        <p>Cargando turnos...</p>
      ) : (
        <TablaTurnos
          turnos={turnos}
          acciones={(t) =>
            (t.status === 'pending' || t.status === 'confirmed') && (
              <button onClick={() => handleCancelar(t._id)}>Cancelar</button>
            )
          }
        />
      )}

      <FormularioTurno onGuardar={handleCrear} />
    </section>
  );
}
