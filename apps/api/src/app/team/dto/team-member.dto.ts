import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ROLE_ADMIN, ROLE_EMPLOYEE } from '../../auth/auth.constants';

const ROLES = [ROLE_ADMIN, ROLE_EMPLOYEE] as const;

export class CreateTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];
}
