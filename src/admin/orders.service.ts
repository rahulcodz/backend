import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, OrderStatus, Prisma } from '@prisma/client';
import { OrderItemResponseDto, OrderResponseDto } from '../orders/dto';
import { plainToInstance } from 'class-transformer';
import { NotificationsService } from '../notifications/notifications.service';

const adminOrderQueryArgs = {
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            creatorId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    },
    activities: {
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    },
  },
} as const;

type AdminOrderActivityRecord = {
  id: string;
  orderId: string;
  authorId: string;
  message: string;
  createdAt: Date;
  author?: {
    id: string;
    name: string | null;
    profileUrl: string | null;
  } | null;
};

type AdminOrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: typeof adminOrderQueryArgs.include.items;
  };
}> & {
  activities: AdminOrderActivityRecord[];
};

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listReceivedOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = ((await this.prisma.order.findMany({
      where: {
        status: OrderStatus.Received,
        items: { some: { sellerId: userId } },
      },
      orderBy: { createdAt: 'desc' },
      include: adminOrderQueryArgs.include as any,
    })) as unknown) as AdminOrderWithItems[];

    return orders.map((order) => this.toOrderResponse(order, userId));
  }

  async acceptOrder(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.ensureSellerAccess(orderId, userId);
    if (order.status !== OrderStatus.Received) {
      throw new BadRequestException('Only received orders can be accepted');
    }
    return this.persistStatus(orderId, OrderStatus.Accepted, userId);
  }

  async getOrder(orderId: string, userId: string): Promise<OrderResponseDto> {
    await this.ensureSellerAccess(orderId, userId);
    const order = (await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      ...(adminOrderQueryArgs as any),
    })) as AdminOrderWithItems;
    return this.toOrderResponse(order, userId);
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto> {
    await this.ensureSellerAccess(orderId, userId);
    return this.persistStatus(orderId, status, userId);
  }

  async addOrderActivity(
    orderId: string,
    userId: string,
    message: string,
  ): Promise<OrderResponseDto> {
    await this.ensureSellerAccess(orderId, userId);

    await (this.prisma as any).orderActivity.create({
      data: {
        orderId,
        authorId: userId,
        message,
      },
    });

    const refreshed = ((await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      ...(adminOrderQueryArgs as any),
    })) as unknown) as AdminOrderWithItems;

    await this.notifyOrderRemark(refreshed, userId, message);

    return this.toOrderResponse(refreshed, userId);
  }

  private async persistStatus(
    orderId: string,
    status: OrderStatus,
    viewerId?: string,
  ): Promise<OrderResponseDto> {
    const updated = ((await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: adminOrderQueryArgs.include as any,
    })) as unknown) as AdminOrderWithItems;

    await this.notifyStatusChange(updated, viewerId);

    return this.toOrderResponse(updated, viewerId);
  }

  private async ensureSellerAccess(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isSeller = order.items.some((item) => item.sellerId === userId);
    if (!isSeller) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  private toOrderResponse(order: AdminOrderWithItems, viewerId?: string): OrderResponseDto {
    const items: OrderItemResponseDto[] = order.items.map((item) =>
      plainToInstance(OrderItemResponseDto, {
        id: item.id,
        productId: item.productId,
        sellerId: item.sellerId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: item.product && {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images ?? [],
          creatorId: item.product.creatorId,
        },
      }),
    );

    const activities = order.activities.map((activity) => ({
      id: activity.id,
      orderId: activity.orderId,
      authorId: activity.authorId,
      message: activity.message,
      createdAt: activity.createdAt,
      author: activity.author && {
        id: activity.author.id,
        name: activity.author.name,
        profileUrl: activity.author.profileUrl,
      },
    }));

    const { viewerContext, allowedActions } = this.resolveSellerViewerContext(order, viewerId);

    return plainToInstance(OrderResponseDto, {
      id: order.id,
      buyerId: order.buyerId,
      status: order.status,
      totalAmount: order.totalAmount,
      buyerNote: order.buyerNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items,
      activities,
      viewerContext,
      allowedActions,
    });
  }

  private resolveSellerViewerContext(order: AdminOrderWithItems, viewerId?: string) {
    if (!viewerId) return { viewerContext: undefined, allowedActions: undefined };

    const isSeller = order.items.some((item) => item.sellerId === viewerId);
    if (!isSeller) return { viewerContext: undefined, allowedActions: undefined };

    const allowedActions: string[] = ['addRemark', 'updateStatus'];
    if (order.status === OrderStatus.Received) {
      allowedActions.splice(1, 0, 'accept');
    }

    return {
      viewerContext: 'seller',
      allowedActions,
    };
  }

  private extractSellerIds(order: { items: { sellerId: string }[] }): string[] {
    return Array.from(new Set(order.items.map((item) => item.sellerId)));
  }

  private async notifyStatusChange(
    order: AdminOrderWithItems,
    actorId?: string,
  ) {
    const recipients = new Set<string>();
    if (order.buyerId && order.buyerId !== actorId) {
      recipients.add(order.buyerId);
    }
    for (const sellerId of this.extractSellerIds(order)) {
      if (sellerId !== actorId) {
        recipients.add(sellerId);
      }
    }

    if (!recipients.size) {
      return;
    }

    await this.notifications.createNotifications(
      Array.from(recipients).map((userId) => ({
        userId,
        type: NotificationType.ORDER_STATUS,
        title: 'Order status updated',
        message: `Order ${order.id} is now ${order.status}.`,
        orderId: order.id,
        metadata: { status: order.status, actorId },
      })),
    );
  }

  private async notifyOrderRemark(
    order: AdminOrderWithItems,
    actorId: string,
    remark: string,
  ) {
    const recipients = new Set<string>();
    if (order.buyerId !== actorId) {
      recipients.add(order.buyerId);
    }
    for (const sellerId of this.extractSellerIds(order)) {
      if (sellerId !== actorId) {
        recipients.add(sellerId);
      }
    }

    if (!recipients.size) {
      return;
    }

    const truncatedRemark =
      remark.length > 180 ? `${remark.slice(0, 177)}...` : remark;

    await this.notifications.createNotifications(
      Array.from(recipients).map((userId) => ({
        userId,
        type: NotificationType.ORDER_ACTIVITY,
        title: 'New order remark',
        message: `Order ${order.id} has a new remark: "${truncatedRemark}"`,
        orderId: order.id,
        metadata: { actorId },
      })),
    );
  }
}

