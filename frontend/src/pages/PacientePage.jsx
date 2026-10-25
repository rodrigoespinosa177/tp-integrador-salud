import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  obtenerTurnosPorPaciente,
  crearTurno,
  cancelarTurno,
} from '../api/turnos.api';
import { proximoTurno } from '../utils/turnos';
import TablaTurnos from '../components/TablaTurnos';
import FormularioTurno from '../components/FormularioTurno';
import TurnoDestacado from '../components/TurnoDestacado';

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

  // El próximo turno va destacado; el resto abajo, de los más nuevos a los más viejos
  const proximo = proximoTurno(turnos);
  const historial = turnos
    .filter((t) => t._id !== proximo?._id)
    .sort((a, b) => `${b.date} ${b.hour}`.localeCompare(`${a.date} ${a.hour}`));

  return (
    <section className="pagina">
      <header className="pagina-encabezado">
        <h1>Hola, {user.first_name}</h1>
        <p>Acá ves tus turnos y podés pedir uno nuevo.</p>
      </header>

      {error && <p role="alert">{error}</p>}

      {cargando ? (
        <p>Cargando turnos...</p>
      ) : proximo ? (
        <TurnoDestacado turno={proximo} onCancelar={handleCancelar} />
      ) : (
        <div className="vacio">
          <h2>No tenés turnos próximos</h2>
          <p>Pedí uno con el formulario de abajo y lo vas a ver acá.</p>
        </div>
      )}

      <FormularioTurno onGuardar={handleCrear} />

      {!cargando && historial.length > 0 && (
        <div className="bloque">
          <h2>Tus otros turnos</h2>
          <TablaTurnos
            turnos={historial}
            acciones={(t) =>
              (t.status === 'pending' || t.status === 'confirmed') && (
                <button
                  className="peligro"
                  onClick={() => handleCancelar(t._id)}
                >
                  Cancelar
                </button>
              )
            }
          />
        </div>
      )}
    </section>
  );
}
