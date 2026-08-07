/** Espelha auth/dto/RateLimitResponse.java (GET/PUT /auth/rate-limit, só ADMIN). */
export interface RateLimit {
  maxTentativasEmail: number;
  maxTentativasIp: number;
  janelaMinutos: number;
  bloqueioMinutos: number;
}
