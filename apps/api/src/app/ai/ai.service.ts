import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'data-access';
import type { AiDraftLine, AiDraftResponse } from 'shared-types';
import { computeTotals, lineTotal, round2 } from '../common/totals';
import type { AiDraftDto } from './dto/ai-draft.dto';
import {
  geminiParsePrompt,
  isGeminiConfigured,
  type ParsedSegment,
} from './gemini';
import { expandTerms } from './language';

const DEFAULT_TAX_RATE = 0.19; // German MwSt.

interface ItemRow {
  id: string;
  description: string;
  unit: string;
  price: number;
  currency: string;
}

interface Match {
  item: ItemRow;
  score: number;
}

const truncate = (s: string, n = 60): string =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

const makeTitle = (prompt: string): string => {
  const clean = prompt.trim().replace(/\s+/g, ' ');
  const title = truncate(clean, 70);
  return title.charAt(0).toUpperCase() + title.slice(1);
};

/**
 * Conversational offer drafter. Uses Gemini to parse a natural-language request
 * into segments, matches each against the seeded catalogue, and assembles a
 * structured (but not yet persisted) offer with computed totals.
 */
@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async draftOffer(
    organisationId: string,
    dto: AiDraftDto,
  ): Promise<AiDraftResponse> {
    const taxRate = dto.taxRate ?? DEFAULT_TAX_RATE;

    const lines: AiDraftLine[] = [];
    const notes: string[] = [];
    let currency = 'EUR';

    const segments = await this.segment(dto.prompt);
    notes.push('Drafted with Gemini.');

    for (const seg of segments) {
      const best = await this.bestMatch(
        organisationId,
        expandTerms(seg.terms),
        seg.unit,
      );
      if (best) {
        currency = best.item.currency;
        lines.push({
          itemId: best.item.id,
          description: best.item.description,
          unit: best.item.unit,
          quantity: seg.quantity,
          unitPrice: best.item.price,
          lineTotal: lineTotal(seg.quantity, best.item.price),
          matchScore: round2(best.score),
        });
        notes.push(
          `${seg.quantity}${seg.unit ? ` ${seg.unit}` : ''} → “${truncate(
            best.item.description,
          )}” @ €${best.item.price} (match ${best.score.toFixed(2)})`,
        );
      } else {
        lines.push({
          itemId: null,
          description: seg.text,
          unit: seg.unit,
          quantity: seg.quantity,
          unitPrice: 0,
          lineTotal: 0,
          matchScore: 0,
        });
        notes.push(`No catalogue match for “${seg.text}” — set a price manually.`);
      }
    }

    if (!segments.length) {
      notes.push('Could not extract any line items from the prompt.');
    }

    const totals = computeTotals(lines, taxRate);
    return {
      prompt: dto.prompt,
      title: makeTitle(dto.prompt),
      lines,
      ...totals,
      taxRate,
      currency,
      notes,
    };
  }

  /**
   * Turn a prompt into line-item segments via the Gemini API. There is no local
   * fallback: when GEMINI_API_KEY is unset or the API errors, drafting fails so
   * the caller never gets a silently-degraded result.
   */
  private async segment(prompt: string): Promise<ParsedSegment[]> {
    if (!isGeminiConfigured()) {
      throw new ServiceUnavailableException(
        'AI drafting is unavailable: GEMINI_API_KEY is not configured',
      );
    }
    try {
      return await geminiParsePrompt(prompt);
    } catch (err) {
      throw new ServiceUnavailableException(
        `AI drafting failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Best catalogue item for a set of search terms, scored by term coverage. */
  private async bestMatch(
    organisationId: string,
    search: string[],
    unit: string | null,
  ): Promise<Match | null> {
    if (!search.length) return null;

    const candidates = (await this.prisma.item.findMany({
      where: {
        category: { organisationId },
        OR: search.map((t) => ({
          description: { contains: t, mode: 'insensitive' as const },
        })),
      },
      select: {
        id: true,
        description: true,
        unit: true,
        price: true,
        currency: true,
      },
      take: 80,
    })) as ItemRow[];

    let best: Match | null = null;
    for (const item of candidates) {
      const desc = item.description.toLowerCase();
      const matched = search.filter((t) => desc.includes(t)).length;
      let score = matched / search.length;
      if (unit && item.unit === unit) score += 0.25; // reward unit agreement
      score = Math.min(score, 1);

      if (
        !best ||
        score > best.score ||
        (score === best.score &&
          item.description.length < best.item.description.length)
      ) {
        best = { item, score };
      }
    }
    return best;
  }
}
