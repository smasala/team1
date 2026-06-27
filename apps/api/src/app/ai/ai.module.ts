import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

/** AI assistant: natural language -> structured offer draft. */
@Module({
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
