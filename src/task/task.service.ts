import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    // Check if user has access to the page
    const page = await this.prisma.page.findFirst({
      where: {
        id: createTaskDto.pageId,
        OR: [
          { ownerId: userId },
          {
            shares: {
              some: {
                userId,
                permission: { in: ['EDIT', 'ADMIN'] },
              },
            },
          },
        ],
      },
    });

    if (!page) {
      throw new ForbiddenException('You do not have access to this page');
    }

    // Get the highest order for this status to append at the end
    const highestOrderTask = await this.prisma.task.findFirst({
      where: {
        pageId: createTaskDto.pageId,
        status: createTaskDto.status,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const order = createTaskDto.order ?? (highestOrderTask?.order ?? -1) + 1;

    return this.prisma.task.create({
      data: {
        pageId: createTaskDto.pageId,
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status,
        ownerId: userId,
        order,
        priority: createTaskDto.priority,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      },
      include: {
        page: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
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
        labels: {
          include: {
            label: true,
          },
        },
      },
    });
  }

  async findAll(
    userId: string,
    pageId?: string,
    status?: JobStatus,
    priority?: string,
  ) {
    const where: any = {
      page: {
        OR: [
          { ownerId: userId },
          {
            shares: {
              some: { userId },
            },
          },
        ],
      },
    };

    if (pageId) {
      where.pageId = pageId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        page: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
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
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        {
          status: 'asc',
        },
        {
          order: 'asc',
        },
      ],
    });
  }

  async getKanbanBoard(userId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        id: pageId,
        OR: [
          { ownerId: userId },
          {
            shares: {
              some: { userId },
            },
          },
        ],
      },
    });

    if (!page) {
      throw new ForbiddenException('You do not have access to this page');
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        pageId: pageId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
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
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Group tasks by status for Kanban board
    const board = {
      PENDING: tasks.filter((t) => t.status === 'PENDING'),
      COMPLETED: tasks.filter((t) => t.status === 'COMPLETED'),
      FAILED: tasks.filter((t) => t.status === 'FAILED'),
    };

    return {
      page,
      board,
    };
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        page: {
          include: {
            shares: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
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
        labels: {
          include: {
            label: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access
    const hasAccess =
      task.page.ownerId === userId ||
      task.page.shares.some((share) => share.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        page: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission
    const hasPermission =
      task.page.ownerId === userId || task.ownerId === userId;

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        page: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
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
        labels: {
          include: {
            label: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, userId: string, updateStatusDto: UpdateTaskStatusDto) {
    const task = await this.findOne(id, userId);

    // Get the highest order in the new status column
    const highestOrderTask = await this.prisma.task.findFirst({
      where: {
        pageId: task.pageId,
        status: updateStatusDto.status,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const newOrder = (highestOrderTask?.order ?? -1) + 1;

    return this.prisma.task.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
        order: newOrder,
      },
      include: {
        page: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
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
        labels: {
          include: {
            label: true,
          },
        },
      },
    });
  }

  async reorder(id: string, userId: string, newOrder: number, newStatus?: JobStatus) {
    const task = await this.findOne(id, userId);

    const targetStatus = newStatus ?? task.status;

    // Update the order of other tasks in the same column
    if (newOrder < task.order) {
      // Moving up: shift tasks down
      await this.prisma.task.updateMany({
        where: {
          pageId: task.pageId,
          status: targetStatus,
          order: {
            gte: newOrder,
            lt: task.order,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    } else if (newOrder > task.order) {
      // Moving down: shift tasks up
      await this.prisma.task.updateMany({
        where: {
          pageId: task.pageId,
          status: targetStatus,
          order: {
            gt: task.order,
            lte: newOrder,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        order: newOrder,
        status: targetStatus,
      },
      include: {
        page: true,
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
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        page: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission
    const hasPermission =
      task.page.ownerId === userId || task.ownerId === userId;

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    // Shift tasks up to fill the gap
    await this.prisma.task.updateMany({
      where: {
        pageId: task.pageId,
        status: task.status,
        order: {
          gt: task.order,
        },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });

    return this.prisma.task.delete({
      where: { id },
    });
  }
}
