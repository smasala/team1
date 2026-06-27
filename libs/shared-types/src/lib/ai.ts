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

/**
 * Resolution state of a drafted line.
 * - `matched`: `itemId` resolves to a real, priced catalogue row.
 * - `manual`:  no catalogue match — the price must be set by hand before
 *   sending. Such lines are surfaced, never dropped (coverage is a feature).
 */
export type AiLineStatus = 'matched' | 'manual';

export interface AiDraftLine {
  itemId: string | null;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** 0..1 confidence of the catalogue match. */
  matchScore: number;
  /** Whether this line is backed by a catalogue row or needs manual pricing. */
  status: AiLineStatus;
  /**
   * Trade/section this position belongs to, used to group the offer
   * (e.g. "Baustelleneinrichtung", "Abbruch", "Entsorgung"). Optional until the
   * generative decomposition stage (Phase 2) assigns sections.
   */
  section?: string;
  /**
   * Explicit, editable assumptions behind this position — the numbers a human
   * must verify before sending (storeys, building height, construction type,
   * debris density…). Quantities are the accuracy/liability risk, so they are
   * surfaced here rather than silently folded into `quantity`.
   */
  assumptions?: string[];
  /** Short human explanation of how `quantity` was derived from the request. */
  quantityRationale?: string;
}

/**
 * How much of the drafted offer is backed by real catalogue prices. Coverage is
 * a product feature: unmatched positions are flagged ("price manually"), never
 * dropped. Invariant: `matched + manual === lines.length`.
 */
export interface AiDraftCoverage {
  /** Lines resolved to a catalogue row (`status === 'matched'`). */
  matched: number;
  /** Lines with no catalogue match (`status === 'manual'`). */
  manual: number;
  /** `matched / total`, 0..1 (1 when there are no lines). */
  ratio: number;
}

export interface AiDraftResponse {
  prompt: string;
  title: string;
  lines: AiDraftLine[];
  /** Matched-vs-manual summary derived from `lines[].status`. */
  coverage: AiDraftCoverage;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  /** Human-readable trace of what the parser understood. */
  notes: string[];
}
