import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTimeUtc?: string;

  @IsOptional()
  @IsDateString()
  endTimeUtc?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;
}
