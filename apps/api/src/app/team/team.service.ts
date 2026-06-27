import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'data-access';
import type { TeamMemberDto } from 'shared-types';
import { ROLE_EMPLOYEE } from '../auth/auth.constants';
import type {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';

const SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  createdAt: true,
} as const;

type Row = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  createdAt: Date;
};

const toDto = (u: Row): TeamMemberDto => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  role: u.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
  createdAt: u.createdAt.toISOString(),
});

/** Organisation member (team) CRUD. All operations are tenant-scoped. */
@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organisationId: string): Promise<TeamMemberDto[]> {
    const rows = await this.prisma.user.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'asc' },
      select: SELECT,
    });
    return rows.map(toDto);
  }

  async get(organisationId: string, id: string): Promise<TeamMemberDto> {
    return toDto(await this.find(organisationId, id));
  }

  /**
   * Add a member to the caller's organisation. Real sign-in still happens via
   * Supabase; this provisions the User row (with a placeholder id until they
   * first authenticate) so admins can manage the roster ahead of time.
   */
  async create(
    organisationId: string,
    dto: CreateTeamMemberDto,
  ): Promise<TeamMemberDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A user with that email already exists');
    }

    const row = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        fullName: dto.fullName ?? null,
        role: dto.role ?? ROLE_EMPLOYEE,
        organisationId,
      },
      select: SELECT,
    });
    return toDto(row);
  }

  async update(
    organisationId: string,
    id: string,
    dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberDto> {
    await this.find(organisationId, id); // tenant scope check
    const row = await this.prisma.user.update({
      where: { id },
      data: { fullName: dto.fullName, role: dto.role },
      select: SELECT,
    });
    return toDto(row);
  }

  async remove(
    organisationId: string,
    id: string,
    currentUserId: string,
  ): Promise<TeamMemberDto> {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot remove yourself');
    }
    await this.find(organisationId, id); // tenant scope check
    const row = await this.prisma.user.delete({ where: { id }, select: SELECT });
    return toDto(row);
  }

  private async find(organisationId: string, id: string): Promise<Row> {
    const row = await this.prisma.user.findFirst({
      where: { id, organisationId },
      select: SELECT,
    });
    if (!row) throw new NotFoundException(`Team member ${id} not found`);
    return row;
  }
}
