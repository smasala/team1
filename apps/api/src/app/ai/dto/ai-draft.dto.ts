import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AiDraftDto {
  @IsString()
  @MaxLength(2000)
  prompt!: string;

  /** Optional VAT rate as a fraction (default 0.19 / German MwSt). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
}
