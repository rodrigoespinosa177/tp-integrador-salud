import { ETIQUETA_ESTADO, formatearFecha } from '../utils/turnos';

export default function TablaTurnos({ turnos, acciones }) {
  if (turnos.length === 0) return <p>No hay turnos para mostrar.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Motivo</th>
          <th>Estado</th>
          {acciones && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {turnos.map((t) => (
          <tr key={t._id}>
            <td>{formatearFecha(t.date)}</td>
            <td>{t.hour}</td>
            <td>{t.motive}</td>
            <td>{ETIQUETA_ESTADO[t.status] || t.status}</td>
            {acciones && <td>{acciones(t)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
