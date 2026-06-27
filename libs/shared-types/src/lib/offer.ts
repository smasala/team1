/** Offer wire contracts. Totals are server-computed snapshots. */
export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';

export const OFFER_STATUSES: OfferStatus[] = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
];

export interface OfferItemDto {
  id: string;
  itemId: string | null;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  position: number;
}

export interface OfferDto {
  id: string;
  number: string | null;
  title: string | null;
  status: OfferStatus;
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  items: OfferItemDto[];
  createdAt: string;
  updatedAt: string;
}
