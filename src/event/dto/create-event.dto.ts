import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  pageId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTimeUtc: string;

  @IsDateString()
  endTimeUtc: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
