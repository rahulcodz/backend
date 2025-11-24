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

const orderQueryArgs = Prisma.validator<Prisma.OrderDefaultArgs>()({
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
  },
});
type OrderWithItems = Prisma.OrderGetPayload<typeof orderQueryArgs>;

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

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId: userId,
          status: OrderStatus.Pending,
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
        ...orderQueryArgs,
      });

      await tx.cartItem.deleteMany({
        where: {
          id: { in: items.map((item) => item.id) },
        },
      });

      return createdOrder;
    });

    return this.toOrderResponse(order);
  }

  async listBuyerOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: orderQueryArgs.include,
    });
    return orders.map((order) => this.toOrderResponse(order));
  }

  async listSales(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        items: { some: { sellerId: userId } },
      },
      orderBy: { createdAt: 'desc' },
      include: orderQueryArgs.include,
    });
    return orders.map((order) => this.toOrderResponse(order));
  }

  async getOrder(userId: string, orderId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderQueryArgs.include,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isBuyer = order.buyerId === userId;
    const isSeller = order.items.some((item) => item.sellerId === userId);

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.toOrderResponse(order);
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

  private toOrderResponse(order: OrderWithItems): OrderResponseDto {
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

    return plainToInstance(OrderResponseDto, {
      id: order.id,
      buyerId: order.buyerId,
      status: order.status,
      totalAmount: order.totalAmount,
      buyerNote: order.buyerNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items,
    });
  }
}
