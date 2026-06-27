/** Invoice wire contracts. Mirrors offers, plus lifecycle dates. */
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'DRAFT',
  'SENT',
  'PAID',
  'CANCELLED',
];

export interface InvoiceItemDto {
  id: string;
  itemId: string | null;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  position: number;
}

export interface InvoiceDto {
  id: string;
  number: string | null;
  offerId: string | null;
  status: InvoiceStatus;
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  items: InvoiceItemDto[];
  createdAt: string;
  updatedAt: string;
}
