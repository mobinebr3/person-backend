// auth.controller.ts
import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { MessageCode } from 'src/common/message-code.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @MessageCode(1000)
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @Public()
  @MessageCode(1001)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user)
  }
}
