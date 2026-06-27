/**
 * Auth wire contracts. Shared by the API (token issue/verify) and the web app
 * (session storage). The access token is a Supabase-compatible HS256 JWT signed
 * with SUPABASE_JWT_SECRET (sub = user id, aud/role = "authenticated").
 */
export interface AuthUser {
  id: string;
  email: string | null;
  fullName?: string | null;
}

export interface SessionResponse {
  accessToken: string;
  user: AuthUser;
}
