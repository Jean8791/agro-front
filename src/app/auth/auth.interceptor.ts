import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

/** Rotas do back que não levam token e não devem disparar refresh. */
const ROTAS_PUBLICAS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Injeta o Bearer em toda chamada ao back e, no primeiro 401, tenta renovar
 * o access token uma vez e refazer a requisição. Se o refresh também falhar,
 * limpa a sessão e manda para o login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorage);
  const auth = inject(AuthService);
  const router = inject(Router);

  const publica = ROTAS_PUBLICAS.some((rota) => req.url.includes(rota));
  const requisicao = publica ? req : comToken(req, storage.accessToken);

  return next(requisicao).pipe(
    catchError((erro: HttpErrorResponse) => {
      const podeRenovar = erro.status === 401 && !publica && storage.refreshToken !== null;
      if (!podeRenovar) {
        return throwError(() => erro);
      }

      return auth.renovar().pipe(
        switchMap(() => next(comToken(req, storage.accessToken))),
        catchError((erroDaRenovacao) => {
          storage.limpar();
          router.navigate(['/login']);
          return throwError(() => erroDaRenovacao);
        }),
      );
    }),
  );
};

function comToken<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  if (!token) {
    return req;
  }
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
