import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { productMulterOptions } from './multer.options';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as authTypes from '../types/auth.types';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product with multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', description: 'One of the ProductCategory enum values' },
        price: { type: 'number' },
        variations: {
          type: 'string',
          description: 'JSON stringified array of variations: [{ size, color, quantity, price }, ...]',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['name', 'category', 'price'],
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, productMulterOptions))
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() createDto: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    if ((createDto as any).variations && typeof (createDto as any).variations === 'string') {
      try {
        (createDto as any).variations = JSON.parse((createDto as any).variations);
      } catch {
        (createDto as any).variations = [];
      }
    }

    const imagePaths = (images || []).map((f) => f.path.replace(/\\/g, '/'));
    return this.productsService.create(createDto, imagePaths, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'List of products', type: [ProductResponseDto] })
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product (optionally upload new images)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        price: { type: 'number' },
        variations: {
          type: 'string',
          description: 'JSON stringified array of variations',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, productMulterOptions))
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    if ((updateDto as any).variations && typeof (updateDto as any).variations === 'string') {
      try {
        (updateDto as any).variations = JSON.parse((updateDto as any).variations);
      } catch {
        (updateDto as any).variations = [];
      }
    }

    const imagePaths = (images || []).map((f) => f.path.replace(/\\/g, '/'));
    return this.productsService.update(id, updateDto, imagePaths);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
  }
}