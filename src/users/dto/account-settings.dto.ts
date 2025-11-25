import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class AccountSettingsResponseDto {
  @ApiProperty({ description: 'Receive order related messages', default: true })
  @Expose()
  orderMessageNotifications: boolean;

  @ApiProperty({
    description: 'Receive updates about order activities',
    default: true,
  })
  @Expose()
  orderActivityNotifications: boolean;

  @ApiProperty({
    description: 'Enable do not disturb window',
    default: false,
  })
  @Expose()
  doNotDisturbEnabled: boolean;

  @ApiProperty({
    description: 'Start time for DND window (ISO timestamp)',
    required: false,
  })
  @Expose()
  doNotDisturbFrom?: Date;

  @ApiProperty({
    description: 'End time for DND window (ISO timestamp)',
    required: false,
  })
  @Expose()
  doNotDisturbTo?: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

export class UpdateAccountSettingsDto {
  @ApiProperty({
    description: 'Receive order related messages',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  orderMessageNotifications?: boolean;

  @ApiProperty({
    description: 'Receive updates for order activities',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  orderActivityNotifications?: boolean;

  @ApiProperty({
    description: 'Enable do not disturb window',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  doNotDisturbEnabled?: boolean;

  @ApiProperty({
    description: 'Start of do not disturb window (ISO timestamp)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  doNotDisturbFrom?: string;

  @ApiProperty({
    description: 'End of do not disturb window (ISO timestamp)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  doNotDisturbTo?: string;
}
