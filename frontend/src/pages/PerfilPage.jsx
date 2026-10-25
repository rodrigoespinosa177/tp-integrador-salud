import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { actualizarMiPerfil } from '../api/usuarios.api';
import FormularioUsuario from '../components/FormularioUsuario';

export default function PerfilPage() {
  const { user, actualizarSesion } = useAuth();
  const [mensaje, setMensaje] = useState('');

  async function handleGuardar(datos) {
    setMensaje('');
    const actualizado = await actualizarMiPerfil(user._id, datos);
    actualizarSesion(actualizado);
    setMensaje('Tus datos se guardaron correctamente');
  }

  return (
    <section>
      <h1>Mi perfil</h1>

      {mensaje && <p role="status">{mensaje}</p>}

      <FormularioUsuario
        key={user._id}
        inicial={user}
        permitirRol={false}
        titulo="Mis datos"
        onGuardar={handleGuardar}
      />
    </section>
  );
}
