import { Body, Controller, Post } from '@nestjs/common';
import type { AiDraftResponse } from 'shared-types';
import { CurrentOrg } from '../auth/current-user.decorator';
import { AiService } from './ai.service';
import { AiDraftDto } from './dto/ai-draft.dto';

/** Conversational interface for building offers from natural language. */
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Parse a prompt and return a structured (unsaved) offer draft. */
  @Post('draft-offer')
  draftOffer(
    @CurrentOrg() organisationId: string,
    @Body() dto: AiDraftDto,
  ): Promise<AiDraftResponse> {
    return this.ai.draftOffer(organisationId, dto);
  }
}
