import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
