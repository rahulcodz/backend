import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AddressLabel } from '@prisma/client';

export class UserAddressResponseDto {
  @ApiProperty({ description: 'Address identifier' })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Label describing the address purpose',
    enum: AddressLabel,
    enumName: 'AddressLabel',
  })
  @Expose()
  label: AddressLabel;

  @ApiProperty({ description: 'Contact person name' })
  @Expose()
  contactName: string;

  @ApiProperty({ description: 'Contact number', required: false })
  @Expose()
  contactNumber?: string;

  @ApiProperty({ description: 'Primary address line' })
  @Expose()
  addressLine1: string;

  @ApiProperty({ description: 'Secondary address line', required: false })
  @Expose()
  addressLine2?: string;

  @ApiProperty({ description: 'City/locality', required: false })
  @Expose()
  city?: string;

  @ApiProperty({ description: 'State/Province' })
  @Expose()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @Expose()
  pincode: string;

  @ApiProperty({ description: 'Nearby landmark', required: false })
  @Expose()
  landmark?: string;

  @ApiProperty({ description: 'Is default address', default: false })
  @Expose()
  isDefault: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
