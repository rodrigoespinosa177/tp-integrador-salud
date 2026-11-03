import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import PacientePage from './pages/PacientePage';
import EnfermeroPage from './pages/EnfermeroPage';
import AdminPage from './pages/AdminPage';
import PerfilPage from './pages/PerfilPage';
import RegistroPage from './pages/RegistroPage';
import IntroPage from './pages/IntroPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IntroPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<RegistroPage />} />
      {/* Todo lo de acá adentro requiere estar logueado */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute roles={['patient']} />}>
            <Route path="/paciente" element={<PacientePage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['nurse']} />}>
            <Route path="/enfermero" element={<EnfermeroPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['administrator']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['patient', 'nurse']} />}>
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>
        </Route>
      </Route>

      {/* Cualquier dirección que no exista, a la intro */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
