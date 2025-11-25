import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export class BrowseFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? Math.min(Number(value), MAX_LIMIT) : undefined,
  )
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number = DEFAULT_LIMIT;
}

