import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description:
      'New quantity for the cart item. Values <= 0 will remove the item.',
    example: 3,
  })
  @IsInt()
  @Min(0)
  quantity!: number;
}
