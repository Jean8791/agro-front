import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CodigoPermissao } from '../papel/models/permissao';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

/** Barra quem não está logado, guardando o destino para voltar depois do login. */
export const authGuard: CanActivateFn = (_rota, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { destino: estado.url },
  });
};

/**
 * Exige uma permissão. A checagem de verdade é do back — isto só evita
 * mostrar uma tela que responderia 403. Super admin passa em qualquer uma.
 *
 * <p>A permissão pedida é sempre a de *listar* do recurso: é ela que decide
 * se a tela abre. O que se pode fazer lá dentro é decidido botão a botão,
 * com `*appSePode`.
 */
export function permissaoGuard(permissao: CodigoPermissao): CanActivateFn {
  return () => {
    const storage = inject(TokenStorage);
    const router = inject(Router);

    return storage.pode(permissao) ? true : router.createUrlTree(['/inicio']);
  };
}
