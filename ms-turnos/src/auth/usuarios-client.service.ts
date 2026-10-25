import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Los usuarios viven en otro microservicio (otra base), así que la relación
// turno -> paciente se valida consultándolo por HTTP con el token del que llama.
@Injectable()
export class UsuariosClient {
  constructor(private readonly config: ConfigService) {}

  // Verifica que patientId sea un paciente activo. Solo lo pueden usar
  // administradores y enfermeros (el endpoint de pacientes es para ellos).
  async assertPacienteActivo(patientId: string, token: string): Promise<void> {
    const baseUrl = this.config.get<string>('MS_USUARIOS_URL');
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'MS_USUARIOS_URL no está configurada: no se puede validar al paciente',
      );
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(`${baseUrl}/usuarios/pacientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo contactar al servicio de usuarios para validar al paciente',
      );
    }
    if (!respuesta.ok) {
      throw new ServiceUnavailableException(
        `El servicio de usuarios respondió ${respuesta.status} al validar al paciente`,
      );
    }

    const pacientes = (await respuesta.json()) as { _id: string }[];
    if (!pacientes.some((p) => String(p._id) === patientId)) {
      throw new BadRequestException(
        `El paciente ${patientId} no existe o no está activo`,
      );
    }
  }
}
