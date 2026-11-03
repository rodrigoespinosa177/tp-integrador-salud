import Marca from './Marca';

// Pantalla dividida para login y registro: a la izquierda qué es el sistema,
// a la derecha el formulario
export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth-lateral">
        <Marca destino="/" />

        <p className="auth-lema">
          Tus turnos del centro de salud, en un solo lugar.
        </p>

        <ol className="auth-recorrido" aria-label="Cómo funciona un turno">
          <li>
            <span className="auth-paso">1</span>
            <span>
              <strong>Pedís el turno</strong>
              Elegís el día, la hora y el motivo de la consulta.
            </span>
          </li>
          <li>
            <span className="auth-paso">2</span>
            <span>
              <strong>El centro lo confirma</strong>
              Ves el estado de tu turno en todo momento.
            </span>
          </li>
          <li>
            <span className="auth-paso">3</span>
            <span>
              <strong>Enfermería te atiende</strong>
              Registra tus signos vitales y el turno queda como atendido.
            </span>
          </li>
        </ol>
      </aside>

      <main className="auth-principal">{children}</main>
    </div>
  );
}
