import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Status as ProductStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddCartItemDto,
  CartItemResponseDto,
  CartResponseDto,
  CheckoutDto,
  OrderItemResponseDto,
  OrderResponseDto,
  UpdateCartItemDto,
} from './dto';
import { OrdersListResponseDto } from './dto/orders-list-response.dto';

const cartQueryArgs = Prisma.validator<Prisma.CartDefaultArgs>()({
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
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    },
  },
});
type CartWithItems = Prisma.CartGetPayload<typeof cartQueryArgs>;

type ViewerContext = 'buyer' | 'seller' | 'buyer_and_seller';

const orderQueryArgs = {
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

type OrderActivityRecord = {
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

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: typeof orderQueryArgs.include.items;
  };
}> & {
  activities: OrderActivityRecord[];
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.ensureCart(userId);
    const hydrated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      ...cartQueryArgs,
    });
    return this.toCartResponse(hydrated);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: {
        id: true,
        creatorId: true,
        price: true,
        status: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.creatorId === userId) {
      throw new BadRequestException('You cannot purchase your own product');
    }

    if (product.status !== ProductStatus.Active) {
      throw new BadRequestException('Product is not available for purchase');
    }

    const quantity = dto.quantity ?? 1;
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const cart = await this.ensureCart(userId);

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
      update: {
        quantity: { increment: quantity },
        unitPrice: product.price,
        sellerId: product.creatorId,
      },
      create: {
        cartId: cart.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        sellerId: product.creatorId,
      },
    });

    return this.getCart(userId);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: cartItem.id } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: dto.quantity },
      });
    }

    return this.getCart(userId);
  }

  async removeCartItem(
    userId: string,
    itemId: string,
  ): Promise<CartResponseDto> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: cartItem.id } });
    return this.getCart(userId);
  }

  async checkout(userId: string, dto: CheckoutDto): Promise<OrderResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: cartQueryArgs.include,
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let items = cart.items;
    if (dto.cartItemIds?.length) {
      const ids = new Set(dto.cartItemIds);
      items = cart.items.filter((item) => ids.has(item.id));
      if (items.length !== dto.cartItemIds.length) {
        throw new BadRequestException('Some cart items were not found');
      }
    }

    if (items.length === 0) {
      throw new BadRequestException('No cart items selected for checkout');
    }

    const order = (await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId: userId,
          status: OrderStatus.Received,
          totalAmount: items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0,
          ),
          buyerNote: dto.buyerNote,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              sellerId: item.sellerId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
        ...(orderQueryArgs as any),
      });

      await tx.cartItem.deleteMany({
        where: {
          id: { in: items.map((item) => item.id) },
        },
      });

      return createdOrder;
    })) as OrderWithItems;

    return this.toOrderResponse(order, userId);
  }

  async listBuyerOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = ((await this.prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: orderQueryArgs.include as any,
    })) as unknown) as OrderWithItems[];
    return orders.map((order) => this.toOrderResponse(order, userId));
  }

  async listSales(userId: string): Promise<OrderResponseDto[]> {
    const orders = ((await this.prisma.order.findMany({
      where: {
        items: { some: { sellerId: userId } },
      },
      orderBy: { createdAt: 'desc' },
      include: orderQueryArgs.include as any,
    })) as unknown) as OrderWithItems[];
    return orders.map((order) => this.toOrderResponse(order, userId));
  }

  async listOrdersByRole(userId: string): Promise<OrdersListResponseDto> {
    const [buyerOrdersRaw, sellerOrdersRaw] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        include: orderQueryArgs.include as any,
      }),
      this.prisma.order.findMany({
        where: { items: { some: { sellerId: userId } } },
        orderBy: { createdAt: 'desc' },
        include: orderQueryArgs.include as any,
      }),
    ]);

    const buyerOrders = ((buyerOrdersRaw as unknown) as OrderWithItems[]).map((order) =>
      this.toOrderResponse(order, userId),
    );
    const sellerOrders = ((sellerOrdersRaw as unknown) as OrderWithItems[]).map((order) =>
      this.toOrderResponse(order, userId),
    );

    return plainToInstance(OrdersListResponseDto, {
      buyerOrders,
      sellerOrders,
    });
  }

  async getOrder(userId: string, orderId: string): Promise<OrderResponseDto> {
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderQueryArgs.include as any,
    })) as OrderWithItems | null;

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isBuyer = order.buyerId === userId;
    const isSeller = order.items.some((item) => item.sellerId === userId);

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.toOrderResponse(order, userId);
  }

  async addOrderActivity(
    userId: string,
    orderId: string,
    message: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            sellerId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isBuyer = order.buyerId === userId;
    const isSeller = order.items.some((item) => item.sellerId === userId);

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You do not have access to this order');
    }

    await (this.prisma as any).orderActivity.create({
      data: {
        orderId,
        authorId: userId,
        message,
      },
    });

    const refreshed = (await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      ...(orderQueryArgs as any),
    })) as OrderWithItems;

    return this.toOrderResponse(refreshed, userId);
  }

  private async ensureCart(userId: string) {
    try {
      return await this.prisma.cart.findUniqueOrThrow({ where: { userId } });
    } catch {
      this.logger.log(`Creating cart for user ${userId}`);
      return this.prisma.cart.create({
        data: {
          userId,
        },
      });
    }
  }

  private toCartResponse(cart: CartWithItems): CartResponseDto {
    const items: CartItemResponseDto[] = cart.items.map((item) =>
      plainToInstance(CartItemResponseDto, {
        id: item.id,
        productId: item.productId,
        sellerId: item.sellerId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
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

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return plainToInstance(CartResponseDto, {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      totalItems,
      totalAmount,
      items,
    });
  }

  private toOrderResponse(order: OrderWithItems, viewerId?: string): OrderResponseDto {
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

    const { viewerContext, allowedActions } = this.resolveViewerContext(order, viewerId);

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

  private resolveViewerContext(order: OrderWithItems, viewerId?: string): {
    viewerContext?: ViewerContext;
    allowedActions?: string[];
  } {
    if (!viewerId) return { viewerContext: undefined, allowedActions: undefined };

    const isBuyer = order.buyerId === viewerId;
    const isSeller = order.items.some((item) => item.sellerId === viewerId);

    let viewerContext: ViewerContext | undefined;
    if (isBuyer && isSeller) viewerContext = 'buyer_and_seller';
    else if (isBuyer) viewerContext = 'buyer';
    else if (isSeller) viewerContext = 'seller';

    const allowedActions: string[] = [];
    if (viewerContext) {
      allowedActions.push('addRemark');
    }
    if (isSeller) {
      if (order.status === OrderStatus.Received) {
        allowedActions.push('accept');
      }
      allowedActions.push('updateStatus');
    }

    return {
      viewerContext,
      allowedActions: allowedActions.length ? allowedActions : undefined,
    };
  }
}
