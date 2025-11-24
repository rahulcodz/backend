export class CartProductSummaryDto {
  id!: string;
  name!: string;
  price!: number;
  images!: string[];
  creatorId!: string;
}

export class CartItemResponseDto {
  id!: string;
  productId!: string;
  sellerId!: string;
  quantity!: number;
  unitPrice!: number;
  lineTotal!: number;
  createdAt!: Date;
  updatedAt!: Date;
  product?: CartProductSummaryDto;
}

export class CartResponseDto {
  id!: string;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
  totalItems!: number;
  totalAmount!: number;
  items!: CartItemResponseDto[];
}
