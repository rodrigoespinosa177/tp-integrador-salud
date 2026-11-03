import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RUTA_POR_ROL } from '../routes/rutasPorRol';
import AuthLayout from '../components/AuthLayout';
import CampoPassword from '../components/CampoPassword';
import Tutorial from '../components/Tutorial';
import { PASOS_TUTORIAL } from '../tutorial/pasos';
import { yaSeVioLaGuia, marcarGuiaVista } from '../tutorial/guiaVista';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // La guía del login se muestra sola una vez por arranque de la app
  const [guiaAbierta, setGuiaAbierta] = useState(() => !yaSeVioLaGuia('login'));

  function cerrarGuia() {
    setGuiaAbierta(false);
    marcarGuiaVista('login');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setCargando(false);
    }
  }

  // Si ya está logueado, lo mandamos a su sección
  if (user) return <Navigate to={RUTA_POR_ROL[user.rol]} replace />;

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>
        <p className="auth-ayuda">
          Ingresá con el email y la contraseña de tu cuenta.
        </p>

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <CampoPassword
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="auth-pie">
          ¿Es tu primera vez?{' '}
          <Link to="/registro">Creá tu cuenta de paciente</Link>
        </p>

        <p className="auth-ayuda">
          ¿Necesitás ayuda?{' '}
          <button
            type="button"
            className="boton-enlace auth-guia"
            onClick={() => setGuiaAbierta(true)}
          >
            Ver la guía
          </button>
        </p>
      </form>

      {guiaAbierta && (
        <Tutorial pasos={PASOS_TUTORIAL.login} onCerrar={cerrarGuia} />
      )}
    </AuthLayout>
  );
}
