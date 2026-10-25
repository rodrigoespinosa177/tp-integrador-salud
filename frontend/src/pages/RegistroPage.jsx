import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RUTA_POR_ROL } from '../routes/rutasPorRol';

const VACIO = {
  first_name: '',
  last_name: '',
  dni: '',
  email: '',
  password: '',
  phone: '',
};

export default function RegistroPage() {
  const { user, registrar } = useAuth();
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    // El teléfono es opcional: si está vacío no se manda
    const aEnviar = { ...datos };
    if (!aEnviar.phone) delete aEnviar.phone;

    try {
      await registrar(aEnviar);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setCargando(false);
    }
  }

  // Si ya está logueado (por ejemplo, recién registrado), va a su sección
  if (user) return <Navigate to={RUTA_POR_ROL[user.rol]} replace />;

  return (
    <div className="login-pagina">
      <form className="login" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="login-subtitulo">
          Registrate como paciente para sacar turnos.
        </p>

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

        <label>
          Contraseña
          <input
            type="password"
            name="password"
            minLength={6}
            value={datos.password}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Teléfono (opcional)
          <input
            type="tel"
            name="phone"
            value={datos.phone}
            onChange={handleChange}
          />
        </label>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="login-pie">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </form>
    </div>
  );
}
