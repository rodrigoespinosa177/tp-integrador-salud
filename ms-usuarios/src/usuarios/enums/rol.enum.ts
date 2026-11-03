import { registerEnumType } from '@nestjs/graphql';

export enum Rol {
  ADMINISTRATOR = 'administrator',
  NURSE = 'nurse',
  PATIENT = 'patient',
}

registerEnumType(Rol, {
  name: 'Rol',
  description: 'Roles disponibles en el sistema de salud',
});