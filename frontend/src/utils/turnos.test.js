import { describe, it, expect } from 'vitest';
import { formatearFecha, generarHorarios, HORARIOS, hoyISO } from './turnos';

describe('utils de turnos', () => {
  it('formatea la fecha al formato argentino', () => {
    expect(formatearFecha('2026-10-28')).toBe('28/10/2026');
  });

  it('genera las franjas de 08:00 a 17:00 cada 30 minutos', () => {
    expect(HORARIOS).toHaveLength(19);
    expect(HORARIOS[0]).toBe('08:00');
    expect(HORARIOS[1]).toBe('08:30');
    expect(HORARIOS.at(-1)).toBe('17:00');
    expect(generarHorarios('09:00', '10:00', 60)).toEqual(['09:00', '10:00']);
  });

  it('devuelve la fecha de hoy con formato AAAA-MM-DD', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
