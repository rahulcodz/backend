import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminOrdersController } from './orders.controller';
import { AdminOrdersService } from './orders.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminModule {}
