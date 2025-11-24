import type { ProductCategory } from '@prisma/client';

export class ProductResponseDto {
  id!: string;
  name!: string;
  description?: string;
  categories!: ProductCategory[]; // multiple categories
  price!: number;
  images?: string[];
  creatorId!: string;
  createdAt?: Date;
  updatedAt?: Date;
}
