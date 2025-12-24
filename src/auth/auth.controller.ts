// auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { MessageCode } from 'src/common/message-code.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @MessageCode(1000)
  register(@Body() body: any) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @MessageCode(1001)
  login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }
}