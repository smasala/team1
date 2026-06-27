import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';

/**
 * Provides the catalogue embedding service. Standalone so both the AI module
 * (retrieval) and the catalogue module (re-embed on item write) can depend on
 * it without importing each other. PrismaService comes from the global
 * PrismaModule.
 */
@Module({
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
