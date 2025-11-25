import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateHelpRequestDto {
  @ApiProperty({ description: 'Name of the person raising the help request' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Email address for follow up',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number for follow up',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Subject/title of the help request' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ description: 'Detailed message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Attachment URL for screenshots or documents',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachmentUrl?: string;
}

export class HelpRequestResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  email?: string;

  @ApiProperty({ required: false })
  @Expose()
  phone?: string;

  @ApiProperty()
  @Expose()
  subject: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty({ required: false })
  @Expose()
  attachmentUrl?: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
