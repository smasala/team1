import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  description!: string;

  @IsString()
  @MaxLength(40)
  unit!: string;

  /** Untouched baseline price; sell `price` is derived via the markup. */
  @IsNumber()
  @Min(0)
  basePrice!: number;

  /** Defaults to 30% (the catalogue-wide markup). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  markupPct?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string | null;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markupPct?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string | null;
}

/** Filter/paginate the (large) item list. */
export class QueryItemDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
