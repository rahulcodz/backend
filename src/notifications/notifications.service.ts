import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsListResponseDto } from './dto/notifications-list-response.dto';
import { plainToInstance } from 'class-transformer';

export type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(
    userId: string,
    query: ListNotificationsDto,
  ): Promise<NotificationsListResponseDto> {
    const { page = 1, limit = 20, isRead, type } = query;
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return plainToInstance(NotificationsListResponseDto, {
      data: items.map((item) =>
        plainToInstance(NotificationResponseDto, item, {
          excludeExtraneousValues: false,
        }),
      ),
      meta: {
        total,
        page,
        limit,
        unreadCount,
      },
    });
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.isRead) {
      return plainToInstance(NotificationResponseDto, existing);
    }

    const updated = await this.prisma.notification.update({
      where: { id: existing.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return plainToInstance(NotificationResponseDto, updated);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async createNotifications(
    input: CreateNotificationInput | CreateNotificationInput[],
  ): Promise<void> {
    const payloads = Array.isArray(input) ? input : [input];
    if (!payloads.length) {
      return;
    }

    const dataPayloads = payloads.map((item) => {
      const base: any = {
        userId: item.userId,
        title: item.title,
        message: item.message,
        type: item.type,
        orderId: item.orderId,
      };

      // Only include metadata when it's not null/undefined.
      // If provided, cast to Prisma.InputJsonValue for correct typing.
      if (item.metadata !== undefined && item.metadata !== null) {
        base.metadata = item.metadata as Prisma.InputJsonValue;
      }

      return base;
    });

    await this.prisma.notification.createMany({
      data: dataPayloads,
    });

    this.logger.debug(`Created ${payloads.length} notifications`);
  }
}
