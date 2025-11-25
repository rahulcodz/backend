import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseEnumPipe,
  ParseFloatPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProductCategory, Status } from '@prisma/client';
import { BrowseService } from './browse.service';
import { BrowseFiltersDto } from './dto/browse-filters.dto';

@Controller('browse')
export class BrowseController {
  constructor(private readonly browseService: BrowseService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number = 1,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe)
    limit: number = 12,
  ) {
    const filters: BrowseFiltersDto = {
      search,
      page,
      limit,
    };

    return this.browseService.getSellers(filters);
  }
}

