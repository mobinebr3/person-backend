import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('user-data')
  getUserData(@Req() req) {
    return {
      message: 'اطلاعات کاربر',
      user: req.user,
    };
  }
}
