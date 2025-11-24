import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { plainToInstance } from 'class-transformer';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateProductDto, creatorId: string) {
    const product = await this.prisma.product.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        categories: createDto.categories, // array
        price: createDto.price,
        images: createDto.images ?? [],
        creator: { connect: { id: creatorId } },
      },
    });
    return plainToInstance(ProductResponseDto, product);
  }

  async findAll(current_userId: string) {
    const products = await this.prisma.product.findMany({ where: { creatorId: current_userId } });
    return products.map((p) => plainToInstance(ProductResponseDto, p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profileUrl: true,
            location: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return plainToInstance(ProductResponseDto, product);
  }

  async update(id: string, updateDto: UpdateProductDto, current_userId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id: id, creatorId: current_userId } });
    if (!existing) throw new NotFoundException('Product not found');

    const data: any = {
      ...updateDto,
    };

    // If images provided in body, replace (or merge per your requirement)
    if (updateDto.images !== undefined) {
      data.images = updateDto.images;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    return plainToInstance(ProductResponseDto, updated);
  }

  async remove(id: string, current_userId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id: id, creatorId: current_userId } });
    if (!existing) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async findByCreator(creatorId: string) {
    const products = await this.prisma.product.findMany({
      where: { creatorId },
    });
    return products.map((p) => plainToInstance(ProductResponseDto, p));
  }
}
