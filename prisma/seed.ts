import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, TemplateType } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create Calendar View Template
  const calendarTemplate = await prisma.template.upsert({
    where: { id: 'calendar-view-template' },
    update: {},
    create: {
      id: 'calendar-view-template',
      name: 'Calendar View',
      type: TemplateType.CALENDAR,
      config: {
        description: 'تقویم محور - برای مدیریت رویدادها و قرار ملاقات‌ها',
        views: ['day', 'week', 'month'],
        defaultView: 'week',
        timeSlotDuration: 30,
        workingHours: {
          start: '09:00',
          end: '18:00',
        },
        weekStartsOn: 6, // Saturday for Persian calendar
        showWeekNumbers: false,
        features: {
          recurringEvents: true,
          allDayEvents: true,
          reminders: true,
          colorCoding: true,
        },
      },
    },
  });

  // Create Kanban Board Template
  const kanbanTemplate = await prisma.template.upsert({
    where: { id: 'kanban-board-template' },
    update: {},
    create: {
      id: 'kanban-board-template',
      name: 'Kanban Board',
      type: TemplateType.BOARD,
      config: {
        description: 'ستون محور - برای مدیریت تسک‌ها به صورت Kanban',
        columns: [
          {
            id: 'PENDING',
            title: 'باید انجام بشه',
            titleEn: 'To Do',
            color: '#94A3B8',
            icon: '📋',
          },
          {
            id: 'COMPLETED',
            title: 'انجام شده',
            titleEn: 'Done',
            color: '#10B981',
            icon: '✅',
          },
          {
            id: 'FAILED',
            title: 'مسدود شده',
            titleEn: 'Blocked',
            color: '#EF4444',
            icon: '🚫',
          },
        ],
        features: {
          dragAndDrop: true,
          priorities: true,
          dueDate: true,
          labels: true,
          assignments: true,
          comments: true,
        },
      },
    },
  });

  console.log('✅ Templates created successfully');
  console.log(`  📅 ${calendarTemplate.name} (${calendarTemplate.type})`);
  console.log(`  📊 ${kanbanTemplate.name} (${kanbanTemplate.type})`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
