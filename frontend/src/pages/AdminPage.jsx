import { useState } from 'react';
import UsuariosAdmin from './admin/UsuariosAdmin';
import TurnosAdmin from './admin/TurnosAdmin';

export default function AdminPage() {
  const [pestania, setPestania] = useState('usuarios');

  return (
    <section>
      <h1>Panel de administración</h1>

      <nav className="pestanias">
        <button
          onClick={() => setPestania('usuarios')}
          disabled={pestania === 'usuarios'}
        >
          Usuarios
        </button>
        <button
          onClick={() => setPestania('turnos')}
          disabled={pestania === 'turnos'}
        >
          Turnos
        </button>
      </nav>

      {pestania === 'usuarios' && <UsuariosAdmin />}
      {pestania === 'turnos' && <TurnosAdmin />}
    </section>
  );
}
