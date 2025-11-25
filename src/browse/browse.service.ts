import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BrowseFiltersDto } from './dto/browse-filters.dto';
import { SellerBrowseResponseDto } from './dto/seller-browse-response.dto';
import { SellerProductPreviewDto } from './dto/seller-product-preview.dto';

@Injectable()
export class BrowseService {
  private readonly logger = new Logger(BrowseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSellers(
    filters: BrowseFiltersDto,
  ): Promise<SellerBrowseResponseDto[]> {
    const { search, page = 1, limit = 12 } = filters;

    if (limit <= 0) {
      throw new BadRequestException('limit must be greater than zero');
    }

    const normalizedSearch = search?.trim();

    const productWhere: Prisma.ProductWhereInput = {
      status: Status.Active,
    };

    const sellerWhere: Prisma.UserWhereInput = {
      products: {
        some: productWhere,
      },
    };

    const searchClauses: Prisma.UserWhereInput[] = [];

    if (normalizedSearch) {
      searchClauses.push(
        {
          name: {
            contains: normalizedSearch,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          bio: {
            contains: normalizedSearch,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          location: {
            contains: normalizedSearch,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      );
    }

    if (searchClauses.length) {
      sellerWhere.OR = searchClauses;
    }

    const skip = (page - 1) * limit;

    this.logger.log(
      `Fetching browse sellers with filters ${JSON.stringify(filters)}`,
    );

    const sellers = await this.prisma.user.findMany({
      where: sellerWhere,
      orderBy: [
        {
          products: {
            _count: 'desc',
          },
        },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
      include: {
        products: {
          where: productWhere,
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            name: true,
            price: true,
            categories: true,
            status: true,
            images: true,
          },
        },
        addresses: {
          where: { isDefault: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return sellers.map((seller) => {
      const productPreviews: SellerProductPreviewDto[] = seller.products.map(
        (product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          categories: product.categories,
          status: product.status,
          imageUrl: product.images?.[0] ?? null,
        }),
      );

      const primaryAddress = seller.addresses[0];

      return {
        sellerId: seller.id,
        sellerName: seller.name,
        businessName: seller.bio ?? seller.name,
        profileUrl: seller.profileUrl,
        location: seller.location ?? primaryAddress?.city ?? null,
        pincode: primaryAddress?.pincode ?? null,
        topProducts: productPreviews,
        productCount: seller._count.products,
      };
    });
  }
}

