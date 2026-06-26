import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from 'shared-types';
import { HealthService } from './health.service';

/** HTTP boundary only — delegates to the service, holds no logic. */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  check(): Promise<HealthStatus> {
    return this.health.check();
  }
}
