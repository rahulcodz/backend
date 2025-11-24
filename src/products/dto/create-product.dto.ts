import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
} from 'class-validator';
import { ProductCategory, Status } from '@prisma/client';

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
