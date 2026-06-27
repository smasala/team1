import { EMBEDDING_DIM, isEmbeddingConfigured, toVectorLiteral } from './embedding';
import { EmbeddingService } from './embedding.service';

describe('embedding helpers', () => {
  const original = process.env.GEMINI_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  });

  it('formats a pgvector literal', () => {
    expect(toVectorLiteral([0.1, 0.2, -3])).toBe('[0.1,0.2,-3]');
    expect(toVectorLiteral([])).toBe('[]');
  });

  it('targets the 768-dim column', () => {
    expect(EMBEDDING_DIM).toBe(768);
  });

  it('reports configuration from the API key', () => {
    delete process.env.GEMINI_API_KEY;
    expect(isEmbeddingConfigured()).toBe(false);
    process.env.GEMINI_API_KEY = 'k';
    expect(isEmbeddingConfigured()).toBe(true);
  });
});

describe('EmbeddingService (no key)', () => {
  const original = process.env.GEMINI_API_KEY;
  beforeEach(() => delete process.env.GEMINI_API_KEY);
  afterEach(() => {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  });

  it('is a no-op without an API key and never touches the DB', async () => {
    const prisma = {
      $executeRawUnsafe: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    };
    const service = new EmbeddingService(prisma as never);

    expect(service.enabled).toBe(false);
    await expect(service.embedItem('item-1', 'Mauerwerk abbrechen')).resolves.toBe(
      false,
    );
    await expect(service.backfillMissing()).resolves.toBe(0);
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });
});
