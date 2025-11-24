import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ProductCategory, ProductUnit, Status } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Sample Product',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'This is a sample product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ProductCategory, { each: true })
  categories!: ProductCategory[];

  @IsNumber()
  price!: number;

  @ApiProperty({
    description: 'Available quantity for the product',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: 'Unit representing what the quantity stands for',
    enum: ProductUnit,
    example: ProductUnit.KILOGRAM,
  })
  @IsEnum(ProductUnit)
  unit!: ProductUnit;

  @IsOptional()
  @IsArray()
  images?: string[]; // optional array of image URLs/paths

  @ApiPropertyOptional({
    description: 'Product status',
    enum: Status,
    example: Status.Active,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
