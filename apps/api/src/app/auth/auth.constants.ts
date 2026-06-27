/** Shared auth constants. */

/** Metadata key set by @Public() to bypass the global auth guard. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Supabase Auth test user (exists in auth.users and is seeded into our User
 * table). Used by the dev-login endpoint until real Supabase client auth is
 * wired on the frontend.
 */
export const TEST_USER_ID = '68e75f68-1ee2-46f4-9fee-2bbb2613a02d';
export const TEST_USER_EMAIL = 'test@fieldpro.app';

/** Supabase access tokens are HS256 with aud/role "authenticated". */
export const SUPABASE_AUDIENCE = 'authenticated';
