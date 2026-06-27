import { IsEmail, IsString, MinLength } from 'class-validator';

/** Email + password submitted to /auth/login, verified against Supabase Auth. */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
