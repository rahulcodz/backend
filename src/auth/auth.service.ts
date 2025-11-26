import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UserResponseDto } from '../users/dto';
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
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, name, phone, location } = registerDto;

    this.logger.log(`Registration attempt for email: ${email}`);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed: Email ${email} already exists`);
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        location,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        verificationCode,
        name,
      );
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}:`,
        error,
      );
      // Don't throw error here, user is already created
    }

    const userResponse = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      message:
        'Registration successful. Please check your email for verification code.',
      user: userResponse,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for email: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`Login failed: Email not verified for ${email}`);
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    const userResponse = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    this.logger.log(`Login successful for email: ${email}`);

    return {
      access_token: token,
      user: userResponse,
    };
  }

  async validateUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(
        `User validation failed: User not found for ID ${userId}`,
      );
      throw new UnauthorizedException('User not found');
    }

    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    const { email, verificationCode } = verifyEmailDto;

    this.logger.log(`Email verification attempt for: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(
        `Email verification failed: User not found for ${email}`,
      );
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      this.logger.warn(
        `Email verification failed: Email already verified for ${email}`,
      );
      throw new BadRequestException('Email is already verified');
    }

    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== verificationCode
    ) {
      this.logger.warn(`Email verification failed: Invalid code for ${email}`);
      throw new BadRequestException('Invalid verification code');
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      this.logger.warn(`Email verification failed: Code expired for ${email}`);
      throw new BadRequestException('Verification code has expired');
    }

    // Update user as verified
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    const userResponse = plainToClass(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });

    this.logger.log(`Email verified successfully for: ${email}`);

    return {
      message: 'Email verified successfully',
      access_token: token,
      user: userResponse,
    };
  }

  async resendVerificationEmail(
    resendVerificationDto: ResendVerificationDto,
  ): Promise<ResendVerificationResponseDto> {
    const { email } = resendVerificationDto;

    this.logger.log(`Resend verification email request for: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(
        `Resend verification failed: User not found for ${email}`,
      );
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      this.logger.warn(
        `Resend verification failed: Email already verified for ${email}`,
      );
      throw new BadRequestException('Email is already verified');
    }

    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update verification code
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        verificationCode,
        user.name ?? undefined,
      );
      this.logger.log(`Verification email resent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email to ${email}:`,
        error,
      );
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message: 'Verification email sent successfully',
    };
  }

  async requestLoginOtp(
    requestLoginOtpDto: RequestLoginOtpDto,
  ): Promise<LoginOtpRequestedResponseDto> {
    const { email } = requestLoginOtpDto;

    this.logger.log(`Login OTP request for email: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Login OTP request failed: User not found for ${email}`);
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (!user.isEmailVerified) {
      this.logger.warn(
        `Login OTP request failed: Email not verified for ${email}`,
      );
      throw new BadRequestException(
        'Please verify your email before using OTP login',
      );
    }

    const otp = this.generateLoginOtp();
    const ttlMinutes = parseInt(process.env.LOGIN_OTP_TTL_MINUTES || '10', 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginOtpCode: otp,
        loginOtpExpires: expiresAt,
      },
    });

    try {
      await this.emailService.sendLoginOtpEmail(
        email,
        otp,
        user.name ?? undefined,
      );
      this.logger.log(`Login OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send login OTP to ${email}:`, error);
      throw new BadRequestException('Failed to send login OTP');
    }

    return {
      message: 'Login OTP sent to your email address',
    };
  }

  async loginWithOtp(
    loginWithOtpDto: LoginWithOtpDto,
  ): Promise<AuthResponseDto> {
    const { email, otp } = loginWithOtpDto;

    this.logger.log(`OTP login attempt for email: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`OTP login failed: User not found for ${email}`);
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`OTP login failed: Email not verified for ${email}`);
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (!user.loginOtpCode || !user.loginOtpExpires) {
      this.logger.warn(`OTP login failed: No active OTP for ${email}`);
      throw new BadRequestException('No active OTP. Please request a new one.');
    }

    if (user.loginOtpExpires < new Date()) {
      this.logger.warn(`OTP login failed: OTP expired for ${email}`);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginOtpCode: null,
          loginOtpExpires: null,
        },
      });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (user.loginOtpCode !== otp) {
      this.logger.warn(`OTP login failed: Invalid OTP for ${email}`);
      throw new BadRequestException('Invalid OTP');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginOtpCode: null,
        loginOtpExpires: null,
      },
    });

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    const userResponse = plainToClass(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });

    this.logger.log(`OTP login successful for email: ${email}`);

    return {
      access_token: token,
      user: userResponse,
    };
  }

  private generateVerificationCode(): string {
    const length = parseInt(
      process.env.EMAIL_VERIFICATION_CODE_LENGTH || '6',
      10,
    );
    return this.generateNumericCode(length);
  }

  private generateLoginOtp(): string {
    const length = parseInt(process.env.LOGIN_OTP_LENGTH || '6', 10);
    return this.generateNumericCode(length);
  }

  private generateNumericCode(length: number): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }
}
