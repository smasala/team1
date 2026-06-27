import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { PrismaService } from 'data-access';
import type { AuthUser, SessionResponse } from 'shared-types';
import {
  SUPABASE_AUDIENCE,
  TEST_USER_EMAIL,
  TEST_USER_ID,
} from './auth.constants';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
}

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

  /** Verify a Supabase-style HS256 access token and map it to an AuthUser. */
  verify(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as SupabaseJwtPayload;
      return { id: payload.sub, email: payload.email ?? null };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Dev session: ensure the seeded test user exists, then mint a Supabase-shaped
   * access token for it. Replace with real Supabase client auth once the project
   * URL + anon key are available to the frontend.
   */
  async devLogin(): Promise<SessionResponse> {
    const user = await this.prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        fullName: 'Test Tradesman',
      },
    });

    const accessToken = jwt.sign(
      { email: user.email, role: SUPABASE_AUDIENCE },
      this.secret,
      {
        algorithm: 'HS256',
        subject: user.id,
        audience: SUPABASE_AUDIENCE,
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  }

  /**
   * Load the authenticated user's profile, provisioning a User row on first
   * sight (so real Supabase users auto-create here, not just the seeded test
   * user). The token is already verified by the guard.
   */
  async me(authUser: AuthUser): Promise<AuthUser> {
    const user = await this.prisma.user.upsert({
      where: { id: authUser.id },
      update: {},
      create: { id: authUser.id, email: authUser.email },
    });
    return { id: user.id, email: user.email, fullName: user.fullName };
  }
}
