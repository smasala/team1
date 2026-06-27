/**
 * Catalogue wire contracts (Category > Subcategory > Item). Prices are the
 * marked-up sell prices; `basePrice` is the untouched baseline.
 */
export interface ItemDto {
  id: string;
  description: string;
  unit: string;
  basePrice: number;
  price: number;
  markupPct: number;
  currency: string;
  categoryId: string;
  subcategoryId: string | null;
}

export interface SubcategoryDto {
  id: string;
  name: string;
  categoryId: string;
}

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  sourceUrl: string | null;
  subcategories?: SubcategoryDto[];
  itemCount?: number;
}
