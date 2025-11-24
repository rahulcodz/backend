import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  @Expose()
  name?: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Account last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  // Exclude sensitive fields
  @Exclude()
  password: string;

  @Exclude()
  emailVerificationCode?: string;

  @Exclude()
  emailVerificationExpires?: Date;

  @ApiProperty({
    description: 'URL to the user profile/avatar',
    type: String,
    example: 'https://example.com/avatar.jpg',
  })
  @Expose()
  profileUrl?: string;

  @ApiProperty({
    description: 'User phone number',
    type: String,
    example: '+14155552671',
  })
  @Expose()
  phone?: string;

  @ApiProperty({
    description: 'User location (city, region, etc.)',
    type: String,
    example: 'San Francisco, CA',
  })
  @Expose()
  location?: string;

  @ApiProperty({
    description: 'Short bio/about text for the user',
    type: String,
    example: 'Full-stack developer and coffee enthusiast.',
    maxLength: 500,
  })
  @Expose()
  bio?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
