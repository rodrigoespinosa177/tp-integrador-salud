import { describe, it, expect } from 'vitest';
import { puedeEditarSigno, VENTANA_EDICION_MS } from './signos';

describe('puedeEditarSigno', () => {
  const ahora = new Date('2026-10-28T10:00:00Z').getTime();
  const registro = (hace, nurse_id = 'u2') => ({
    nurse_id,
    createdAt: new Date(ahora - hace).toISOString(),
  });

  it('permite editar el registro propio dentro de los 5 minutos', () => {
    expect(puedeEditarSigno(registro(60 * 1000), 'u2', ahora)).toBe(true);
    expect(puedeEditarSigno(registro(VENTANA_EDICION_MS), 'u2', ahora)).toBe(
      true,
    );
  });

  it('no permite editar pasados los 5 minutos', () => {
    expect(
      puedeEditarSigno(registro(VENTANA_EDICION_MS + 1000), 'u2', ahora),
    ).toBe(false);
  });

  it('no permite editar el registro de otro enfermero', () => {
    expect(puedeEditarSigno(registro(1000, 'u8'), 'u2', ahora)).toBe(false);
  });

  it('usa la fecha del registro si no trae createdAt', () => {
    const r = { nurse_id: 'u2', date: new Date(ahora - 1000).toISOString() };
    expect(puedeEditarSigno(r, 'u2', ahora)).toBe(true);
  });
});
