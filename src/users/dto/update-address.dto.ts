import { PartialType } from '@nestjs/swagger';
import { CreateUserAddressDto } from './create-address.dto';

export class UpdateUserAddressDto extends PartialType(CreateUserAddressDto) {}
