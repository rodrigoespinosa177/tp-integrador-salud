import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Simula estar logueado con "user" e intentar entrar a "ruta"
function entrarComo(user, ruta) {
  render(
    <AuthContext.Provider value={{ user }}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/login" element={<p>Pantalla de login</p>} />
          <Route path="/paciente" element={<p>Página del paciente</p>} />
          <Route path="/enfermero" element={<p>Página del enfermero</p>} />
          <Route element={<ProtectedRoute roles={['administrator']} />}>
            <Route path="/admin" element={<p>Panel admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('manda al login si no hay sesión', () => {
    entrarComo(null, '/admin');
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('devuelve al paciente a su sección si intenta entrar al panel admin', () => {
    entrarComo({ _id: 'u3', rol: 'patient' }, '/admin');
    expect(screen.getByText('Página del paciente')).toBeInTheDocument();
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument();
  });

  it('devuelve al enfermero a su sección si intenta entrar al panel admin', () => {
    entrarComo({ _id: 'u2', rol: 'nurse' }, '/admin');
    expect(screen.getByText('Página del enfermero')).toBeInTheDocument();
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument();
  });

  it('deja entrar al administrador', () => {
    entrarComo({ _id: 'u1', rol: 'administrator' }, '/admin');
    expect(screen.getByText('Panel admin')).toBeInTheDocument();
  });
});
