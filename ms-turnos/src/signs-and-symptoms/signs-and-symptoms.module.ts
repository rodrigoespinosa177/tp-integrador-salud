import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuthModule } from '../auth/auth.module';
import {
  SignAndSymptom,
  SignAndSymptomSchema,
} from './sign-and-symptom.schema';
import {
  AppointmentSignsController,
  SignsAndSymptomsController,
} from './signs-and-symptoms.controller';
import { SignsAndSymptomsResolver } from './signs-and-symptoms.resolver';
import { SignsAndSymptomsService } from './signs-and-symptoms.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SignAndSymptom.name, schema: SignAndSymptomSchema },
    ]),
    AppointmentsModule,
    AuthModule,
  ],
  controllers: [SignsAndSymptomsController, AppointmentSignsController],
  providers: [SignsAndSymptomsService, SignsAndSymptomsResolver],
  exports: [SignsAndSymptomsService],
})
export class SignsAndSymptomsModule {}
