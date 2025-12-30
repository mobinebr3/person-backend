import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({type: String , format: "email"})
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({type: String , format: "password", minimum: 8, required: true})
  @IsString()
  @IsNotEmpty()
  password: string;
}

