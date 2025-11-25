import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  id!: string;
  userId!: string;
  orderId?: string | null;
  type!: NotificationType;
  title!: string;
  message!: string;
  metadata?: Record<string, unknown> | null;
  isRead!: boolean;
  readAt?: Date | null;
  createdAt!: Date;
}

