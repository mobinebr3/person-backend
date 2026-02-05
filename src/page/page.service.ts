import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-calendar.dto';
import { UpdatePageDto } from './dto/update-calendar.dto';

@Injectable()
export class PageService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePageDto) {
    const template = await this.prisma.template.findFirst({
      where: { type: dto.templateType },
    });

    if (!template) {
      throw new NotFoundException(`Template of type ${dto.templateType} not found`);
    }

    return this.prisma.page.create({
      data: {
        title: dto.title,
        color: dto.color || this.getRandomColor(),
        pageId: nanoid(8),
        ownerId: userId,
        templateId: template.id,
      },
      include: {
        template: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.page.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            shares: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        template: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            events: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { pageId },
      include: {
        template: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            events: true,
            tasks: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check if user has access
    const hasAccess =
      page.ownerId === userId ||
      page.shares.some((share) => share.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this page');
    }

    return page;
  }

  async update(id: string, userId: string, dto: UpdatePageDto) {
    // Check ownership
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (page.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can update this page');
    }

    return this.prisma.page.update({
      where: { id },
      data: dto,
      include: {
        template: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Check ownership
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (page.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete this page');
    }

    await this.prisma.page.delete({
      where: { id },
    });

    return { message: 'Page deleted successfully' };
  }

  async getPagesByTemplate(userId: string, templateType: string) {
    return this.prisma.page.findMany({
      where: {
        ownerId: userId,
        template: {
          type: templateType as any,
        },
      },
      include: {
        template: true,
        _count: {
          select: {
            events: true,
            tasks: true,
          },
        },
      },
    });
  }

  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
