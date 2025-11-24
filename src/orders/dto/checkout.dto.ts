import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CheckoutDto {
  @ApiPropertyOptional({
    description:
      'Specific cart item IDs to include in the order. Leave empty to checkout the entire cart.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];

  @ApiPropertyOptional({
    description: 'Optional note from the buyer for the seller(s).',
    example: 'Please ship ASAP.',
  })
  @IsOptional()
  @IsString()
  buyerNote?: string;
}
