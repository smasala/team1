import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'data-access';
import type {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
} from './dto/subcategory.dto';

/**
 * CRUD for subcategories (groupings inside a category). Tenancy is inherited
 * from the parent category, so every query filters on `category.organisationId`.
 */
@Injectable()
export class SubcategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(organisationId: string, categoryId?: string) {
    return this.prisma.subcategory.findMany({
      where: { categoryId: categoryId || undefined, category: { organisationId } },
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } },
    });
  }

  async get(organisationId: string, id: string) {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: { id, category: { organisationId } },
    });
    if (!subcategory) throw new NotFoundException(`Subcategory ${id} not found`);
    return subcategory;
  }

  async create(organisationId: string, dto: CreateSubcategoryDto) {
    await this.assertCategory(organisationId, dto.categoryId);
    return this.prisma.subcategory.create({ data: dto });
  }

  async update(organisationId: string, id: string, dto: UpdateSubcategoryDto) {
    await this.get(organisationId, id); // tenant scope check
    return this.prisma.subcategory.update({ where: { id }, data: dto });
  }

  async remove(organisationId: string, id: string) {
    await this.get(organisationId, id); // tenant scope check
    return this.prisma.subcategory.delete({ where: { id } });
  }

  /** Assert the target category belongs to the caller's org. */
  private async assertCategory(
    organisationId: string,
    categoryId: string,
  ): Promise<void> {
    const found = await this.prisma.category.findFirst({
      where: { id: categoryId, organisationId },
      select: { id: true },
    });
    if (!found) {
      throw new ForbiddenException(`Category ${categoryId} not in your organisation`);
    }
  }
}
