import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RUTA_POR_ROL } from '../routes/rutasPorRol';
import Marca from '../components/Marca';
import TurnoDestacado from '../components/TurnoDestacado';

// Fecha de ejemplo: siempre dos días después de hoy, para que el turno se vea a futuro
function fechaDeEjemplo() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const TURNO_DE_EJEMPLO = {
  _id: 'ejemplo',
  date: fechaDeEjemplo(),
  hour: '09:30',
  motive: 'Control de presión arterial',
  status: 'confirmed',
};

const RECORRIDO = [
  {
    titulo: 'Pedís el turno',
    texto:
      'Elegís el día, la hora y el motivo de la consulta, desde el celular o la compu.',
  },
  {
    titulo: 'El centro lo confirma',
    texto: 'Administración revisa la solicitud y te confirma el turno.',
  },
  {
    titulo: 'Enfermería te atiende',
    texto:
      'Registra tus signos vitales y síntomas, y el turno queda como atendido.',
  },
];

const ROLES = [
  {
    clase: 'rol-paciente',
    titulo: 'Pacientes',
    texto:
      'Piden turnos, ven en qué estado está cada uno y los cancelan si no pueden ir.',
  },
  {
    clase: 'rol-enfermeria',
    titulo: 'Enfermería',
    texto:
      'Ven los turnos confirmados y registran los signos vitales y síntomas de cada paciente.',
  },
  {
    clase: 'rol-administracion',
    titulo: 'Administración',
    texto:
      'Gestionan las cuentas y los turnos del centro, y buscan a cualquier persona por nombre o DNI.',
  },
];

export default function IntroPage() {
  const { user } = useAuth();

  // Si ya inició sesión, va directo a su sección
  if (user) return <Navigate to={RUTA_POR_ROL[user.rol]} replace />;

  return (
    <div className="intro">
      <header className="intro-barra">
        <Marca destino="/" />
        <nav className="intro-acciones" aria-label="Cuenta">
          <Link to="/login" className="boton secundario">
            Ingresar
          </Link>
          <Link to="/registro" className="boton">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main>
        <section className="intro-portada">
          <div className="intro-texto">
            <h1>Tus turnos del centro de salud, en un solo lugar.</h1>
            <p>
              AMBO conecta a pacientes, enfermería y administración. Pedís tu
              turno, el centro lo confirma y enfermería registra tu atención,
              sin filas ni llamados.
            </p>
            <div className="intro-botones">
              <Link to="/registro" className="boton">
                Crear cuenta de paciente
              </Link>
              <Link to="/login" className="boton secundario">
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div
            className="intro-muestra"
            aria-label="Ejemplo de un turno en AMBO"
          >
            <TurnoDestacado turno={TURNO_DE_EJEMPLO} />
          </div>
        </section>

        <section className="intro-seccion" aria-labelledby="titulo-recorrido">
          <h2 id="titulo-recorrido">Cómo funciona un turno</h2>
          <ol className="intro-recorrido">
            {RECORRIDO.map((paso, i) => (
              <li key={paso.titulo}>
                <span className="intro-numero">{i + 1}</span>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="intro-seccion" aria-labelledby="titulo-roles">
          <h2 id="titulo-roles">
            Una herramienta para cada persona del centro
          </h2>
          <div className="intro-roles">
            {ROLES.map((rol) => (
              <div key={rol.titulo} className={`intro-rol ${rol.clase}`}>
                <h3>{rol.titulo}</h3>
                <p>{rol.texto}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="intro-pie">
        <p>
          <strong>AMBO</strong> es el trabajo integrador de Programación III del
          IES 9-023.
        </p>
        <p>Hecho por Rodrigo Espinosa, Rubén Ledesma y Santiago Romano.</p>
      </footer>
    </div>
  );
}
