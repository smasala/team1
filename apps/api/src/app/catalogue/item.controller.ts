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
import { CreateItemDto, QueryItemDto, UpdateItemDto } from './dto/item.dto';
import { ItemService } from './item.service';

@Controller('items')
export class ItemController {
  constructor(private readonly items: ItemService) {}

  @Get()
  list(@Query() query: QueryItemDto) {
    return this.items.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.items.get(id);
  }

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.items.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.items.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.items.remove(id);
  }
}
