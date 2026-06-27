import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentOrg } from '../auth/current-user.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  list(@CurrentOrg() organisationId: string) {
    return this.categories.list(organisationId);
  }

  @Get(':id')
  get(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.categories.get(organisationId, id);
  }

  @Post()
  create(@CurrentOrg() organisationId: string, @Body() dto: CreateCategoryDto) {
    return this.categories.create(organisationId, dto);
  }

  @Patch(':id')
  update(
    @CurrentOrg() organisationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(organisationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.categories.remove(organisationId, id);
  }
}
