// Sonido de la presentación, generado en el momento con la Web Audio API.
// No usa archivos de audio: no hay nada que descargar ni licencias que pedir.
// Está inspirado en la sala de espera: el "ding-dong" que llama al próximo turno
// y notas cortas de marimba, que suenan cálidas y no cansan.
// Se tiene que crear dentro de un clic: los navegadores bloquean el sonido
// hasta que la persona interactúa con la página.

const VOLUMEN = 0.75;

export function crearSonidoIntro() {
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;

  const ctx = new Contexto();
  ctx.resume?.().catch(() => {});

  const salida = ctx.createGain();
  salida.gain.value = VOLUMEN;
  const compresor = ctx.createDynamicsCompressor();
  salida.connect(compresor);
  compresor.connect(ctx.destination);

  // Un eco corto, como el de una sala grande
  const eco = ctx.createDelay();
  eco.delayTime.value = 0.18;
  const ecoVolumen = ctx.createGain();
  ecoVolumen.gain.value = 0.22;
  eco.connect(ecoVolumen);
  ecoVolumen.connect(eco);
  ecoVolumen.connect(salida);

  function conectar(nodo, conEco = true) {
    nodo.connect(salida);
    if (conEco) nodo.connect(eco);
  }

  // Nota de marimba: un tono que se apaga rápido más un golpe agudo de madera
  function marimba(frecuencia, inicio, nivel = 0.25) {
    [
      { multiplo: 1, caida: 0.9, nivel },
      { multiplo: 4, caida: 0.12, nivel: nivel * 0.35 },
    ].forEach((capa) => {
      const osc = ctx.createOscillator();
      const volumen = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frecuencia * capa.multiplo, inicio);
      volumen.gain.setValueAtTime(0.0001, inicio);
      volumen.gain.exponentialRampToValueAtTime(capa.nivel, inicio + 0.004);
      volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + capa.caida);
      osc.connect(volumen);
      conectar(volumen);
      osc.start(inicio);
      osc.stop(inicio + capa.caida + 0.05);
    });
  }

  // Campanita de llamador: un tono con un leve temblor, como un timbre electrónico
  function campanita(frecuencia, inicio, nivel = 0.2, caida = 1.3) {
    const osc = ctx.createOscillator();
    const volumen = ctx.createGain();
    const temblor = ctx.createOscillator();
    const profundidad = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frecuencia, inicio);
    temblor.frequency.value = 6;
    profundidad.gain.value = frecuencia * 0.004;
    temblor.connect(profundidad);
    profundidad.connect(osc.frequency);
    volumen.gain.setValueAtTime(0.0001, inicio);
    volumen.gain.exponentialRampToValueAtTime(nivel, inicio + 0.01);
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + caida);
    osc.connect(volumen);
    conectar(volumen);
    osc.start(inicio);
    temblor.start(inicio);
    osc.stop(inicio + caida + 0.05);
    temblor.stop(inicio + caida + 0.05);
  }

  // Golpe grave y corto, para cuando una franja termina de subir
  function golpe(inicio) {
    const osc = ctx.createOscillator();
    const volumen = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, inicio);
    osc.frequency.exponentialRampToValueAtTime(55, inicio + 0.18);
    volumen.gain.setValueAtTime(0.0001, inicio);
    volumen.gain.exponentialRampToValueAtTime(0.35, inicio + 0.005);
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.25);
    osc.connect(volumen);
    conectar(volumen, false);
    osc.start(inicio);
    osc.stop(inicio + 0.3);
  }

  const cerrar = () => {
    if (ctx.state !== 'closed') ctx.close().catch(() => {});
  };

  return {
    // "Ding-dong" del llamador de turnos de la sala de espera
    llamado() {
      const t = ctx.currentTime;
      campanita(659.25, t, 0.22);
      campanita(523.25, t + 0.42, 0.22, 1.6);
    },

    // Una nota de marimba por cada franja (escala pentatónica de Sol)
    franja(paso) {
      const notas = [392, 440, 493.88, 587.33, 659.25];
      const t = ctx.currentTime;
      golpe(t + 0.55);
      marimba(notas[paso % notas.length], t + 0.55);
    },

    // Arpegio rápido hacia arriba y el llamado otra vez: "es tu turno"
    final() {
      const t = ctx.currentTime;
      [392, 493.88, 587.33, 783.99, 987.77].forEach((frecuencia, i) =>
        marimba(frecuencia, t + i * 0.08, 0.2),
      );
      campanita(783.99, t + 0.7, 0.16);
      campanita(659.25, t + 1.1, 0.16, 2);
    },

    silenciar(silencio) {
      salida.gain.setTargetAtTime(
        silencio ? 0 : VOLUMEN,
        ctx.currentTime,
        0.05,
      );
    },

    apagarDespacio(segundos = 0.7) {
      if (ctx.state === 'closed') return;
      const t = ctx.currentTime;
      salida.gain.cancelScheduledValues(t);
      salida.gain.setValueAtTime(salida.gain.value, t);
      salida.gain.linearRampToValueAtTime(0, t + segundos);
      setTimeout(cerrar, segundos * 1000 + 100);
    },

    cerrar,
  };
}
