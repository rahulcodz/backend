import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountSettingsResponseDto,
  CreateHelpRequestDto,
  CreateUserAddressDto,
  HelpRequestResponseDto,
  UpdateAccountSettingsDto,
  UpdateUserAddressDto,
  UpdateUserDto,
  UserAddressResponseDto,
  UserResponseDto,
} from './dto';
import { Prisma } from '@prisma/client';

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

  async getAddresses(userId: string): Promise<UserAddressResponseDto[]> {
    this.logger.log(`Listing addresses for user ID: ${userId}`);

    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return addresses.map((address) =>
      plainToClass(UserAddressResponseDto, address, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async createAddress(
    userId: string,
    dto: CreateUserAddressDto,
  ): Promise<UserAddressResponseDto> {
    this.logger.log(`Creating address for user ID: ${userId}`);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const address = await tx.userAddress.create({
        data: {
          userId,
          label: dto.label,
          contactName: dto.contactName,
          contactNumber: dto.contactNumber,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          landmark: dto.landmark,
          isDefault: dto.isDefault ?? false,
        },
      });

      return plainToClass(UserAddressResponseDto, address, {
        excludeExtraneousValues: true,
      });
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateUserAddressDto,
  ): Promise<UserAddressResponseDto> {
    this.logger.log(`Updating address ${addressId} for user ID: ${userId}`);
    const existing = await this.ensureAddressOwnership(userId, addressId);

    const data: Prisma.UserAddressUncheckedUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.contactName !== undefined) data.contactName = dto.contactName;
    if (dto.contactNumber !== undefined) data.contactNumber = dto.contactNumber;
    if (dto.addressLine1 !== undefined) data.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) data.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.pincode !== undefined) data.pincode = dto.pincode;
    if (dto.landmark !== undefined) data.landmark = dto.landmark;
    if (dto.isDefault !== undefined) data.isDefault = dto.isDefault;

    const hasUpdates = Object.keys(data).length > 0;
    if (!hasUpdates && dto.isDefault !== true) {
      return plainToClass(UserAddressResponseDto, existing, {
        excludeExtraneousValues: true,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
        data.isDefault = true;
      }

      const address = await tx.userAddress.update({
        where: { id: addressId },
        data,
      });

      return plainToClass(UserAddressResponseDto, address, {
        excludeExtraneousValues: true,
      });
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    this.logger.log(`Deleting address ${addressId} for user ID: ${userId}`);
    await this.ensureAddressOwnership(userId, addressId);
    await this.prisma.userAddress.delete({ where: { id: addressId } });
  }

  async getAccountSettings(
    userId: string,
  ): Promise<AccountSettingsResponseDto> {
    this.logger.log(`Fetching account settings for user ID: ${userId}`);

    let settings = await this.prisma.userAccountSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userAccountSetting.create({
        data: { userId },
      });
    }

    return plainToClass(AccountSettingsResponseDto, settings, {
      excludeExtraneousValues: true,
    });
  }

  async updateAccountSettings(
    userId: string,
    dto: UpdateAccountSettingsDto,
  ): Promise<AccountSettingsResponseDto> {
    this.logger.log(`Updating account settings for user ID: ${userId}`);

    if (
      dto.doNotDisturbEnabled &&
      (!dto.doNotDisturbFrom || !dto.doNotDisturbTo)
    ) {
      throw new BadRequestException(
        'doNotDisturbFrom and doNotDisturbTo are required when DND is enabled',
      );
    }

    const existing = await this.prisma.userAccountSetting.findUnique({
      where: { userId },
    });

    const updateData: Prisma.UserAccountSettingUpdateInput = {};

    if (dto.orderMessageNotifications !== undefined) {
      updateData.orderMessageNotifications = dto.orderMessageNotifications;
    }

    if (dto.orderActivityNotifications !== undefined) {
      updateData.orderActivityNotifications = dto.orderActivityNotifications;
    }

    if (dto.doNotDisturbEnabled !== undefined) {
      updateData.doNotDisturbEnabled = dto.doNotDisturbEnabled;
      if (!dto.doNotDisturbEnabled) {
        updateData.doNotDisturbFrom = null;
        updateData.doNotDisturbTo = null;
      }
    }

    if (dto.doNotDisturbFrom) {
      updateData.doNotDisturbFrom = new Date(dto.doNotDisturbFrom);
    }

    if (dto.doNotDisturbTo) {
      updateData.doNotDisturbTo = new Date(dto.doNotDisturbTo);
    }

    const hasUpdates = Object.keys(updateData).length > 0;

    if (existing && !hasUpdates) {
      return plainToClass(AccountSettingsResponseDto, existing, {
        excludeExtraneousValues: true,
      });
    }

    let saved;

    if (existing) {
      saved = await this.prisma.userAccountSetting.update({
        where: { userId },
        data: updateData,
      });
    } else {
      const createData: Prisma.UserAccountSettingCreateInput = {
        user: { connect: { id: userId } },
        orderMessageNotifications: dto.orderMessageNotifications ?? true,
        orderActivityNotifications: dto.orderActivityNotifications ?? true,
        doNotDisturbEnabled: dto.doNotDisturbEnabled ?? false,
        doNotDisturbFrom:
          dto.doNotDisturbEnabled && dto.doNotDisturbFrom
            ? new Date(dto.doNotDisturbFrom)
            : null,
        doNotDisturbTo:
          dto.doNotDisturbEnabled && dto.doNotDisturbTo
            ? new Date(dto.doNotDisturbTo)
            : null,
      };
      saved = await this.prisma.userAccountSetting.create({
        data: createData,
      });
    }

    return plainToClass(AccountSettingsResponseDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async createHelpRequest(
    userId: string,
    dto: CreateHelpRequestDto,
  ): Promise<HelpRequestResponseDto> {
    this.logger.log(`Creating help request for user ID: ${userId}`);

    if (!dto.email && !dto.phone) {
      throw new BadRequestException(
        'Either email or phone number must be provided',
      );
    }

    const helpRequest = await this.prisma.userHelpRequest.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
        attachmentUrl: dto.attachmentUrl,
      },
    });

    return plainToClass(HelpRequestResponseDto, helpRequest, {
      excludeExtraneousValues: true,
    });
  }

  private async ensureAddressOwnership(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      this.logger.warn(`Address ${addressId} not found for user ID: ${userId}`);
      throw new NotFoundException('Address not found');
    }

    return address;
  }
}
