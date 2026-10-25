import { partesFecha } from '../utils/turnos';
import PasosTurno from './PasosTurno';

// Qué tiene que saber el paciente según el estado de su turno
const AYUDA = {
  pending: 'El centro de salud todavía tiene que confirmarlo.',
  confirmed: 'Te recomendamos llegar 10 minutos antes.',
};

// El próximo turno del paciente, con forma de comprobante de turno
export default function TurnoDestacado({ turno, onCancelar }) {
  const { dia, mes, diaSemana } = partesFecha(turno.date);

  return (
    <article className="turno-destacado" aria-label="Tu próximo turno">
      <div className="turno-fecha">
        <span className="turno-dia">{dia}</span>
        <span className="turno-mes">{mes}</span>
      </div>

      <div className="turno-info">
        <h2>Tu próximo turno</h2>
        <p className="turno-cuando">
          {diaSemana} a las {turno.hour} h
        </p>
        <p className="turno-motivo">{turno.motive}</p>
        <PasosTurno estado={turno.status} />
        {AYUDA[turno.status] && (
          <p className="turno-ayuda">{AYUDA[turno.status]}</p>
        )}
      </div>

      <div className="turno-acciones">
        <button className="peligro" onClick={() => onCancelar(turno._id)}>
          Cancelar turno
        </button>
      </div>
    </article>
  );
}
