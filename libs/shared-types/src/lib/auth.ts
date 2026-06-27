/**
 * Auth wire contracts. Shared by the API (token issue/verify) and the web app
 * (session storage). The access token is a Supabase-compatible HS256 JWT signed
 * with SUPABASE_JWT_SECRET (sub = user id, aud/role = "authenticated").
 */
/** Team roles. ADMIN can manage organisation members; EMPLOYEE cannot. */
export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string | null;
  fullName?: string | null;
  /** Tenant the user belongs to. All business APIs are scoped to this. */
  organisationId: string;
  role: UserRole;
}

export interface SessionResponse {
  accessToken: string;
  user: AuthUser;
}
