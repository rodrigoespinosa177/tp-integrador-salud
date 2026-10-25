import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerTurnos } from '../api/turnos.api';
import { obtenerUsuarios } from '../api/usuarios.api';
import { obtenerSignosPorTurno, crearSignos } from '../api/signos.api';
import { formatearFecha } from '../utils/turnos';
import TablaTurnos from '../components/TablaTurnos';
import ListaSignos from '../components/ListaSignos';
import FormularioSignos from '../components/FormularioSignos';

export default function EnfermeroPage() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [registros, setRegistros] = useState([]);

  // Pide turnos y pacientes a la vez. Si uno falla, el otro se muestra igual.
  useEffect(() => {
    Promise.allSettled([obtenerTurnos(), obtenerUsuarios('patient')])
      .then(([resTurnos, resPacientes]) => {
        if (resTurnos.status === 'fulfilled') {
          setTurnos(resTurnos.value.filter((t) => t.status !== 'cancelled'));
        } else {
          setError(resTurnos.reason.message);
        }

        if (resPacientes.status === 'fulfilled') {
          // Arma { idPaciente: "Nombre Apellido" } para la tabla
          const mapa = {};
          resPacientes.value.forEach((p) => {
            mapa[p._id] = `${p.first_name} ${p.last_name}`;
          });
          setPacientes(mapa);
        } else {
          setAviso(
            'No se pudieron cargar los nombres de los pacientes. Los turnos se muestran igual.',
          );
        }
      })
      .finally(() => setCargando(false));
  }, []);

  async function abrirTurno(turno) {
    setTurnoSeleccionado(turno);
    setRegistros([]);
    try {
      setRegistros(await obtenerSignosPorTurno(turno._id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGuardarSignos(datos) {
    const nuevo = await crearSignos({
      ...datos,
      medical_appointment_id: turnoSeleccionado._id,
      nurse_id: user._id,
    });
    setRegistros((prev) => [...prev, nuevo]);
  }

  return (
    <section>
      <h1>Turnos asignados</h1>

      {error && <p role="alert">{error}</p>}
      {aviso && <p className="aviso">{aviso}</p>}

      {cargando ? (
        <p>Cargando turnos...</p>
      ) : (
        <TablaTurnos
          turnos={turnos}
          pacientes={pacientes}
          acciones={(t) => (
            <button onClick={() => abrirTurno(t)}>Signos</button>
          )}
        />
      )}

      {turnoSeleccionado && (
        <section className="panel">
          <h2>
            {pacientes[turnoSeleccionado.patient_id] || 'Paciente'} ·{' '}
            {formatearFecha(turnoSeleccionado.date)} {turnoSeleccionado.hour}
          </h2>
          <p>Motivo: {turnoSeleccionado.motive}</p>

          <ListaSignos registros={registros} />
          <FormularioSignos onGuardar={handleGuardarSignos} />

          <button
            className="secundario"
            onClick={() => setTurnoSeleccionado(null)}
          >
            Cerrar
          </button>
        </section>
      )}
    </section>
  );
}
