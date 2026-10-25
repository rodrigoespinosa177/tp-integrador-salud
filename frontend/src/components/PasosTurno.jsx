const PASOS = [
  { estado: 'pending', texto: 'Pedido' },
  { estado: 'confirmed', texto: 'Confirmado' },
  { estado: 'completed', texto: 'Atendido' },
];

// Muestra en qué etapa está el turno: Pedido → Confirmado → Atendido
export default function PasosTurno({ estado }) {
  const actual = PASOS.findIndex((p) => p.estado === estado);

  return (
    <ol className="pasos" data-estado={estado} aria-label="Estado del turno">
      {PASOS.map((paso, i) => {
        let clase = 'paso';
        if (i < actual) clase += ' hecho';
        if (i === actual) clase += ' actual';

        return (
          <li
            key={paso.estado}
            className={clase}
            aria-current={i === actual ? 'step' : undefined}
          >
            <span className="paso-punto" aria-hidden="true" />
            {paso.texto}
          </li>
        );
      })}
    </ol>
  );
}
