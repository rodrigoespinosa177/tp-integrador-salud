import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { login as loginApi } from '../api/auth.api';
import { RUTA_POR_ROL } from '../routes/rutasPorRol';

function leerUsuarioGuardado() {
  try {
    const guardado = localStorage.getItem('user');
    const user = guardado ? JSON.parse(guardado) : null;
    // Si el usuario guardado no tiene un rol válido, lo ignoramos
    if (!user || !RUTA_POR_ROL[user.rol]) return null;
    return user;
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
