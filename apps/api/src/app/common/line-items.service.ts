import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'data-access';
import { lineTotal } from './totals';

/** A line as supplied by a client (offer/invoice body or AI draft). */
export interface LineInput {
  itemId?: string | null;
  description?: string;
  unit?: string | null;
  quantity: number;
  unitPrice?: number;
}

/** A fully-resolved, persistable snapshot line. */
export interface ResolvedLine {
  itemId: string | null;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  position: number;
}

/**
 * Turns loose client line inputs into priced snapshot lines. When a line
 * references a catalogue `itemId`, missing description/unit/price are filled
 * from that item (snapshotting the marked-up sell price). Shared by offers,
 * invoices, and the AI drafter so the pricing rule lives in one place.
 */
@Injectable()
export class LineItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(inputs: LineInput[]): Promise<ResolvedLine[]> {
    // Array.from (not [...set]) — webpack's Set-spread down-level is unreliable.
    const itemIds = Array.from(
      new Set(inputs.map((i) => i.itemId).filter((id): id is string => !!id)),
    );
    const items = itemIds.length
      ? await this.prisma.item.findMany({ where: { id: { in: itemIds } } })
      : [];
    const byId = new Map(items.map((i) => [i.id, i]));

    return inputs.map((input, position) => {
      const item = input.itemId ? byId.get(input.itemId) : undefined;
      if (input.itemId && !item) {
        throw new BadRequestException(`Catalogue item ${input.itemId} not found`);
      }

      const description = input.description ?? item?.description;
      if (!description) {
        throw new BadRequestException(
          `Line ${position + 1}: a description or itemId is required`,
        );
      }

      const unitPrice = input.unitPrice ?? item?.price;
      if (unitPrice === undefined) {
        throw new BadRequestException(
          `Line ${position + 1}: a unitPrice or itemId is required`,
        );
      }

      return {
        itemId: input.itemId ?? null,
        description,
        unit: input.unit ?? item?.unit ?? null,
        quantity: input.quantity,
        unitPrice,
        lineTotal: lineTotal(input.quantity, unitPrice),
        position,
      };
    });
  }
}
