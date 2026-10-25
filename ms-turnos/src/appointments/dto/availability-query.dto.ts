import { IsDateString } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString({ strict: true })
  date: string;
}
