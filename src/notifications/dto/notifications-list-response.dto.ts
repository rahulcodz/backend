import { NotificationResponseDto } from './notification-response.dto';

export class NotificationsListResponseDto {
  data!: NotificationResponseDto[];
  meta!: {
    total: number;
    page: number;
    limit: number;
    unreadCount: number;
  };
}
