import type { ProductCategory } from '@prisma/client';

export class ProductResponseDto {
  id!: string;
  name!: string;
  description?: string;
  category!: ProductCategory;
  price!: number;
  images?: string[]; // stored paths/urls
  variations?: any; // Json stored variations
  creatorId!: string;
  createdAt?: Date;
  updatedAt?: Date;
}