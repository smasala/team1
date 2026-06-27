import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { PrismaService } from 'data-access';
import type { AuthUser, SessionResponse, UserRole } from 'shared-types';
import {
  CLAIM_ORG_ID,
  CLAIM_ROLE,
  DEFAULT_ORG_NAME,
  ROLE_ADMIN,
  ROLE_EMPLOYEE,
  SUPABASE_AUDIENCE,
  TEST_USER_ID,
} from './auth.constants';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  [CLAIM_ORG_ID]?: string;
  [CLAIM_ROLE]?: string;
}

const asRole = (value: string | null | undefined): UserRole =>
  value === ROLE_ADMIN ? ROLE_ADMIN : ROLE_EMPLOYEE;

/** Token issue/verify against the Supabase JWT secret, plus user provisioning. */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private get secret(): string {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('SUPABASE_JWT_SECRET is not set');
    }
    return secret;
  }

  /**
   * Resolve a verified token into the full request context (user + org + role).
   * Custom claims (added to tokens we mint) are trusted directly so no DB hit is
   * needed; real Supabase tokens that lack them fall back to DB provisioning.
   */
  async resolveContext(token: string): Promise<AuthUser> {
    const payload = this.verify(token);
    if (payload[CLAIM_ORG_ID] && payload[CLAIM_ROLE]) {
      return {
        id: payload.sub,
        email: payload.email ?? null,
        organisationId: payload[CLAIM_ORG_ID],
        role: asRole(payload[CLAIM_ROLE]),
      };
    }
    return this.provision(payload.sub, payload.email ?? null);
  }

  /** Verify a Supabase-style HS256 access token. Throws on failure. */
  private verify(token: string): SupabaseJwtPayload {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as SupabaseJwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Ensure a User row (and its Organisation) exist, returning the auth context.
   * New users get a personal organisation and are made its ADMIN; the very first
   * member of any org is its admin.
   */
  async provision(id: string, email: string | null): Promise<AuthUser> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organisationId: true,
      },
    });

    if (existing?.organisationId) {
      return {
        id: existing.id,
        email: existing.email,
        fullName: existing.fullName,
        organisationId: existing.organisationId,
        role: asRole(existing.role),
      };
    }

    // First sight (or a user with no org yet): create a personal org as admin.
    const org = await this.prisma.organisation.create({
      data: { name: email ? `${email}'s organisation` : DEFAULT_ORG_NAME },
    });
    const user = await this.prisma.user.upsert({
      where: { id },
      update: { organisationId: org.id },
      create: { id, email, organisationId: org.id, role: ROLE_ADMIN },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organisationId: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      organisationId: user.organisationId as string,
      role: asRole(user.role),
    };
  }

  /**
   * Dev session: look up the SEEDED test user (linked to the Supabase Auth UUID
   * by the seed, not provisioned here) and mint a Supabase-shaped access token
   * carrying its org id and role as custom claims. This mirrors the real flow —
   * Supabase verifies the password, we resolve the user from our own schema —
   * without hardcoding/provisioning identity in the login path. Replace with the
   * Supabase client once the project URL + anon key are wired on the frontend.
   */
  async devLogin(): Promise<SessionResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organisationId: true,
      },
    });

    if (!user?.organisationId) {
      throw new UnauthorizedException(
        `Test user ${TEST_USER_ID} is not seeded. Run "npm run db:seed".`,
      );
    }

    const ctx: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      organisationId: user.organisationId,
      role: asRole(user.role),
    };
    return { accessToken: this.sign(ctx), user: ctx };
  }

  /** Mint an HS256 access token carrying our org + role claims. */
  private sign(ctx: AuthUser): string {
    return jwt.sign(
      {
        email: ctx.email,
        role: SUPABASE_AUDIENCE,
        [CLAIM_ORG_ID]: ctx.organisationId,
        [CLAIM_ROLE]: ctx.role,
      },
      this.secret,
      {
        algorithm: 'HS256',
        subject: ctx.id,
        audience: SUPABASE_AUDIENCE,
        expiresIn: '7d',
      },
    );
  }

  /** Current authenticated profile (already resolved + provisioned by guard). */
  async me(authUser: AuthUser): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id },
      select: { fullName: true },
    });
    return { ...authUser, fullName: user?.fullName ?? authUser.fullName };
  }
}
