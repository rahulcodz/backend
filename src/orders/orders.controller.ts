import {
  Body,
  Controller,
  Delete,
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
import { OrdersService } from './orders.service';
import {
  AddCartItemDto,
  CartResponseDto,
  CheckoutDto,
  OrderResponseDto,
  UpdateCartItemDto,
} from './dto';
import { OrdersListResponseDto } from './dto/orders-list-response.dto';
import { AddOrderActivityDto } from './dto/add-order-activity.dto';
import * as authTypes from '../types/auth.types';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('cart')
  @ApiOperation({ summary: 'Get the authenticated user cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved',
    type: CartResponseDto,
  })
  async getCart(@CurrentUser() user: authTypes.AuthUser): Promise<CartResponseDto> {
    return this.ordersService.getCart(user.userId);
  }

  @Post('cart/items')
  @ApiOperation({ summary: 'Add a product to the cart' })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({
    status: 200,
    description: 'Updated cart',
    type: CartResponseDto,
  })
  async addCartItem(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.ordersService.addItem(user.userId, dto);
  }

  @Patch('cart/items/:itemId')
  @ApiOperation({
    summary: 'Update quantity for a cart item (quantity <= 0 removes the item)',
  })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: 200,
    description: 'Updated cart',
    type: CartResponseDto,
  })
  async updateCartItem(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.ordersService.updateCartItem(user.userId, itemId, dto);
  }

  @Delete('cart/items/:itemId')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiResponse({
    status: 200,
    description: 'Updated cart',
    type: CartResponseDto,
  })
  async removeCartItem(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    return this.ordersService.removeCartItem(user.userId, itemId);
  }

  @Post()
  @ApiOperation({ summary: 'Checkout and create an order from cart items' })
  @ApiBody({ type: CheckoutDto })
  @ApiResponse({
    status: 201,
    description: 'Order created',
    type: OrderResponseDto,
  })
  async checkout(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() dto: CheckoutDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.checkout(user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List orders placed by the current user (buyer view)',
  })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async listBuyerOrders(
    @CurrentUser() user: authTypes.AuthUser,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.listBuyerOrders(user.userId);
  }

  @Get('overview')
  @ApiOperation({
    summary: 'List both buyer and seller order views in one payload',
  })
  @ApiResponse({ status: 200, type: OrdersListResponseDto })
  async listOrdersByRole(
    @CurrentUser() user: authTypes.AuthUser,
  ): Promise<OrdersListResponseDto> {
    return this.ordersService.listOrdersByRole(user.userId);
  }

  @Get('sales')
  @ApiOperation({
    summary: 'List orders that include products sold by the user',
  })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async listSales(@CurrentUser() user: authTypes.AuthUser): Promise<OrderResponseDto[]> {
    return this.ordersService.listSales(user.userId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details (buyer or selling seller)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOrder(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.getOrder(user.userId, orderId);
  }

  @Post(':orderId/activity')
  @ApiOperation({ summary: 'Add a remark to the order timeline (buyer/seller)' })
  @ApiBody({ type: AddOrderActivityDto })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async addOrderActivity(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('orderId') orderId: string,
    @Body() dto: AddOrderActivityDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.addOrderActivity(user.userId, orderId, dto.message);
  }
}
