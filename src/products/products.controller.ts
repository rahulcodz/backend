import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
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
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @ApiOperation({
    summary:
      'Create a new product (JSON body). Images optional (array of URLs/paths).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        categories: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(require('@prisma/client').ProductCategory),
          },
          description: 'Array of ProductCategory enum values',
        },
        price: { type: 'number' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            description: 'Optional image URLs or paths',
          },
        },
      },
      required: ['name', 'categories', 'price'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() createDto: CreateProductDto,
  ) {
    // images are optional and provided in body
    return this.productsService.create(createDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: [ProductResponseDto],
  })
  async findAll(@CurrentUser() user: authTypes.AuthUser) {
    return this.productsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: 'Get products by creator id' })
  @ApiResponse({
    status: 200,
    description: 'List of products by creator',
    type: [ProductResponseDto],
  })
  async findByCreator(@Param('creatorId') creatorId: string) {
    return this.productsService.findByCreator(creatorId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product (JSON body). Images optional.' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated',
    type: ProductResponseDto,
  })
  async update(@Param('id') id: string, @Body() updateDto: UpdateProductDto, @CurrentUser() user: authTypes.AuthUser) {
    return this.productsService.update(id, updateDto, user.userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: authTypes.AuthUser) {
    await this.productsService.remove(id, user.userId);
  }
}
