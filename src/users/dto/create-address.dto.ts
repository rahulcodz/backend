import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AddressLabel } from '@prisma/client';

export class CreateUserAddressDto {
  @ApiProperty({
    description: 'Address label for quick identification',
    enum: AddressLabel,
    enumName: 'AddressLabel',
    example: AddressLabel.HOME,
    default: AddressLabel.OTHER,
  })
  @IsEnum(AddressLabel)
  label: AddressLabel;

  @ApiProperty({
    description: 'Contact person full name',
    example: 'Rahul Sharma',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contactName: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactNumber?: string;

  @ApiProperty({
    description: 'Primary address line (street, building, etc.)',
    example: '221B Baker Street',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine1: string;

  @ApiPropertyOptional({
    description: 'Secondary address line (floor, apartment, etc.)',
    example: 'Floor 2, Flat 4A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City or locality',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiProperty({
    description: 'State or province',
    example: 'Maharashtra',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  state: string;

  @ApiProperty({
    description: 'Postal/Zip code',
    example: '400001',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(12)
  pincode: string;

  @ApiPropertyOptional({
    description: 'Nearby landmark to identify the location',
    example: 'Near Gateway of India',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @ApiPropertyOptional({
    description: 'Mark the address as default shipping address',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
