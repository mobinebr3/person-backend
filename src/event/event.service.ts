import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateRecurrenceDto } from './dto/create-recurrence.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEventDto: CreateEventDto, recurrence?: CreateRecurrenceDto) {
    // Check if user has access to the page
    const page = await this.prisma.page.findFirst({
      where: {
        id: createEventDto.pageId,
        OR: [
          { ownerId: userId },
          {
            shares: {
              some: {
                userId,
                permission: { in: ['VIEW', 'EDIT', 'ADMIN'] },
              },
            },
          },
        ],
      },
    });

    if (!page) {
      throw new ForbiddenException('You do not have access to this page');
    }

    const event = await this.prisma.event.create({
      data: {
        pageId: createEventDto.pageId,
        title: createEventDto.title,
        description: createEventDto.description,
        ownerId: userId,
        startTimeUtc: new Date(createEventDto.startTimeUtc),
        endTimeUtc: new Date(createEventDto.endTimeUtc),
        isAllDay: createEventDto.isAllDay ?? false,
        isRecurring: !!recurrence,
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

    // Create recurrence if provided
    if (recurrence) {
      await this.prisma.eventRecurrence.create({
        data: {
          eventId: event.id,
          ...recurrence,
          until: recurrence.until ? new Date(recurrence.until) : null,
        },
      });

      // Generate initial instances
      await this.generateEventInstances(event.id);
    }

    return this.findOne(event.id, userId);
  }

  async findAll(userId: string, pageId?: string, startDate?: string, endDate?: string) {
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

    if (startDate && endDate) {
      where.AND = [
        { startTimeUtc: { lte: new Date(endDate) } },
        { endTimeUtc: { gte: new Date(startDate) } },
      ];
    }

    return this.prisma.event.findMany({
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
        recurrence: true,
        reminders: true,
      },
      orderBy: {
        startTimeUtc: 'asc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
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
        recurrence: true,
        reminders: true,
        instances: {
          orderBy: {
            startTimeUtc: 'asc',
          },
          take: 100, // Limit instances returned
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user has access
    const hasAccess =
      event.page.ownerId === userId ||
      event.page.shares.some((share) => share.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return event;
  }

  async update(id: string, userId: string, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        page: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user has permission
    const hasPermission =
      event.page.ownerId === userId || event.ownerId === userId;

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to update this event');
    }

    const updateData: any = { ...updateEventDto };
    if (updateEventDto.startTimeUtc) {
      updateData.startTimeUtc = new Date(updateEventDto.startTimeUtc);
    }
    if (updateEventDto.endTimeUtc) {
      updateData.endTimeUtc = new Date(updateEventDto.endTimeUtc);
    }

    return this.prisma.event.update({
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
        recurrence: true,
        reminders: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        page: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user has permission
    const hasPermission =
      event.page.ownerId === userId || event.ownerId === userId;

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to delete this event');
    }

    return this.prisma.event.delete({
      where: { id },
    });
  }

  private async generateEventInstances(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        recurrence: true,
      },
    });

    if (!event || !event.recurrence) {
      return;
    }

    // Generate instances for the next 3 months
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    const instances = [];
    let currentDate = new Date(event.startTimeUtc);
    const eventDuration = event.endTimeUtc.getTime() - event.startTimeUtc.getTime();

    let count = 0;
    const maxCount = event.recurrence.count || 100;

    while (currentDate <= endDate && count < maxCount) {
      if (event.recurrence.until && currentDate > event.recurrence.until) {
        break;
      }

      instances.push({
        eventId: event.id,
        startTimeUtc: new Date(currentDate),
        endTimeUtc: new Date(currentDate.getTime() + eventDuration),
        isCancelled: false,
      });

      // Calculate next occurrence
      currentDate = this.getNextOccurrence(currentDate, event.recurrence);
      count++;
    }

    // Batch create instances
    if (instances.length > 0) {
      await this.prisma.eventInstance.createMany({
        data: instances,
        skipDuplicates: true,
      });
    }
  }

  private getNextOccurrence(currentDate: Date, recurrence: any): Date {
    const next = new Date(currentDate);

    switch (recurrence.freq) {
      case 'DAILY':
        next.setDate(next.getDate() + (recurrence.interval || 1));
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7 * (recurrence.interval || 1));
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + (recurrence.interval || 1));
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + (recurrence.interval || 1));
        break;
    }

    return next;
  }
}
