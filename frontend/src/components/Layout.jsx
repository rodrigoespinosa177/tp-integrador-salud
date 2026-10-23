import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ETIQUETA_ROL } from '../utils/usuarios';
import { RUTA_POR_ROL } from '../routes/rutasPorRol';

export default function Layout() {
  const { user, logout } = useAuth();
  const tienePerfil = user.rol === 'patient' || user.rol === 'nurse';

  return (
    <div>
      <header>
        <nav>
          <NavLink to={RUTA_POR_ROL[user.rol]}>Inicio</NavLink>
          {tienePerfil && <NavLink to="/perfil">Mi perfil</NavLink>}
        </nav>

        <span>
          {user.first_name} {user.last_name} · {ETIQUETA_ROL[user.rol]}
        </span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
