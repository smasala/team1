import { Controller, Get, Post } from '@nestjs/common';
import type { AuthUser, SessionResponse } from 'shared-types';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';

/** HTTP boundary for auth. Token logic lives in AuthService. */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Dev-only: issue a Supabase-shaped token for the seeded test user. */
  @Public()
  @Post('dev-login')
  devLogin(): Promise<SessionResponse> {
    return this.auth.devLogin();
  }

  /** Current authenticated profile (provisions the user row if new). */
  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<AuthUser> {
    return this.auth.me(user);
  }
}
