import { OmitType } from '@nestjs/swagger';
import { UpdateUsuarioDto } from './update-usuario.dto';

// Datos que un usuario puede cambiar de sí mismo: no puede tocar su rol ni su estado.
export class UpdatePerfilDto extends OmitType(UpdateUsuarioDto, ['rol', 'is_active'] as const) {}
