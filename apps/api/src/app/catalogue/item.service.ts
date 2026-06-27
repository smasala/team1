import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'data-access';
import { applyMarkup } from '../common/totals';
import type { CreateItemDto, QueryItemDto, UpdateItemDto } from './dto/item.dto';

const DEFAULT_MARKUP_PCT = 30;

/** CRUD for priced catalogue items. Enforces the markup -> price derivation. */
@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: QueryItemDto) {
    const { categoryId, subcategoryId, search, take = 50, skip = 0 } = query;
    return this.prisma.item.findMany({
      where: {
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

  async get(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { category: true, subcategory: true },
    });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  create(dto: CreateItemDto) {
    const markupPct = dto.markupPct ?? DEFAULT_MARKUP_PCT;
    return this.prisma.item.create({
      data: {
        description: dto.description,
        unit: dto.unit,
        basePrice: dto.basePrice,
        markupPct,
        price: applyMarkup(dto.basePrice, markupPct),
        currency: dto.currency ?? 'EUR',
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateItemDto) {
    // Re-derive the sell price whenever the baseline or markup moves.
    const current = await this.prisma.item.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Item ${id} not found`);

    const basePrice = dto.basePrice ?? current.basePrice;
    const markupPct = dto.markupPct ?? current.markupPct;

    return this.prisma.item.update({
      where: { id },
      data: {
        description: dto.description,
        unit: dto.unit,
        basePrice: dto.basePrice,
        markupPct: dto.markupPct,
        price:
          dto.basePrice !== undefined || dto.markupPct !== undefined
            ? applyMarkup(basePrice, markupPct)
            : undefined,
        currency: dto.currency,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
      },
    });
  }

  remove(id: string) {
    return this.prisma.item.delete({ where: { id } });
  }
}
