/**
 * AI assistant wire contracts. The assistant turns a natural-language request
 * ("offer for 100m2 house demolition") into structured offer line items drawn
 * from the seeded catalogue.
 */
export interface AiDraftRequest {
  prompt: string;
  /** Optional VAT rate (e.g. 0.19). Defaults server-side. */
  taxRate?: number;
}

export interface AiDraftLine {
  itemId: string | null;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** 0..1 confidence of the catalogue match. */
  matchScore: number;
}

export interface AiDraftResponse {
  prompt: string;
  title: string;
  lines: AiDraftLine[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  /** Human-readable trace of what the parser understood. */
  notes: string[];
}
