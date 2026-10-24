import { ETIQUETA_ROL } from '../utils/usuarios';

export default function TablaUsuarios({ usuarios, acciones }) {
  if (usuarios.length === 0) return <p>No hay usuarios para mostrar.</p>;

  return (
    <div className="tabla-scroll">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>DNI</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Teléfono</th>
            {acciones && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u._id}>
              <td>
                {u.first_name} {u.last_name}
              </td>
              <td>{u.dni}</td>
              <td>{u.email}</td>
              <td>{ETIQUETA_ROL[u.rol] || u.rol}</td>
              <td>{u.phone}</td>
              {acciones && <td>{acciones(u)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
