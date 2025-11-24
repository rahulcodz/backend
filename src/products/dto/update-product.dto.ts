import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { ProductUnit } from '@prisma/client';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    description: 'Available quantity for the product',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: 'Unit representing what the quantity stands for',
    enum: ProductUnit,
    example: ProductUnit.GRAM,
  })
  @IsEnum(ProductUnit)
  unit!: ProductUnit;
}
