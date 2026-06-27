/** Shared auth constants. */

/** Metadata key set by @Public() to bypass the global auth guard. */
export const IS_PUBLIC_KEY = 'isPublic';

/** Supabase access tokens are HS256 with aud/role "authenticated". */
export const SUPABASE_AUDIENCE = 'authenticated';

/**
 * Custom JWT claims we add so the org + app role travel with the token and the
 * request guard can extract them without a DB round-trip. Tokens we mint
 * (at /auth/login) carry these; raw Supabase tokens may not, so the guard falls
 * back to a DB lookup by authId.
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
