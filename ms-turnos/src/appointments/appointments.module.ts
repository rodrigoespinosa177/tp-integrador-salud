import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Appointment, AppointmentSchema } from './appointment.schema';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsResolver } from './appointments.resolver';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsResolver],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
