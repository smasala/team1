import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'data-access';
import { makeDocNumber } from '../common/doc-number';
import { LineItemsService } from '../common/line-items.service';
import { computeTotals } from '../common/totals';
import { OffersService } from '../offers/offers.service';
import type {
  CreateInvoiceDto,
  GenerateInvoiceDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto';

const INVOICE_INCLUDE = {
  items: { orderBy: { position: 'asc' as const } },
} as const;

/** Invoice CRUD, plus generation from an accepted offer. */
@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lines: LineItemsService,
    private readonly offers: OffersService,
  ) {}

  async create(userId: string, dto: CreateInvoiceDto) {
    const resolved = await this.lines.resolve(dto.items ?? []);
    const taxRate = dto.taxRate ?? 0;
    const totals = computeTotals(resolved, taxRate);
    const status = dto.status ?? 'DRAFT';

    return this.prisma.invoice.create({
      data: {
        number: makeDocNumber('INV'),
        status,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerAddress: dto.customerAddress,
        notes: dto.notes,
        currency: dto.currency ?? 'EUR',
        taxRate,
        ...totals,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        paidAt: status === 'PAID' ? new Date() : null,
        userId,
        items: { create: resolved },
      },
      include: INVOICE_INCLUDE,
    });
  }

  /** Copy an offer's priced lines into a fresh DRAFT invoice. */
  async generateFromOffer(
    userId: string,
    offerId: string,
    dto: GenerateInvoiceDto,
  ) {
    const offer = await this.offers.get(userId, offerId); // ownership + items
    const lines = offer.items.map((i, position) => ({
      itemId: i.itemId,
      description: i.description,
      unit: i.unit,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      position,
    }));
    const totals = computeTotals(offer.items, offer.taxRate);

    return this.prisma.invoice.create({
      data: {
        number: makeDocNumber('INV'),
        offerId: offer.id,
        status: 'DRAFT',
        customerName: offer.customerName,
        customerEmail: offer.customerEmail,
        customerAddress: offer.customerAddress,
        notes: offer.notes,
        currency: offer.currency,
        taxRate: offer.taxRate,
        ...totals,
        issuedAt: new Date(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        userId,
        items: { create: lines },
      },
      include: INVOICE_INCLUDE,
    });
  }

  list(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: INVOICE_INCLUDE,
    });
  }

  async get(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async update(userId: string, id: string, dto: UpdateInvoiceDto) {
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

    // Stamp paidAt when an invoice transitions to PAID (unless given explicitly).
    const paidAt = dto.paidAt
      ? new Date(dto.paidAt)
      : dto.status === 'PAID' && !existing.paidAt
        ? new Date()
        : undefined;

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerAddress: dto.customerAddress,
        notes: dto.notes,
        currency: dto.currency,
        taxRate: dto.taxRate,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        paidAt,
        ...(totals ?? {}),
        ...(itemsWrite ? { items: itemsWrite } : {}),
      },
      include: INVOICE_INCLUDE,
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id); // ownership check
    return this.prisma.invoice.delete({ where: { id } });
  }
}
