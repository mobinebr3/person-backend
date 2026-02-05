import { JobStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;
}
