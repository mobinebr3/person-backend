import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}


  async register(email: string, pass: string, name: string) {
    if (!email || !pass || !name) {
      throw new BadRequestException('ایمیل، رمز عبور و نام الزامی هستند');
    }

    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) throw new ConflictException('این ایمیل قبلاً ثبت شده است');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(pass, salt);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
      },
    });
    
    return user.name;
  }

  async login(email: string, pass: string) {
    if (!email || !pass) {
      throw new BadRequestException('ایمیل و رمز عبور الزامی هستند');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ConflictException('ایمیل یا رمز عبور اشتباه است');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new ConflictException('ایمیل یا رمز عبور اشتباه است');

    const payload = { sub: user.id, email: user.email };

  const accessToken = await this.jwtService.signAsync(payload);

  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: this.configService.get('JWT_REFRESH_SECRET'),
    expiresIn: '7d',
  });

  await this.updateRefreshToken(user.id, refreshToken);
    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('دسترسی غیرمجاز - لطفاً دوباره وارد شوید');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException('توکن نامعتبر است');
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async getTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
  

  async updateRefreshToken(userId: string, refreshToken: string) {
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  await this.prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: hashedToken }, 
  });
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
