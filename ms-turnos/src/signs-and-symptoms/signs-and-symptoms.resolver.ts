import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AddObservationDto } from './dto/add-observation.dto';
import { CreateSignAndSymptomDto } from './dto/create-sign-and-symptom.dto';
import { UpdateSignAndSymptomDto } from './dto/update-sign-and-symptom.dto';
import { SignAndSymptom } from './sign-and-symptom.schema';
import { SignsAndSymptomsService } from './signs-and-symptoms.service';

@Resolver(() => SignAndSymptom)
@UseGuards(JwtAuthGuard, RolesGuard)
export class SignsAndSymptomsResolver {
  constructor(private readonly signsService: SignsAndSymptomsService) {}

  @Query(() => [SignAndSymptom], { name: 'signsAndSymptoms' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Args('medical_appointment_id', { nullable: true }) appointmentId?: string,
  ) {
    return this.signsService.findAll(user, appointmentId);
  }

  @Query(() => SignAndSymptom, { name: 'signAndSymptom' })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signsService.findOne(id, user);
  }

  @Mutation(() => SignAndSymptom)
  @Roles(Rol.NURSE)
  createSignAndSymptom(
    @Args('input') input: CreateSignAndSymptomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signsService.create(input, user);
  }

  @Mutation(() => SignAndSymptom)
  @Roles(Rol.NURSE, Rol.ADMINISTRATOR)
  updateSignAndSymptom(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSignAndSymptomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signsService.update(id, input, user);
  }

  @Mutation(() => SignAndSymptom)
  @Roles(Rol.NURSE)
  addObservation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: AddObservationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signsService.addObservation(id, input, user);
  }

  @Mutation(() => Boolean)
  @Roles(Rol.NURSE, Rol.ADMINISTRATOR)
  async removeSignAndSymptom(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.signsService.remove(id, user);
    return true;
  }
}
