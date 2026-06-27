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
import { CurrentOrg } from '../auth/current-user.decorator';
import {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
} from './dto/subcategory.dto';
import { SubcategoryService } from './subcategory.service';

@Controller('subcategories')
export class SubcategoryController {
  constructor(private readonly subcategories: SubcategoryService) {}

  @Get()
  list(
    @CurrentOrg() organisationId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.subcategories.list(organisationId, categoryId);
  }

  @Get(':id')
  get(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.subcategories.get(organisationId, id);
  }

  @Post()
  create(
    @CurrentOrg() organisationId: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.subcategories.create(organisationId, dto);
  }

  @Patch(':id')
  update(
    @CurrentOrg() organisationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.subcategories.update(organisationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.subcategories.remove(organisationId, id);
  }
}
