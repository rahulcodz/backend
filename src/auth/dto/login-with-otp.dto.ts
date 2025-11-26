import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginWithOtpDto {
  @ApiProperty({
    description: 'Registered email address used to request the login OTP',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'One-time password sent to the user email',
    example: '123456',
    minLength: 4,
    maxLength: 10,
  })
  @IsString()
  @Length(4, 10, {
    message: 'OTP must be between 4 and 10 characters long',
  })
  otp: string;
}
