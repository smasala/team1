/**
 * Catalogue wire contracts (Category > Subcategory > Item). `price` is the single
 * sell price (the catalogue-wide markup is baked in at seed time).
 */
export interface ItemDto {
  id: string;
  description: string;
  unit: string;
  price: number;
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
