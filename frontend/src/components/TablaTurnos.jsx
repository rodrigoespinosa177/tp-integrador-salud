import { ETIQUETA_ESTADO, formatearFecha } from '../utils/turnos';

// pacientes (opcional): objeto { idPaciente: "Nombre Apellido" }
export default function TablaTurnos({ turnos, acciones, pacientes }) {
  if (turnos.length === 0) return <p>No hay turnos para mostrar.</p>;

  return (
    <div className="tabla-scroll">
      <table>
        <thead>
          <tr>
            {pacientes && <th>Paciente</th>}
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
              {pacientes && <td>{pacientes[t.patient_id] || 'Desconocido'}</td>}
              <td>{formatearFecha(t.date)}</td>
              <td>{t.hour}</td>
              <td>{t.motive}</td>
              <td>
                <span className={`estado estado-${t.status}`}>
                  {ETIQUETA_ESTADO[t.status] || t.status}
                </span>
              </td>
              {acciones && <td>{acciones(t)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
