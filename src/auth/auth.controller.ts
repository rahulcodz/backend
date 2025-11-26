import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  AuthResponseDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  ResendVerificationResponseDto,
  RequestLoginOtpDto,
  LoginWithOtpDto,
  LoginOtpRequestedResponseDto,
} from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code or email already verified',
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    type: ResendVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User not found or email already verified',
  })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<ResendVerificationResponseDto> {
    return this.authService.resendVerificationEmail(resendVerificationDto);
  }

  @Post('login/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a login OTP via email' })
  @ApiBody({ type: RequestLoginOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: LoginOtpRequestedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or unverified email',
  })
  async requestLoginOtp(
    @Body() requestLoginOtpDto: RequestLoginOtpDto,
  ): Promise<LoginOtpRequestedResponseDto> {
    return this.authService.requestLoginOtp(requestLoginOtpDto);
  }

  @Post('login/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login using OTP sent via email' })
  @ApiBody({ type: LoginWithOtpDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully using OTP',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or OTP expired',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or unverified email',
  })
  async loginWithOtp(
    @Body() loginWithOtpDto: LoginWithOtpDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithOtp(loginWithOtpDto);
  }
}
