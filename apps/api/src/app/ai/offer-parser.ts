import { STOPWORDS, normalizeUnit } from './language';

export interface ParsedSegment {
  /** Original text of this request segment. */
  text: string;
  /** Detected quantity (defaults to 1). */
  quantity: number;
  /** Canonical unit if one was recognised. */
  unit: string | null;
  /** Significant keywords (filler/units removed). */
  terms: string[];
}

const SEGMENT_SPLIT = /\s*(?:,|;|&|\+|\band\b|\bund\b|\bplus\b)\s*/i;
const WORD = /[a-zäöüß]+/g;
// Unit token may carry a digit (m2, m3) — keep 0-9 in the class so the "2" in
// "100m2" isn't dropped (which would degrade it to "m").
const GLUED_UNIT = /\d+(?:[.,]\d+)?\s*([a-zäöüß0-9²³]+)/;
const NUMBER = /(\d+(?:[.,]\d+)?)/;

function parseSegment(text: string): ParsedSegment {
  const lower = text.toLowerCase();

  const numMatch = lower.match(NUMBER);
  const quantityRaw = numMatch ? parseFloat(numMatch[1].replace(',', '.')) : 1;
  const quantity = quantityRaw > 0 ? quantityRaw : 1;

  // Unit: prefer one glued to / following the number, else any standalone unit.
  let unit: string | null = null;
  const glued = lower.match(GLUED_UNIT);
  if (glued) unit = normalizeUnit(glued[1]);
  if (!unit) {
    for (const tok of lower.match(WORD) ?? []) {
      const u = normalizeUnit(tok);
      if (u) {
        unit = u;
        break;
      }
    }
  }

  const terms = (lower.match(WORD) ?? []).filter(
    (w) => w.length >= 3 && !STOPWORDS.has(w) && !normalizeUnit(w),
  );

  return { text: text.trim(), quantity, unit, terms };
}

/** Split a prompt into request segments and parse each. */
export const parsePrompt = (prompt: string): ParsedSegment[] =>
  prompt
    .split(SEGMENT_SPLIT)
    .map(parseSegment)
    .filter((s) => s.terms.length > 0);
