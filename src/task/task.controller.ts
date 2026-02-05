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
import { JobStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(req.user.userId, createTaskDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('pageId') pageId?: string,
    @Query('status') status?: JobStatus,
    @Query('priority') priority?: string,
  ) {
    return this.taskService.findAll(req.user.userId, pageId, status, priority);
  }

  @Get('kanban/:pageId')
  getKanbanBoard(@Param('pageId') pageId: string, @Request() req) {
    return this.taskService.getKanbanBoard(req.user.userId, pageId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.taskService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, req.user.userId, updateTaskDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() updateStatusDto: UpdateTaskStatusDto,
  ) {
    return this.taskService.updateStatus(id, req.user.userId, updateStatusDto);
  }

  @Patch(':id/reorder')
  reorder(
    @Param('id') id: string,
    @Request() req,
    @Body() reorderDto: ReorderTaskDto,
    @Query('status') status?: JobStatus,
  ) {
    return this.taskService.reorder(id, req.user.userId, reorderDto.newOrder, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.taskService.remove(id, req.user.userId);
  }
}
