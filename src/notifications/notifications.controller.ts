import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as authTypes from '../types/auth.types';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsListResponseDto } from './dto/notifications-list-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  async list(
    @CurrentUser() user: authTypes.AuthUser,
    @Query() dto: ListNotificationsDto,
  ): Promise<NotificationsListResponseDto> {
    return this.notificationsService.listNotifications(user.userId, dto);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('notificationId') notificationId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(user.userId, notificationId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @CurrentUser() user: authTypes.AuthUser,
  ): Promise<{ updated: number }> {
    const updated = await this.notificationsService.markAllAsRead(user.userId);
    return { updated };
  }
}

