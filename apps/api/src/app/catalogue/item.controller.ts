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
import { CreateItemDto, QueryItemDto, UpdateItemDto } from './dto/item.dto';
import { ItemService } from './item.service';

@Controller('items')
export class ItemController {
  constructor(private readonly items: ItemService) {}

  @Get()
  list(@CurrentOrg() organisationId: string, @Query() query: QueryItemDto) {
    return this.items.list(organisationId, query);
  }

  @Get(':id')
  get(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.items.get(organisationId, id);
  }

  @Post()
  create(@CurrentOrg() organisationId: string, @Body() dto: CreateItemDto) {
    return this.items.create(organisationId, dto);
  }

  @Patch(':id')
  update(
    @CurrentOrg() organisationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.items.update(organisationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.items.remove(organisationId, id);
  }
}
