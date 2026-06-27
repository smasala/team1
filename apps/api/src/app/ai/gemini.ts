/**
 * Gemini-backed prompt understanding for the offer drafter.
 *
 * The model turns a free-form, multilingual request ("offer for 100m² house
 * demolition" / "Angebot für 100m² Hausabbruch") into structured line-item
 * segments. We deliberately run it NON-deterministically (temperature > 0) so
 * re-drafting the same prompt can surface different phrasings/segmentations.
 *
 * Pricing is NOT delegated to the model — segments are matched against our
 * priced catalogue downstream (ai.service), so euro amounts stay trustworthy.
 *
 * When GEMINI_API_KEY is unset (offline/tests/CI) the caller falls back to the
 * deterministic regex parser, so this file is the only place that talks to the
 * external API.
 */
import { normalizeUnit } from './language';
import type { ParsedSegment } from './offer-parser';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/** True when a Gemini API key is configured. */
export const isGeminiConfigured = (): boolean =>
  Boolean(process.env.GEMINI_API_KEY);

interface GeminiLine {
  description?: string;
  quantity?: number;
  unit?: string | null;
  terms?: string[];
}

const SYSTEM_INSTRUCTION = [
  'You extract billable line items from a tradesperson\'s natural-language',
  'request for a construction/handyman quote. The request may be in German or',
  'English. For EACH distinct piece of work return an object with:',
  '- description: a short label for the work (keep the user\'s language)',
  '- quantity: the number requested (default 1 if none is stated)',
  '- unit: one of "m²", "m³", "m", "St", "h", "kg", "t", or null if unclear',
  '- terms: 2-5 lowercase GERMAN keywords to look the work up in a German',
  '  construction price catalogue (translate from English when needed, e.g.',
  '  "demolition" -> ["abbruch","abriss"], "plaster" -> ["putz","verputzen"]).',
  'Return only the array. Do not invent prices.',
].join(' ');

const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      description: { type: 'STRING' },
      quantity: { type: 'NUMBER' },
      unit: { type: 'STRING', nullable: true },
      terms: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['description', 'quantity', 'terms'],
  },
} as const;

/**
 * Ask Gemini to segment a prompt into priced-catalogue-ready line items.
 * Throws on missing key, network/API error, or an unparseable response — the
 * caller catches and falls back to the deterministic parser.
 */
export async function geminiParsePrompt(
  prompt: string,
): Promise<ParsedSegment[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const res = await fetch(
    `${ENDPOINT}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          // Non-deterministic on purpose (see file header).
          temperature: 0.9,
          topP: 0.95,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  const parsed = JSON.parse(text) as GeminiLine[];
  if (!Array.isArray(parsed)) throw new Error('Gemini did not return an array');

  return parsed
    .map(toSegment)
    .filter((s): s is ParsedSegment => s !== null && s.terms.length > 0);
}

/** Normalise one model-emitted line into a ParsedSegment. */
function toSegment(line: GeminiLine): ParsedSegment | null {
  const description = (line.description ?? '').trim();
  const terms = (line.terms ?? [])
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length >= 2);
  if (!description && terms.length === 0) return null;

  const quantityRaw = Number(line.quantity);
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
  const unit = line.unit ? normalizeUnit(line.unit) ?? null : null;

  return { text: description || terms.join(' '), quantity, unit, terms };
}
