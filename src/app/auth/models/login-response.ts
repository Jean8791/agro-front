/** Espelha auth/dto/LoginResponse.java — os TTLs vêm em segundos. */
export interface LoginResponse {
  token: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}
