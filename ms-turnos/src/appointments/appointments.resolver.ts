import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Appointment } from './appointment.schema';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Resolver(() => Appointment)
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Query(() => [Appointment], { name: 'appointments' })
  findAll(@Args('patient_id', { nullable: true }) patientId?: string) {
    return this.appointmentsService.findAll(patientId);
  }

  @Query(() => Appointment, { name: 'appointment' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Mutation(() => Appointment)
  createAppointment(@Args('input') input: CreateAppointmentDto) {
    return this.appointmentsService.create(input);
  }

  @Mutation(() => Appointment)
  updateAppointment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, input);
  }

  @Mutation(() => Boolean)
  async removeAppointment(@Args('id', { type: () => ID }) id: string) {
    await this.appointmentsService.remove(id);
    return true;
  }
}
