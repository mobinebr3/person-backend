import { TemplateType } from '@prisma/client';
import { IsEnum, IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(TemplateType)
  @IsNotEmpty()
  templateType: TemplateType;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
