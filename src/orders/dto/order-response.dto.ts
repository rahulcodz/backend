import { OrderStatus } from '@prisma/client';

export type OrderViewerContext = 'buyer' | 'seller' | 'buyer_and_seller';

export class OrderProductSummaryDto {
  id!: string;
  name!: string;
  price!: number;
  images!: string[];
  creatorId!: string;
}

export class OrderItemResponseDto {
  id!: string;
  productId!: string;
  sellerId!: string;
  quantity!: number;
  unitPrice!: number;
  subtotal!: number;
  createdAt!: Date;
  updatedAt!: Date;
  product?: OrderProductSummaryDto;
}

export class OrderActivityAuthorDto {
  id!: string;
  name?: string | null;
  profileUrl?: string | null;
}

export class OrderActivityResponseDto {
  id!: string;
  orderId!: string;
  authorId!: string;
  message!: string;
  createdAt!: Date;
  author?: OrderActivityAuthorDto;
}

export class OrderResponseDto {
  id!: string;
  buyerId!: string;
  status!: OrderStatus;
  totalAmount!: number;
  buyerNote?: string;
  createdAt!: Date;
  updatedAt!: Date;
  items!: OrderItemResponseDto[];
  activities?: OrderActivityResponseDto[];
  viewerContext?: OrderViewerContext;
  allowedActions?: string[];
}
