import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.decorator';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

/** Team (organisation member) management. */
@Module({
  controllers: [TeamController],
  providers: [TeamService, RolesGuard],
})
export class TeamModule {}
