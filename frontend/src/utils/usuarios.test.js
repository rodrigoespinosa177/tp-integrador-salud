import { describe, it, expect } from 'vitest';
import { normalizarUsuario } from './usuarios';

describe('normalizarUsuario', () => {
  it('recorta la fecha completa del back al formato del input de fecha', () => {
    const usuario = {
      first_name: 'Rodrigo',
      birthdate: '1995-05-15T00:00:00.000Z',
    };
    expect(normalizarUsuario(usuario).birthdate).toBe('1995-05-15');
  });

  it('deja la fecha vacía si el usuario no tiene', () => {
    expect(normalizarUsuario({ first_name: 'Rodrigo' }).birthdate).toBe('');
  });
});
