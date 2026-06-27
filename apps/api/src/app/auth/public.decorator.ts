import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.constants';

/** Marks a route as public so the global SupabaseJwtGuard skips it. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
