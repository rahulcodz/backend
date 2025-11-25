import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
import * as authTypes from '../types/auth.types';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(
    @CurrentUser() user: authTypes.AuthUser,
  ): Promise<UserResponseDto> {
    return this.usersService.getProfile(user.userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.userId, updateUserDto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List saved addresses' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    type: [UserAddressResponseDto],
  })
  async getAddresses(
    @CurrentUser() user: authTypes.AuthUser,
  ): Promise<UserAddressResponseDto[]> {
    return this.usersService.getAddresses(user.userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create a new address' })
  @ApiBody({ type: CreateUserAddressDto })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
    type: UserAddressResponseDto,
  })
  async createAddress(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() dto: CreateUserAddressDto,
  ): Promise<UserAddressResponseDto> {
    return this.usersService.createAddress(user.userId, dto);
  }

  @Put('addresses/:addressId')
  @ApiOperation({ summary: 'Update an existing address' })
  @ApiBody({ type: UpdateUserAddressDto })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
    type: UserAddressResponseDto,
  })
  async updateAddress(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
    @Body() dto: UpdateUserAddressDto,
  ): Promise<UserAddressResponseDto> {
    return this.usersService.updateAddress(user.userId, addressId, dto);
  }

  @Delete('addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({
    status: 204,
    description: 'Address deleted successfully',
  })
  async deleteAddress(
    @CurrentUser() user: authTypes.AuthUser,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ): Promise<void> {
    return this.usersService.deleteAddress(user.userId, addressId);
  }

  @Get('account-settings')
  @ApiOperation({ summary: 'Get account settings' })
  @ApiResponse({
    status: 200,
    description: 'Account settings retrieved successfully',
    type: AccountSettingsResponseDto,
  })
  async getAccountSettings(
    @CurrentUser() user: authTypes.AuthUser,
  ): Promise<AccountSettingsResponseDto> {
    return this.usersService.getAccountSettings(user.userId);
  }

  @Put('account-settings')
  @ApiOperation({ summary: 'Update account settings' })
  @ApiBody({ type: UpdateAccountSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Account settings updated successfully',
    type: AccountSettingsResponseDto,
  })
  async updateAccountSettings(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() dto: UpdateAccountSettingsDto,
  ): Promise<AccountSettingsResponseDto> {
    return this.usersService.updateAccountSettings(user.userId, dto);
  }

  @Post('help')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a help/support request' })
  @ApiBody({ type: CreateHelpRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Help request submitted successfully',
    type: HelpRequestResponseDto,
  })
  async submitHelpRequest(
    @CurrentUser() user: authTypes.AuthUser,
    @Body() dto: CreateHelpRequestDto,
  ): Promise<HelpRequestResponseDto> {
    return this.usersService.createHelpRequest(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers();
  }
}
