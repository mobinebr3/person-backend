import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateRecurrenceDto } from './dto/create-recurrence.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventService } from './event.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  create(
    @Request() req,
    @Body() body: { event: CreateEventDto; recurrence?: CreateRecurrenceDto },
  ) {
    return this.eventService.create(req.user.userId, body.event, body.recurrence);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('pageId') pageId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventService.findAll(req.user.userId, pageId, startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.eventService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.update(id, req.user.userId, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.eventService.remove(id, req.user.userId);
  }
}
