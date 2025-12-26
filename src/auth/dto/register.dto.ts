import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({type: String , format: "email"})
  @IsEmail({}, {message: "ایمیل وارد شده معتبر نیست"})
  @IsNotEmpty({message: "ایمیل نمیتواند خالی باشد"})
  email: string;

  @ApiProperty({type: String , format: "password", minimum: 8, required: true})
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({type: String , required: true})
  @IsString()
  @IsNotEmpty()
  name: string;
}