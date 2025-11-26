import type { ProductCategory, Status } from '@prisma/client';

export class SellerProductPreviewDto {
  id!: string;
  name!: string;
  price!: number;
  categories!: ProductCategory[];
  status!: Status;
  imageUrl?: string | null;
}
