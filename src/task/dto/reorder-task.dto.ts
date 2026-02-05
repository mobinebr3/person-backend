import { IsInt, Min } from 'class-validator';

export class ReorderTaskDto {
  @IsInt()
  @Min(0)
  newOrder: number;
}
