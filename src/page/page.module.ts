import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PageController } from './page.controller';
import { PageService } from './page.service';

@Module({
  imports: [PrismaModule],
  controllers: [PageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
