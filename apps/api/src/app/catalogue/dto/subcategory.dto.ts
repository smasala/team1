import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubcategoryDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  categoryId!: string;
}

export class UpdateSubcategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
