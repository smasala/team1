import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
} from './dto/subcategory.dto';
import { SubcategoryService } from './subcategory.service';

@Controller('subcategories')
export class SubcategoryController {
  constructor(private readonly subcategories: SubcategoryService) {}

  @Get()
  list(@Query('categoryId') categoryId?: string) {
    return this.subcategories.list(categoryId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.subcategories.get(id);
  }

  @Post()
  create(@Body() dto: CreateSubcategoryDto) {
    return this.subcategories.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.subcategories.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subcategories.remove(id);
  }
}
