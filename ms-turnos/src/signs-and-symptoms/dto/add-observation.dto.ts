import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class AddObservationDto {
  @ApiProperty({ example: 'El paciente refiere mejoría' })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}
