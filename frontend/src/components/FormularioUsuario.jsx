import { useState } from 'react';
import { ETIQUETA_ROL } from '../utils/usuarios';
import CampoPassword from './CampoPassword';
const VACIO = {
  first_name: '',
  last_name: '',
  dni: '',
  email: '',
  password: '',
  rol: 'patient',
  phone: '',
  birthdate: '',
};

// Únicos campos que acepta el back (rechaza cualquier otro)
const CAMPOS = [
  'first_name',
  'last_name',
  'dni',
  'email',
  'password',
  'rol',
  'phone',
  'birthdate',
];

export default function FormularioUsuario({
  inicial,
  onGuardar,
  onCancelar,
  permitirRol = true,
  titulo,
}) {
  const esEdicion = Boolean(inicial);
  const [datos, setDatos] = useState({ ...VACIO, ...inicial, password: '' });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Arma el envío solo con campos válidos y con valor
    // (la contraseña vacía al editar, o el teléfono vacío, no se mandan)
    const aEnviar = {};
    CAMPOS.forEach((campo) => {
      if (datos[campo]) aEnviar[campo] = datos[campo];
    });
    if (!permitirRol) delete aEnviar.rol;

    setGuardando(true);
    try {
      await onGuardar(aEnviar);
      if (esEdicion) {
        setDatos((prev) => ({ ...prev, password: '' }));
      } else {
        setDatos(VACIO);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{titulo || (esEdicion ? 'Editar usuario' : 'Nuevo usuario')}</h2>

      <label>
        Nombre
        <input
          name="first_name"
          value={datos.first_name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Apellido
        <input
          name="last_name"
          value={datos.last_name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        DNI
        <input
          name="dni"
          inputMode="numeric"
          pattern="\d{7,8}"
          title="7 u 8 números, sin puntos"
          value={datos.dni}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          name="email"
          value={datos.email}
          onChange={handleChange}
          required
        />
      </label>

      <CampoPassword
        label={
          esEdicion
            ? 'Nueva contraseña (dejar vacío para no cambiarla)'
            : 'Contraseña'
        }
        name="password"
        autoComplete="new-password"
        value={datos.password}
        onChange={handleChange}
        required={!esEdicion}
        minLength={6}
      />

      {permitirRol && (
        <label>
          Rol
          <select name="rol" value={datos.rol} onChange={handleChange}>
            {Object.entries(ETIQUETA_ROL).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Teléfono
        <input
          type="tel"
          name="phone"
          value={datos.phone || ''}
          onChange={handleChange}
        />
      </label>

      <label>
        Fecha de nacimiento
        <input
          type="date"
          name="birthdate"
          value={datos.birthdate || ''}
          onChange={handleChange}
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar'}
      </button>
      {onCancelar && (
        <button type="button" className="secundario" onClick={onCancelar}>
          Cancelar
        </button>
      )}
    </form>
  );
}
