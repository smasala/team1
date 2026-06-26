import { Injectable } from '@nestjs/common';
import { PrismaService } from 'data-access';
import type { HealthStatus } from 'shared-types';

/** Business logic for the health check. Talks to the DB only via PrismaService. */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    let db: HealthStatus['db'] = 'down';
    let notes = 0;

    try {
      notes = await this.prisma.note.count();
      db = 'up';
    } catch {
      db = 'down';
    }

    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}
