import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OFFER_STATUSES, type OfferStatus } from 'shared-types';

export class OfferItemInput {
  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  /** Optional override; otherwise snapshotted from the catalogue item. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreateOfferDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  /** VAT rate as a fraction, e.g. 0.19. Defaults to 0. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsIn(OFFER_STATUSES)
  status?: OfferStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferItemInput)
  items!: OfferItemInput[];
}

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsIn(OFFER_STATUSES)
  status?: OfferStatus;

  /** When present, fully replaces the offer's line items. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferItemInput)
  items?: OfferItemInput[];
}
