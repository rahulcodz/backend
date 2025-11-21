export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  name?: string | null;
}
