import { useCallback, useEffect, useRef, useState } from 'react';
import { crearSonidoIntro } from './sonidoIntro';
import { marcarIntroVista } from './visibilidadIntro';
import './IntroAnimada.css';

// Línea de tiempo, en milisegundos desde que se toca "Ver presentación"
const SEGUNDO_LLAMADO = 1800;
const INICIO_FRANJAS = 3600;
const PASO = 2400;
const FINAL_EN = INICIO_FRANJAS + PASO * 5;
const FINAL_DURA = 5000;
const SALIDA_MS = 600;

// Cada franja es uno de los colores de los ambos y cuenta una parte de AMBO.
// Al final se achican hasta las alturas del logo y forman la marca.
const PILARES = [
  {
    color: 'azul',
    alto: 60,
    titulo: 'Turnos sin filas',
    texto: 'Pedís tu turno desde el celular o la compu, sin llamar ni esperar.',
  },
  {
    color: 'verde',
    alto: 100,
    titulo: 'Enfermería al día',
    texto:
      'Los signos vitales de cada consulta quedan registrados en el turno.',
  },
  {
    color: 'amarillo',
    alto: 75,
    titulo: 'Siempre sabés en qué está',
    texto: 'Pedido, confirmado o atendido: el estado de tu turno, a la vista.',
  },
  {
    color: 'rosa',
    alto: 90,
    titulo: 'Pensada para todas las personas',
    texto: 'Letra fácil de leer y botones grandes, para cualquier edad.',
  },
  {
    color: 'rojo',
    alto: 55,
    titulo: 'Ningún horario perdido',
    texto: 'Si no podés ir, cancelás y el turno queda libre para otra persona.',
  },
];

function IconoSonido({ silenciado }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {silenciado ? (
        <>
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

function LogoBarras({ className }) {
  return (
    <span className={className} aria-hidden="true">
      {PILARES.map((p) => (
        <span
          key={p.color}
          className={`amboi-${p.color}`}
          style={{ '--alto': `${p.alto}%` }}
        />
      ))}
    </span>
  );
}

// Presentación animada de AMBO. onTerminar se llama cuando desaparece.
export default function IntroAnimada({ onTerminar }) {
  const [fase, setFase] = useState('entrada'); // entrada | llamado | franjas | final
  const [llamadoListo, setLlamadoListo] = useState(false);
  const [franjas, setFranjas] = useState(0);
  const [silenciado, setSilenciado] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const ejecucion = useRef({
    temporizadores: [],
    sonido: null,
    terminando: false,
  });
  const onTerminarRef = useRef(onTerminar);

  useEffect(() => {
    onTerminarRef.current = onTerminar;
  });

  const terminar = useCallback(() => {
    const ej = ejecucion.current;
    if (ej.terminando) return;
    ej.terminando = true;
    ej.temporizadores.forEach(clearTimeout);
    ej.temporizadores = [];
    ej.sonido?.apagarDespacio(SALIDA_MS / 1000);
    marcarIntroVista();

    // Saca ?intro de la dirección para que al recargar no se repita
    const url = new URL(window.location.href);
    if (url.searchParams.has('intro')) {
      url.searchParams.delete('intro');
      window.history.replaceState(
        null,
        '',
        url.pathname + url.search + url.hash,
      );
    }

    setSaliendo(true);
    setTimeout(() => onTerminarRef.current?.(), SALIDA_MS);
  }, []);

  function empezar() {
    const ej = ejecucion.current;
    // El sonido se crea acá, dentro del clic, para que el navegador lo permita
    ej.sonido = crearSonidoIntro();
    ej.sonido?.silenciar(silenciado);
    setFase('llamado');

    const en = (ms, accion) => ej.temporizadores.push(setTimeout(accion, ms));

    en(250, () => ej.sonido?.llamado());
    en(SEGUNDO_LLAMADO, () => {
      setLlamadoListo(true);
      ej.sonido?.llamado();
    });

    PILARES.forEach((_, i) =>
      en(INICIO_FRANJAS + i * PASO, () => {
        setFase('franjas');
        setFranjas(i + 1);
        ej.sonido?.franja(i);
      }),
    );

    en(FINAL_EN, () => {
      setFase('final');
      ej.sonido?.final();
    });

    en(FINAL_EN + FINAL_DURA, terminar);
  }

  function alternarSonido() {
    const siguiente = !silenciado;
    setSilenciado(siguiente);
    ejecucion.current.sonido?.silenciar(siguiente);
  }

  // Escape saltea la presentación
  useEffect(() => {
    function alApretar(e) {
      if (e.key === 'Escape') terminar();
    }
    window.addEventListener('keydown', alApretar);
    return () => window.removeEventListener('keydown', alApretar);
  }, [terminar]);

  // La página de atrás no se desplaza mientras se ve la presentación
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  // Limpieza si se sale de la página en medio de la presentación
  useEffect(() => {
    const ej = ejecucion.current;
    return () => {
      ej.temporizadores.forEach(clearTimeout);
      ej.sonido?.cerrar();
    };
  }, []);

  const enCurso = fase !== 'entrada';
  const esFinal = fase === 'final';
  const pilar = PILARES[franjas - 1];

  return (
    <div
      className={`amboi${saliendo ? ' saliendo' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Presentación de AMBO"
    >
      {/* Controles durante la presentación */}
      {enCurso && (
        <div className="amboi-controles">
          <button
            type="button"
            className="amboi-control amboi-control-icono"
            onClick={alternarSonido}
            aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
          >
            <IconoSonido silenciado={silenciado} />
          </button>
          {!esFinal && (
            <button type="button" className="amboi-control" onClick={terminar}>
              Saltar
            </button>
          )}
        </div>
      )}

      {/* 1. Entrada: el clic habilita el sonido */}
      {fase === 'entrada' && (
        <section className="amboi-entrada">
          <div className="amboi-marca">
            <LogoBarras className="amboi-logo" />
            <p className="amboi-nombre">AMBO</p>
          </div>
          <p className="amboi-aviso">
            Una presentación de 20 segundos, con sonido.
          </p>
          <div className="amboi-botones">
            <button type="button" onClick={empezar} autoFocus>
              Ver presentación
            </button>
            <button type="button" className="secundario" onClick={terminar}>
              Ir al inicio
            </button>
          </div>
        </section>
      )}

      {/* 2. El llamador de la sala de espera */}
      {fase === 'llamado' && (
        <section className="amboi-llamado">
          <div className="amboi-pantalla" aria-hidden="true">
            <span className="amboi-pantalla-etiqueta">Turno</span>
            <span
              key={llamadoListo ? 'b' : 'a'}
              className="amboi-pantalla-numero"
            >
              {llamadoListo ? 'A-042' : 'A-041'}
            </span>
          </div>
          <p
            key={llamadoListo ? 'b' : 'a'}
            className="amboi-llamado-frase"
            aria-live="polite"
          >
            {llamadoListo
              ? 'Con AMBO, tu turno te espera a vos.'
              : 'Antes, pedir un turno era esperar.'}
          </p>
        </section>
      )}

      {/* 3 y 4. Las franjas suben una por una y al final forman el logo */}
      {(fase === 'franjas' || esFinal) && (
        <section className={`amboi-escena${esFinal ? ' final' : ''}`}>
          <div className="amboi-franjas" aria-hidden="true">
            {PILARES.map((p, i) => (
              <span
                key={p.color}
                className={`amboi-franja amboi-${p.color}${i < franjas ? ' visible' : ''}`}
                style={{ '--alto': `${p.alto}%` }}
              />
            ))}
          </div>

          <div className="amboi-relato" aria-live="polite">
            {fase === 'franjas' && pilar && (
              <div key={franjas} className="amboi-pilar">
                <span
                  className={`amboi-pilar-color amboi-${pilar.color}`}
                  aria-hidden="true"
                />
                <h2>{pilar.titulo}</h2>
                <p>{pilar.texto}</p>
              </div>
            )}

            {esFinal && (
              <div className="amboi-final">
                <p className="amboi-nombre">AMBO</p>
                <p className="amboi-lema">
                  Los turnos del centro de salud, en un solo lugar.
                </p>
                <button type="button" onClick={terminar}>
                  Ir al inicio
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
