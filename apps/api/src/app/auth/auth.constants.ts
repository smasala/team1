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

/**
 * Custom JWT claims we add so the org + app role travel with the token and the
 * request guard can extract them without a DB round-trip. Tokens we mint
 * (dev-login) carry these; real Supabase tokens may not, so the guard falls
 * back to a DB lookup.
 */
export const CLAIM_ORG_ID = 'organisation_id';
export const CLAIM_ROLE = 'app_role';

/** App roles (mirrors UserRole in shared-types / User.role). */
export const ROLE_ADMIN = 'ADMIN';
export const ROLE_EMPLOYEE = 'EMPLOYEE';

/** Metadata key set by @Roles() for the RolesGuard. */
export const ROLES_KEY = 'roles';

/** Org auto-created for the seeded test user / first sign-ins. */
export const DEFAULT_ORG_NAME = 'FeldPro Demo';
