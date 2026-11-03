import { registerEnumType } from '@nestjs/graphql';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

registerEnumType(AppointmentStatus, { name: 'AppointmentStatus' });
