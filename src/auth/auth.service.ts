import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppException } from '../common/exceptions/app.exceptions.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, pass: string, name: string) {
    // بررسی ورودی‌ها
    if (!email || !pass || !name) {
      throw new AppException(1002, 'ایمیل، رمز عبور و نام الزامی هستند');
    }

    // ۱. بررسی تکراری نبودن ایمیل
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) throw new AppException(1001, 'این ایمیل قبلاً ثبت شده است');

    // ۲. هش کردن پسورد
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(pass, salt);

    // ۳. ذخیره در دیتابیس
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
      },
    });

    return { message: 'ثبت‌نام با موفقیت انجام شد', userId: user.id };
  }

  async login(email: string, pass: string) {
    if (!email || !pass) {
      throw new BadRequestException('ایمیل و رمز عبور الزامی هستند');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('ایمیل یا رمز عبور اشتباه است');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new BadRequestException('ایمیل یا رمز عبور اشتباه است');

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async getProfile(user) {
  
    if (!user) throw new Error('کاربر');
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      upDateAt: user.updatedAt,
    };
  }
}
