import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  obtenerTurnos,
  crearTurno,
  actualizarTurno,
  eliminarTurno,
} from '../../api/turnos.api';
import { obtenerUsuarios } from '../../api/usuarios.api';
import { ETIQUETA_ESTADO } from '../../utils/turnos';
import TablaTurnos from '../../components/TablaTurnos';
import FormularioTurno from '../../components/FormularioTurno';

export default function TurnosAdmin() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [listaPacientes, setListaPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([obtenerTurnos(), obtenerUsuarios('patient')])
      .then(([t, p]) => {
        setTurnos(t);
        setListaPacientes(p);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  // { u3: "Pablo Paciente", ... } para mostrar nombres en la tabla
  const pacientes = {};
  listaPacientes.forEach((p) => {
    pacientes[p._id] = `${p.first_name} ${p.last_name}`;
  });

  const texto = busqueda.toLowerCase();
  const visibles = turnos
    .filter((t) =>
      (pacientes[t.patient_id] || '').toLowerCase().includes(texto),
    )
    .filter((t) => !filtroEstado || t.status === filtroEstado)
    .sort((a, b) => `${a.date} ${a.hour}`.localeCompare(`${b.date} ${b.hour}`));

  async function handleGuardar(datos) {
    if (editando) {
      const actualizado = await actualizarTurno(editando._id, datos);
      setTurnos((prev) =>
        prev.map((t) => (t._id === actualizado._id ? actualizado : t)),
      );
      setEditando(null);
    } else {
      const nuevo = await crearTurno({ ...datos, assigned_by_id: user._id });
      setTurnos((prev) => [...prev, nuevo]);
    }
  }

  async function handleEliminar(t) {
    setError('');
    if (!window.confirm(`¿Eliminar el turno de ${pacientes[t.patient_id]}?`))
      return;
    try {
      await eliminarTurno(t._id);
      setTurnos((prev) => prev.filter((x) => x._id !== t._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Turnos</h2>

      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por paciente"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ETIQUETA_ESTADO).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>

      {error && <p role="alert">{error}</p>}

      {cargando ? (
        <p>Cargando turnos...</p>
      ) : (
        <TablaTurnos
          turnos={visibles}
          pacientes={pacientes}
          acciones={(t) => (
            <>
              <button className="secundario" onClick={() => setEditando(t)}>
                Editar
              </button>
              <button className="peligro" onClick={() => handleEliminar(t)}>
                Eliminar
              </button>
            </>
          )}
        />
      )}

      <FormularioTurno
        key={editando?._id || 'nuevo'}
        inicial={editando}
        listaPacientes={listaPacientes}
        permitirEstado
        permitirSobreturno
        onGuardar={handleGuardar}
        onCancelar={editando ? () => setEditando(null) : undefined}
      />
    </section>
  );
}
