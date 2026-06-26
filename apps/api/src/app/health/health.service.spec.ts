import type { PrismaService } from 'data-access';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports ok when the database is reachable', async () => {
    const prisma = {
      note: { count: async () => 3 },
    } as unknown as PrismaService;

    const result = await new HealthService(prisma).check();

    expect(result).toMatchObject({ status: 'ok', db: 'up', notes: 3 });
  });

  it('reports degraded when the database throws', async () => {
    const prisma = {
      note: {
        count: async () => {
          throw new Error('db down');
        },
      },
    } as unknown as PrismaService;

    const result = await new HealthService(prisma).check();

    expect(result).toMatchObject({ status: 'degraded', db: 'down', notes: 0 });
  });
});
