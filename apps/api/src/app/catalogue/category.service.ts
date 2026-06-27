import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'data-access';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/** CRUD for top-level catalogue categories. Tenant-scoped by organisation. */
@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(organisationId: string) {
    return this.prisma.category.findMany({
      where: { organisationId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true, subcategories: true } } },
    });
  }

  async get(organisationId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, organisationId },
      include: {
        subcategories: { orderBy: { name: 'asc' } },
        _count: { select: { items: true } },
      },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  create(organisationId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: { ...dto, organisationId } });
  }

  async update(organisationId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensure(organisationId, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(organisationId: string, id: string) {
    await this.ensure(organisationId, id);
    return this.prisma.category.delete({ where: { id } });
  }

  /** Assert a category exists in the given org (throws 404 otherwise). */
  private async ensure(organisationId: string, id: string): Promise<void> {
    const found = await this.prisma.category.findFirst({
      where: { id, organisationId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Category ${id} not found`);
  }
}
