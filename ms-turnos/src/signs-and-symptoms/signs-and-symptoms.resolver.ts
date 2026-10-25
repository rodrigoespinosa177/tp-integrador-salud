import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateSignAndSymptomDto } from './dto/create-sign-and-symptom.dto';
import { UpdateSignAndSymptomDto } from './dto/update-sign-and-symptom.dto';
import { SignAndSymptom } from './sign-and-symptom.schema';
import { SignsAndSymptomsService } from './signs-and-symptoms.service';

@Resolver(() => SignAndSymptom)
export class SignsAndSymptomsResolver {
  constructor(private readonly signsService: SignsAndSymptomsService) {}

  @Query(() => [SignAndSymptom], { name: 'signsAndSymptoms' })
  findAll(
    @Args('medical_appointment_id', { nullable: true }) appointmentId?: string,
  ) {
    return this.signsService.findAll(appointmentId);
  }

  @Query(() => SignAndSymptom, { name: 'signAndSymptom' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.signsService.findOne(id);
  }

  @Mutation(() => SignAndSymptom)
  createSignAndSymptom(@Args('input') input: CreateSignAndSymptomDto) {
    return this.signsService.create(input);
  }

  @Mutation(() => SignAndSymptom)
  updateSignAndSymptom(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSignAndSymptomDto,
  ) {
    return this.signsService.update(id, input);
  }

  @Mutation(() => Boolean)
  async removeSignAndSymptom(@Args('id', { type: () => ID }) id: string) {
    await this.signsService.remove(id);
    return true;
  }
}
