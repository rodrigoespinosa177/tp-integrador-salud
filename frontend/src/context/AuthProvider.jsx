import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { login as loginApi } from '../api/auth.api';

function leerUsuarioGuardado() {
  try {
    const guardado = localStorage.getItem('user');
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leerUsuarioGuardado);

  async function login(email, password) {
    const data = await loginApi(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
