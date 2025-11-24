import type { ProductCategory, ProductUnit } from '@prisma/client';

export class ProductResponseDto {
  id!: string;
  name!: string;
  description?: string;
  categories!: ProductCategory[]; // multiple categories
  price!: number;
  quantity!: number;
  unit!: ProductUnit;
  images?: string[];
  creatorId!: string;
  createdAt?: Date;
  updatedAt?: Date;
}
