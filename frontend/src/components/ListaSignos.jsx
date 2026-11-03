import FormularioObservacion from './FormularioObservacion';

// puedeEditar (opcional): función (registro) → boolean que decide si muestra "Editar"
// onAgregarObservacion (opcional): muestra "Agregar observación" (enfermero)
// observandoId / onGuardarObservacion / onCancelarObservacion: formulario de la nota abierta
export default function ListaSignos({
  registros,
  puedeEditar,
  onEditar,
  onAgregarObservacion,
  observandoId,
  onGuardarObservacion,
  onCancelarObservacion,
}) {
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

          {r.additional_observations?.length > 0 && (
            <ul className="observaciones-adicionales">
              {r.additional_observations.map((o, i) => (
                <li key={i}>
                  <strong>{new Date(o.date).toLocaleString('es-AR')}</strong> ·{' '}
                  {o.text}
                </li>
              ))}
            </ul>
          )}

          {onEditar && puedeEditar?.(r) && (
            <button
              type="button"
              className="secundario"
              onClick={() => onEditar(r)}
            >
              Editar
            </button>
          )}
          {onAgregarObservacion && observandoId !== r._id && (
            <button
              type="button"
              className="secundario"
              onClick={() => onAgregarObservacion(r)}
            >
              Agregar observación
            </button>
          )}
          {observandoId === r._id && (
            <FormularioObservacion
              onGuardar={onGuardarObservacion}
              onCancelar={onCancelarObservacion}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
