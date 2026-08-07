import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Papel } from '../usuario/models/papel';
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
 * Exige um papel específico. A checagem de verdade é do back — isto só evita
 * mostrar uma tela que responderia 403. Super admin passa em qualquer uma.
 */
export function papelGuard(papel: Papel): CanActivateFn {
  return () => {
    const storage = inject(TokenStorage);
    const router = inject(Router);

    return storage.podeComoPapel(papel) ? true : router.createUrlTree(['/inicio']);
  };
}
