import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ETIQUETA_ROL } from '../utils/usuarios';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header>
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
