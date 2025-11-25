import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AddOrderActivityDto {
  @ApiProperty({
    description: 'Message to append to the order timeline',
    example: 'Package prepared, awaiting pickup.',
  })
  @IsString()
  @Length(1, 500)
  message!: string;
}
