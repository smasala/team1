import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'data-access';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/** CRUD for top-level catalogue categories. */
@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true, subcategories: true } } },
    });
  }

  async get(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: { orderBy: { name: 'asc' } },
        _count: { select: { items: true } },
      },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
