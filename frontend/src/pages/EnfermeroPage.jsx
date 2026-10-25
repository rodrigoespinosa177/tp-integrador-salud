import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerTurnos } from '../api/turnos.api';
import { obtenerUsuarios } from '../api/usuarios.api';
import {
  obtenerSignosPorTurno,
  crearSignos,
  actualizarSignos,
  agregarObservacion,
} from '../api/signos.api';
import { puedeEditarSigno } from '../utils/signos';
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
  const [editando, setEditando] = useState(null); // registro que se está editando
  const [observandoId, setObservandoId] = useState(null); // registro con la nota abierta

  // Pide turnos y pacientes a la vez. Si uno falla, el otro se muestra igual.
  useEffect(() => {
    Promise.allSettled([obtenerTurnos(), obtenerUsuarios('patient')])
      .then(([resTurnos, resPacientes]) => {
        if (resTurnos.status === 'fulfilled') {
          // El enfermero atiende los confirmados y consulta los ya atendidos
          setTurnos(
            resTurnos.value.filter(
              (t) => t.status === 'confirmed' || t.status === 'completed',
            ),
          );
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
    setEditando(null);
    setObservandoId(null);
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

    // El back pasa el turno a "atendido": lo reflejamos en la tabla y en el panel
    setTurnos((prev) =>
      prev.map((t) =>
        t._id === turnoSeleccionado._id ? { ...t, status: 'completed' } : t,
      ),
    );
    setTurnoSeleccionado((prev) => ({ ...prev, status: 'completed' }));
  }

  async function handleAgregarObservacion(texto) {
    const actualizado = await agregarObservacion(observandoId, texto, user._id);
    setRegistros((prev) =>
      prev.map((r) => (r._id === actualizado._id ? actualizado : r)),
    );
    setObservandoId(null);
  }

  async function handleActualizarSignos(datos) {
    const actualizado = await actualizarSignos(editando._id, datos);
    setRegistros((prev) =>
      prev.map((r) => (r._id === actualizado._id ? actualizado : r)),
    );
    setEditando(null);
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

          <ListaSignos
            registros={registros}
            puedeEditar={(r) => puedeEditarSigno(r, user._id)}
            onEditar={setEditando}
            onAgregarObservacion={(r) => setObservandoId(r._id)}
            observandoId={observandoId}
            onGuardarObservacion={handleAgregarObservacion}
            onCancelarObservacion={() => setObservandoId(null)}
          />
          {editando ? (
            <FormularioSignos
              key={editando._id}
              inicial={editando}
              onGuardar={handleActualizarSignos}
              onCancelar={() => setEditando(null)}
            />
          ) : (
            // Un turno se registra una sola vez
            registros.length === 0 && (
              <FormularioSignos onGuardar={handleGuardarSignos} />
            )
          )}

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
