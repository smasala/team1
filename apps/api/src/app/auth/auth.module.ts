import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

/**
 * Registers the Supabase JWT guard globally (every route is protected unless
 * `@Public()`). Global so AuthService can be injected anywhere if needed.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: SupabaseJwtGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
