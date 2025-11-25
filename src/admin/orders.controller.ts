import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as authTypes from '../types/auth.types';
import { AdminOrdersService } from './orders.service';
import { OrderResponseDto } from '../orders/dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AddOrderActivityDto } from '../orders/dto/add-order-activity.dto';

@ApiTags('Admin Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List received orders for the logged-in seller/admin',
  })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  listReceivedOrders(
    @CurrentUser() user: authTypes.AuthUser,
  ): Promise<OrderResponseDto[]> {
    return this.adminOrdersService.listReceivedOrders(user.userId);
  }

  @Patch(':orderId/accept')
  @ApiOperation({ summary: 'Accept a received order' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  acceptOrder(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.adminOrdersService.acceptOrder(orderId, user.userId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details for sellers/admin' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  getOrder(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.adminOrdersService.getOrder(orderId, user.userId);
  }

  @Patch(':orderId/status')
  @ApiOperation({ summary: 'Update the status of an order' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  updateOrderStatus(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.adminOrdersService.updateOrderStatus(
      orderId,
      user.userId,
      dto.status,
    );
  }

  @Post(':orderId/activity')
  @ApiOperation({ summary: 'Add a remark to the order timeline' })
  @ApiBody({ type: AddOrderActivityDto })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  addOrderActivity(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('orderId') orderId: string,
    @Body() dto: AddOrderActivityDto,
  ): Promise<OrderResponseDto> {
    return this.adminOrdersService.addOrderActivity(
      orderId,
      user.userId,
      dto.message,
    );
  }
}
