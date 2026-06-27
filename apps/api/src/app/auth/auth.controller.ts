import { Body, Controller, Get, Post } from '@nestjs/common';
import type { AuthUser, SessionResponse } from 'shared-types';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

/** HTTP boundary for auth. Token logic lives in AuthService. */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Verify email/password with Supabase Auth and issue our access token. */
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<SessionResponse> {
    return this.auth.login(dto);
  }

  /** Current authenticated profile (provisions the user row if new). */
  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<AuthUser> {
    return this.auth.me(user);
  }
}
