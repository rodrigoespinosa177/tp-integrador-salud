export default function ListaSignos({ registros }) {
  if (registros.length === 0) {
    return <p>Este turno todavía no tiene signos registrados.</p>;
  }

  return (
    <ul className="lista-signos">
      {registros.map((r) => (
        <li key={r._id}>
          <p>
            <strong>{new Date(r.date).toLocaleString('es-AR')}</strong>
          </p>
          <p>Signos vitales: {r.vital_signs}</p>
          <p>Síntomas: {r.symptoms}</p>
          {r.observations && <p>Observaciones: {r.observations}</p>}
        </li>
      ))}
    </ul>
  );
}
