import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'data-access';
import { makeDocNumber } from '../common/doc-number';
import { LineItemsService } from '../common/line-items.service';
import { computeTotals } from '../common/totals';
import type { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';

const OFFER_INCLUDE = {
  items: { orderBy: { position: 'asc' as const } },
} as const;

/** Offer CRUD. Totals are server-computed; line items are priced snapshots. */
@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lines: LineItemsService,
  ) {}

  async create(userId: string, dto: CreateOfferDto) {
    const resolved = await this.lines.resolve(dto.items ?? []);
    const taxRate = dto.taxRate ?? 0;
    const totals = computeTotals(resolved, taxRate);

    return this.prisma.offer.create({
      data: {
        number: makeDocNumber('OFF'),
        title: dto.title,
        status: dto.status ?? 'DRAFT',
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerAddress: dto.customerAddress,
        notes: dto.notes,
        currency: dto.currency ?? 'EUR',
        taxRate,
        ...totals,
        userId,
        items: { create: resolved },
      },
      include: OFFER_INCLUDE,
    });
  }

  list(userId: string) {
    return this.prisma.offer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: OFFER_INCLUDE,
    });
  }

  async get(userId: string, id: string) {
    const offer = await this.prisma.offer.findFirst({
      where: { id, userId },
      include: OFFER_INCLUDE,
    });
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return offer;
  }

  async update(userId: string, id: string, dto: UpdateOfferDto) {
    const existing = await this.get(userId, id); // ownership check
    const taxRate = dto.taxRate ?? existing.taxRate;

    let totals: ReturnType<typeof computeTotals> | undefined;
    let itemsWrite: object | undefined;

    if (dto.items) {
      const resolved = await this.lines.resolve(dto.items);
      totals = computeTotals(resolved, taxRate);
      itemsWrite = { deleteMany: {}, create: resolved };
    } else if (dto.taxRate !== undefined) {
      totals = computeTotals(existing.items, taxRate);
    }

    return this.prisma.offer.update({
      where: { id },
      data: {
        title: dto.title,
        status: dto.status,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerAddress: dto.customerAddress,
        notes: dto.notes,
        currency: dto.currency,
        taxRate: dto.taxRate,
        ...(totals ?? {}),
        ...(itemsWrite ? { items: itemsWrite } : {}),
      },
      include: OFFER_INCLUDE,
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id); // ownership check
    return this.prisma.offer.delete({ where: { id } });
  }
}
