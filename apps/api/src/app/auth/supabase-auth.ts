import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Server-side password verification against the Supabase Auth (GoTrue) service.
 *
 * We deliberately verify credentials on the backend rather than in the browser:
 * the client only ever sends email + password to our /auth/login, and we resolve
 * the matching app user ourselves. Requires SUPABASE_URL + SUPABASE_ANON_KEY.
 */

export interface SupabaseAuthUser {
  /** Supabase Auth UUID — matched against User.authId. */
  authId: string;
  email: string | null;
}

interface GoTrueTokenResponse {
  user?: { id?: string; email?: string | null };
}

/** Exchange email/password for the Supabase auth identity. Throws on bad creds. */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<SupabaseAuthUser> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new InternalServerErrorException(
      'SUPABASE_URL and SUPABASE_ANON_KEY must be set for password login',
    );
  }

  const res = await fetch(
    `${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!res.ok) {
    // 400/401 from GoTrue means invalid credentials; don't leak the detail.
    throw new UnauthorizedException('Invalid email or password');
  }

  const data = (await res.json()) as GoTrueTokenResponse;
  const authId = data.user?.id;
  if (!authId) {
    throw new UnauthorizedException('Supabase returned no user');
  }
  return { authId, email: data.user?.email ?? email };
}
