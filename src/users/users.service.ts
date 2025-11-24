import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserResponseDto> {
    this.logger.log(`Getting profile for user ID: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        profileUrl: true,
        phone: true,
        location: true,
        bio: true,
      },
    });

    if (!user) {
      this.logger.warn(`User not found for ID: ${userId}`);
      throw new NotFoundException('User not found');
    }

    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating profile for user ID: ${userId}`);

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      this.logger.warn(`User not found for ID: ${userId}`);
      throw new NotFoundException('User not found');
    }

    // Only include allowed fields and only when they are provided
    const { name, profileUrl, phone, location, bio } = updateUserDto;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (profileUrl !== undefined) data.profileUrl = profileUrl;
    if (phone !== undefined) data.phone = phone;
    if (location !== undefined) data.location = location;
    if (bio !== undefined) data.bio = bio;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        profileUrl: true,
        phone: true,
        location: true,
        bio: true,
      },
    });

    this.logger.log(`Profile updated successfully for user ID: ${userId}`);

    return plainToClass(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    this.logger.log('Getting all users');

    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        profileUrl: true,
        phone: true,
        location: true,
        bio: true,
      },
    });

    return users.map((user) =>
      plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
