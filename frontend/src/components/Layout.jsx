import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ETIQUETA_ROL } from '../utils/usuarios';
import { RUTA_POR_ROL } from '../routes/rutasPorRol';
import { PASOS_TUTORIAL } from '../tutorial/pasos';
import Marca from './Marca';
import Tutorial from './Tutorial';
import { yaSeVioLaGuia, marcarGuiaVista } from '../tutorial/guiaVista';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const inicio = RUTA_POR_ROL[user.rol];
  const tienePerfil = user.rol === 'patient' || user.rol === 'nurse';
  // La guía de cada persona se muestra sola una vez por arranque de la app
  const claveGuia = `usuario-${user._id}`;
  const [tutorialAbierto, setTutorialAbierto] = useState(
    () => !yaSeVioLaGuia(claveGuia),
  );

  function abrirTutorial() {
    // La guía señala partes de la pantalla de inicio de cada rol
    navigate(inicio);
    setTutorialAbierto(true);
  }

  function cerrarTutorial() {
    setTutorialAbierto(false);
    marcarGuiaVista(claveGuia);
  }

  return (
    <div>
      <header className="encabezado">
        <div className="encabezado-contenido">
          <Marca destino={inicio} />

          <nav className="menu" aria-label="Principal">
            <NavLink to={inicio}>Inicio</NavLink>
            {tienePerfil && <NavLink to="/perfil">Mi perfil</NavLink>}
          </nav>

          <div className="sesion">
            <button
              type="button"
              className="boton-ayuda"
              onClick={abrirTutorial}
            >
              Ayuda
            </button>
            <div className="sesion-datos">
              <span className="sesion-nombre">
                {user.first_name} {user.last_name}
              </span>
              <span className="sesion-rol">{ETIQUETA_ROL[user.rol]}</span>
            </div>
            <button className="secundario" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="contenido">
        <Outlet />
      </main>

      {tutorialAbierto && (
        <Tutorial pasos={PASOS_TUTORIAL[user.rol]} onCerrar={cerrarTutorial} />
      )}
    </div>
  );
}
