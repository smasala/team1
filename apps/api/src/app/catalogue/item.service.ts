import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'data-access';
import type { CreateItemDto, QueryItemDto, UpdateItemDto } from './dto/item.dto';

/**
 * CRUD for priced catalogue items. `price` is stored as given (markup already
 * baked in); tenancy is inherited from the parent category
 * (`category.organisationId`).
 */
@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  list(organisationId: string, query: QueryItemDto) {
    const { categoryId, subcategoryId, search, take = 50, skip = 0 } = query;
    return this.prisma.item.findMany({
      where: {
        category: { organisationId },
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        description: search
          ? { contains: search, mode: 'insensitive' }
          : undefined,
      },
      orderBy: { description: 'asc' },
      take: Math.min(take, 200),
      skip,
    });
  }

  async get(organisationId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, category: { organisationId } },
      include: { category: true, subcategory: true },
    });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  async create(organisationId: string, dto: CreateItemDto) {
    await this.assertCategory(organisationId, dto.categoryId);
    return this.prisma.item.create({
      data: {
        description: dto.description,
        unit: dto.unit,
        price: dto.price,
        currency: dto.currency ?? 'EUR',
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId ?? null,
      },
    });
  }

  async update(organisationId: string, id: string, dto: UpdateItemDto) {
    const current = await this.prisma.item.findFirst({
      where: { id, category: { organisationId } },
      select: { id: true },
    });
    if (!current) throw new NotFoundException(`Item ${id} not found`);
    if (dto.categoryId) await this.assertCategory(organisationId, dto.categoryId);

    return this.prisma.item.update({
      where: { id },
      data: {
        description: dto.description,
        unit: dto.unit,
        price: dto.price,
        currency: dto.currency,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
      },
    });
  }

  async remove(organisationId: string, id: string) {
    await this.get(organisationId, id); // tenant scope check
    return this.prisma.item.delete({ where: { id } });
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
