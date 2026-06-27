import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { SubcategoryController } from './subcategory.controller';
import { SubcategoryService } from './subcategory.service';

/** Catalogue domain: Category > Subcategory > Item CRUD. */
@Module({
  controllers: [CategoryController, SubcategoryController, ItemController],
  providers: [CategoryService, SubcategoryService, ItemService],
  exports: [ItemService],
})
export class CatalogueModule {}
