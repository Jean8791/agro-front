import { Injectable, computed, inject } from '@angular/core';
import { CodigoPermissao } from '../papel/models/permissao';
import { TokenStorage } from './token-storage';

/**
 * O que a pessoa logada pode fazer — a pergunta que as telas fazem para
 * decidir o que desenhar.
 *
 * <p>É a fonte única dessa decisão no front: guard de rota, item de menu,
 * botão de cabeçalho e ação de linha da grid passam todos por aqui, para não
 * haver duas regras dizendo coisas diferentes sobre o mesmo botão.
 *
 * <p>Vale repetir: isto só esconde. A autorização de verdade é o
 * `@RolesAllowed` de cada endpoint — quem chamar a API na mão continua
 * tomando 403.
 */
@Injectable({ providedIn: 'root' })
export class Permissoes {
  private readonly storage = inject(TokenStorage);

  /** Reativo: mudou o token (login, refresh, logout), a tela se redesenha. */
  readonly usuario = this.storage.usuario;

  readonly superAdmin = computed(() => this.usuario()?.superAdmin === true);

  pode(permissao: CodigoPermissao): boolean {
    return this.storage.pode(permissao);
  }

  /** Para o template, que precisa de um sinal e não de uma chamada solta. */
  podeSinal(permissao: CodigoPermissao) {
    return computed(() => this.pode(permissao));
  }
}
