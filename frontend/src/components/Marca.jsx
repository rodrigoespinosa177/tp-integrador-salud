import { Link } from 'react-router-dom';

// Logo de AMBO: las cinco barras con los colores de los ambos (uniformes sanitarios)
export default function Marca({ destino = '/' }) {
  return (
    <Link to={destino} className="marca" aria-label="AMBO, ir al inicio">
      <span className="marca-barras" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className="marca-texto">AMBO</span>
    </Link>
  );
}
