import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  Length,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'URL to the user profile/avatar',
    type: String,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  profileUrl?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    type: String,
    example: '+14155552671',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User location (city, region, etc.)',
    type: String,
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Short bio/about text for the user',
    type: String,
    example: 'Full-stack developer and coffee enthusiast.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;
}
