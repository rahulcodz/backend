import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New status that should be applied to the order',
    enum: OrderStatus,
    example: OrderStatus.Shipped,
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

