import { describe, it, expect } from 'vitest';
import { formatearFecha, hoyISO } from './turnos';

describe('utils de turnos', () => {
  it('formatea la fecha al formato argentino', () => {
    expect(formatearFecha('2026-10-28')).toBe('28/10/2026');
  });

  it('devuelve la fecha de hoy con formato AAAA-MM-DD', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
