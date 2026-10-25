import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '../../api/usuarios.api';
import { ETIQUETA_ROL } from '../../utils/usuarios';
import TablaUsuarios from '../../components/TablaUsuarios';
import FormularioUsuario from '../../components/FormularioUsuario';

export default function UsuariosAdmin() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [editando, setEditando] = useState(null); // null = modo "crear"
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerUsuarios()
      .then(setUsuarios)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  // Aplica búsqueda (nombre, email o DNI) y filtro por rol
  const texto = busqueda.toLowerCase();
  const visibles = usuarios.filter((u) => {
    const coincideTexto =
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(texto) ||
      u.email.toLowerCase().includes(texto) ||
      (u.dni || '').includes(texto);
    const coincideRol = !filtroRol || u.rol === filtroRol;
    return coincideTexto && coincideRol;
  });

  async function handleGuardar(datos) {
    if (editando) {
      const actualizado = await actualizarUsuario(editando._id, datos);
      setUsuarios((prev) =>
        prev.map((u) => (u._id === actualizado._id ? actualizado : u)),
      );
      setEditando(null);
    } else {
      const nuevo = await crearUsuario(datos);
      setUsuarios((prev) => [...prev, nuevo]);
    }
  }

  async function handleEliminar(u) {
    setError('');
    if (u._id === user._id) {
      setError('No podés eliminar tu propio usuario');
      return;
    }
    if (!window.confirm(`¿Eliminar a ${u.first_name} ${u.last_name}?`)) return;
    try {
      await eliminarUsuario(u._id);
      setUsuarios((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Usuarios</h2>

      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por nombre, email o DNI"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          {Object.entries(ETIQUETA_ROL).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>

      {error && <p role="alert">{error}</p>}

      {cargando ? (
        <p>Cargando usuarios...</p>
      ) : (
        <TablaUsuarios
          usuarios={visibles}
          acciones={(u) => (
            <>
              <button className="secundario" onClick={() => setEditando(u)}>
                Editar
              </button>
              <button className="peligro" onClick={() => handleEliminar(u)}>
                Eliminar
              </button>
            </>
          )}
        />
      )}

      <FormularioUsuario
        key={editando?._id || 'nuevo'}
        inicial={editando}
        onGuardar={handleGuardar}
        onCancelar={editando ? () => setEditando(null) : undefined}
      />
    </section>
  );
}
