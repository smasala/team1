import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from 'shared-types';
import { CurrentOrg, CurrentUser } from '../auth/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles.decorator';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';
import { TeamService } from './team.service';

/**
 * Organisation members. Reads are open to any member; mutations are ADMIN-only
 * (enforced by RolesGuard + @Roles). Everything is scoped to the caller's org.
 */
@Controller('team/members')
@UseGuards(RolesGuard)
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  list(@CurrentOrg() organisationId: string) {
    return this.team.list(organisationId);
  }

  @Get(':id')
  get(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.team.get(organisationId, id);
  }

  @Post()
  @Roles('ADMIN')
  create(
    @CurrentOrg() organisationId: string,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.team.create(organisationId, dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @CurrentOrg() organisationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.team.update(organisationId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.team.remove(user.organisationId, id, user.id);
  }
}
