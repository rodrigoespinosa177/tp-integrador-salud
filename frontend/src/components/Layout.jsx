import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ETIQUETA_ROL } from '../utils/usuarios';
import { RUTA_POR_ROL } from '../routes/rutasPorRol';
import Marca from './Marca';

export default function Layout() {
  const { user, logout } = useAuth();
  const tienePerfil = user.rol === 'patient' || user.rol === 'nurse';

  return (
    <div>
      <header className="encabezado">
        <div className="encabezado-contenido">
          <Marca destino={RUTA_POR_ROL[user.rol]} />

          <nav className="menu" aria-label="Principal">
            <NavLink to={RUTA_POR_ROL[user.rol]}>Inicio</NavLink>
            {tienePerfil && <NavLink to="/perfil">Mi perfil</NavLink>}
          </nav>

          <div className="sesion">
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
    </div>
  );
}
