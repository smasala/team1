/**
 * Team (organisation member) wire contracts. Members are User rows scoped to an
 * organisation; ADMINs can manage them, EMPLOYEEs cannot.
 */
import type { UserRole } from './auth.js';

export interface TeamMemberDto {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
}
