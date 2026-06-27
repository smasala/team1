import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from 'shared-types';

/**
 * Injects the authenticated user (attached by SupabaseJwtGuard) into a handler:
 *   `@CurrentUser() user: AuthUser`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
