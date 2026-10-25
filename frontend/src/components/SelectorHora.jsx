import { HORARIOS } from '../utils/turnos';

// Desplegable con las franjas del día. Las ocupadas (o ya pasadas) quedan deshabilitadas.
// ocupados: lista de "HH:mm" | null mientras se están consultando
// sobreturno (opcional): si es true, las franjas ocupadas se pueden elegir igual
// desdeHora (opcional): "HH:mm"; las franjas hasta ese valor inclusive se bloquean
export default function SelectorHora({
  valor,
  onChange,
  ocupados,
  desdeHora,
  hayFecha,
  sobreturno = false,
}) {
  const sinOpciones = !hayFecha || ocupados === null;
  let placeholder = 'Elegí un horario';
  if (!hayFecha) placeholder = 'Elegí primero una fecha';
  else if (ocupados === null) placeholder = 'Cargando horarios...';

  return (
    <select
      name="hour"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      disabled={sinOpciones}
      required
    >
      <option value="">{placeholder}</option>
      {!sinOpciones &&
        HORARIOS.map((hora) => {
          const ocupado = ocupados.includes(hora);
          const pasado = Boolean(desdeHora) && hora <= desdeHora;
          return (
            <option
              key={hora}
              value={hora}
              disabled={(ocupado && !sobreturno) || pasado}
            >
              {ocupado ? `${hora} (ocupado)` : hora}
            </option>
          );
        })}
    </select>
  );
}
