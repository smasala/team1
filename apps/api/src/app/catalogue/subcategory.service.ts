import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'data-access';
import type {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
} from './dto/subcategory.dto';

/** CRUD for subcategories (groupings inside a category). */
@Injectable()
export class SubcategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(categoryId?: string) {
    return this.prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } },
    });
  }

  async get(id: string) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
    });
    if (!subcategory) throw new NotFoundException(`Subcategory ${id} not found`);
    return subcategory;
  }

  create(dto: CreateSubcategoryDto) {
    return this.prisma.subcategory.create({ data: dto });
  }

  update(id: string, dto: UpdateSubcategoryDto) {
    return this.prisma.subcategory.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.subcategory.delete({ where: { id } });
  }
}
