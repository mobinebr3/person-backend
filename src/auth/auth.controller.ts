// auth.controller.ts
import { Body, Controller, Get, Post, Request, Response, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @Public()
  @MessageCode(1005)
  async refreshToken(@Request() req) {
  const userId = req.user.userId; 
  const refreshToken = req.user.refreshToken;
  
  return this.authService.refreshTokens(userId, refreshToken);
  } 

  @Post('login')
  @Public()
  @MessageCode(1003)
  async login(@Body() body: LoginDto, @Response({passthrough: true}) response: any) {
    const tokens = await this.authService.login(body.email, body.password);

    response.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: tokens.access_token
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user)
  }
}
