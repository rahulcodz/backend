import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID of the product to add to the cart',
    example: '8c1d6d95-b49e-4e33-bbee-9d12ea5a6f08',
  })
  @IsUUID('4')
  productId!: string;

  @ApiPropertyOptional({
    description: 'Number of units to add. Defaults to 1.',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
