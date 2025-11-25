import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from './order-response.dto';

export class OrdersListResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  buyerOrders!: OrderResponseDto[];

  @ApiProperty({ type: [OrderResponseDto] })
  sellerOrders!: OrderResponseDto[];
}
