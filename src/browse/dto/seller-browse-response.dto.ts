import { SellerProductPreviewDto } from './seller-product-preview.dto';

export class SellerBrowseResponseDto {
  sellerId!: string;
  sellerName?: string | null;
  businessName?: string | null;
  profileUrl?: string | null;
  location?: string | null;
  pincode?: string | null;
  topProducts!: SellerProductPreviewDto[];
  productCount!: number;
}
