import { useCallback, useEffect, useRef, useState } from 'react';

// Guía paso a paso: oscurece la pantalla, resalta una parte y explica qué es.
// Si una parte no está en pantalla (por ejemplo, no hay turnos), saltea ese paso.
export default function Tutorial({ pasos, onCerrar }) {
  const [indice, setIndice] = useState(0);
  const [caja, setCaja] = useState(null);
  const direccion = useRef(1);
  const tarjetaRef = useRef(null);

  const paso = pasos[indice];
  const esUltimo = indice === pasos.length - 1;

  const siguiente = useCallback(() => {
    direccion.current = 1;
    if (indice >= pasos.length - 1) onCerrar();
    else setIndice(indice + 1);
  }, [indice, pasos.length, onCerrar]);

  const anterior = useCallback(() => {
    direccion.current = -1;
    if (indice > 0) setIndice(indice - 1);
  }, [indice]);

  // Busca la parte de la pantalla de este paso y mide dónde está
  useEffect(() => {
    let intentos = 0;
    let temporizador;
    let elemento = null;
    // El primer paso espera más, porque la página puede estar cargando datos
    const maxIntentos = indice === 0 ? 20 : 4;

    function medir() {
      if (!elemento) return;
      const r = elemento.getBoundingClientRect();
      setCaja({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    function buscar() {
      elemento = document.querySelector(paso.selector);
      // Si existe pero está oculto (por ejemplo, en el celular), cuenta como que no está
      if (elemento && elemento.getClientRects().length === 0) elemento = null;
      if (elemento) {
        elemento.scrollIntoView({ block: 'center' });
        requestAnimationFrame(medir);
      } else if (intentos < maxIntentos) {
        intentos += 1;
        temporizador = setTimeout(buscar, 100);
      } else {
        // No está en pantalla: pasa al siguiente (o al anterior si iba para atrás)
        const destino = indice + direccion.current;
        if (destino < 0 || destino >= pasos.length) onCerrar();
        else setIndice(destino);
      }
    }

    temporizador = setTimeout(buscar, 0);
    window.addEventListener('resize', medir);
    window.addEventListener('scroll', medir, true);

    return () => {
      clearTimeout(temporizador);
      window.removeEventListener('resize', medir);
      window.removeEventListener('scroll', medir, true);
    };
  }, [indice, paso.selector, pasos.length, onCerrar]);

  // Lleva el foco a la tarjeta en cada paso, para quien usa teclado o lector de pantalla
  useEffect(() => {
    tarjetaRef.current?.focus();
  }, [indice]);

  // Teclado: Escape cierra, flechas avanzan y retroceden
  useEffect(() => {
    function alApretar(e) {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'ArrowRight') siguiente();
      if (e.key === 'ArrowLeft') anterior();
    }
    window.addEventListener('keydown', alApretar);
    return () => window.removeEventListener('keydown', alApretar);
  }, [onCerrar, siguiente, anterior]);

  // La tarjeta va debajo de lo resaltado si entra; si no, arriba
  const margen = 14;
  let estiloTarjeta = {};
  if (caja) {
    const espacioAbajo = window.innerHeight - (caja.top + caja.height);
    const izquierda = Math.min(
      Math.max(16, caja.left),
      window.innerWidth - 376,
    );
    estiloTarjeta =
      espacioAbajo > 230
        ? { top: caja.top + caja.height + margen, left: izquierda }
        : { bottom: window.innerHeight - caja.top + margen, left: izquierda };
  }

  return (
    <div
      className="tutorial"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-titulo"
    >
      {caja && (
        <div
          className="tutorial-foco"
          style={{
            top: caja.top - 6,
            left: caja.left - 6,
            width: caja.width + 12,
            height: caja.height + 12,
          }}
        />
      )}

      <div
        className="tutorial-tarjeta"
        ref={tarjetaRef}
        tabIndex={-1}
        style={estiloTarjeta}
      >
        <p className="tutorial-progreso">
          Paso {indice + 1} de {pasos.length}
        </p>
        <h2 id="tutorial-titulo">{paso.titulo}</h2>
        <p>{paso.texto}</p>

        <div className="tutorial-acciones">
          <button type="button" className="tutorial-saltar" onClick={onCerrar}>
            Saltar guía
          </button>
          <div className="tutorial-navegacion">
            {indice > 0 && (
              <button type="button" className="secundario" onClick={anterior}>
                Anterior
              </button>
            )}
            <button type="button" onClick={siguiente}>
              {esUltimo ? 'Terminar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
