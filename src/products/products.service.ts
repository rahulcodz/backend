import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { plainToInstance } from 'class-transformer';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateProductDto, imagePaths: string[], creatorId: string) {
    const product = await this.prisma.product.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        category: createDto.category,
        price: createDto.price,
        images: imagePaths,
        // cast to Prisma.InputJsonValue
        variations: (createDto.variations ?? []) as unknown as Prisma.InputJsonValue,
        creator: { connect: { id: creatorId } },
      },
    });
    return plainToInstance(ProductResponseDto, product);
  }

  async findAll() {
    const products = await this.prisma.product.findMany();
    return products.map((p) => plainToInstance(ProductResponseDto, p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return plainToInstance(ProductResponseDto, product);
  }

  async update(id: string, updateDto: UpdateProductDto, newImagePaths?: string[]) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    const data: any = {
      ...updateDto,
    };

    if (newImagePaths && newImagePaths.length) {
      data.images = [...(existing.images ?? []), ...newImagePaths];
    }

    // ensure variations is a valid JSON value for Prisma
    if ((updateDto as any).variations !== undefined) {
      data.variations = (updateDto as any).variations as unknown as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    return plainToInstance(ProductResponseDto, updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}