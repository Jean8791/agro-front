/** Espelha shared/exception/ErrorResponse.java — corpo de todo erro do back. */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
