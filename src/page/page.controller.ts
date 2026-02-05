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
import { CreatePageDto } from './dto/create-calendar.dto';
import { UpdatePageDto } from './dto/update-calendar.dto';
import { PageService } from './page.service';

@Controller('pages')
@UseGuards(JwtAuthGuard)
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  create(@Request() req, @Body() createPageDto: CreatePageDto) {
    return this.pageService.create(req.user.userId, createPageDto);
  }

  @Get()
  findAll(@Request() req, @Query('templateType') templateType?: string) {
    if (templateType) {
      return this.pageService.getPagesByTemplate(req.user.userId, templateType);
    }
    return this.pageService.findAll(req.user.userId);
  }

  @Get(':pageId')
  findOne(@Param('pageId') pageId: string, @Request() req) {
    return this.pageService.findOne(pageId, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updatePageDto: UpdatePageDto,
  ) {
    return this.pageService.update(id, req.user.userId, updatePageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.pageService.remove(id, req.user.userId);
  }
}
