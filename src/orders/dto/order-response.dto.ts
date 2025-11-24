import { OrderStatus } from '@prisma/client';

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

export class OrderResponseDto {
  id!: string;
  buyerId!: string;
  status!: OrderStatus;
  totalAmount!: number;
  buyerNote?: string;
  createdAt!: Date;
  updatedAt!: Date;
  items!: OrderItemResponseDto[];
}
