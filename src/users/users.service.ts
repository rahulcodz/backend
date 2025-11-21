import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserResponseDto> {
    this.logger.log(`Getting profile for user ID: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!existingUser) {
      this.logger.warn(`User not found for ID: ${userId}`);
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
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
    });

    return users.map((user) =>
      plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
