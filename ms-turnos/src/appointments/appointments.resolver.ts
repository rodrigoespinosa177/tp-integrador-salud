import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Appointment } from './appointment.schema';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Resolver(() => Appointment)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Query(() => [Appointment], { name: 'appointments' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Args('patient_id', { nullable: true }) patientId?: string,
  ) {
    return this.appointmentsService.findAll(user, patientId);
  }

  @Query(() => Appointment, { name: 'appointment' })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.findOneFor(id, user);
  }

  @Mutation(() => Appointment)
  @Roles(Rol.ADMINISTRATOR, Rol.PATIENT)
  createAppointment(
    @Args('input') input: CreateAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.create(input, user);
  }

  @Mutation(() => Appointment)
  @Roles(Rol.ADMINISTRATOR, Rol.PATIENT)
  updateAppointment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.update(id, input, user);
  }

  @Mutation(() => Boolean)
  @Roles(Rol.ADMINISTRATOR)
  async removeAppointment(@Args('id', { type: () => ID }) id: string) {
    await this.appointmentsService.remove(id);
    return true;
  }
}
