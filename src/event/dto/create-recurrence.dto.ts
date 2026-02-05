import { RecurrenceFreq } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CreateRecurrenceDto {
  @IsEnum(RecurrenceFreq)
  freq: RecurrenceFreq;

  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @IsOptional()
  @IsString()
  byDay?: string; // e.g., "MO,WE,FR"

  @IsOptional()
  @IsInt()
  byMonthDay?: number;

  @IsOptional()
  @IsDateString()
  until?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;
}

function IsString() {
  return (target: any, propertyKey: string) => {};
}
