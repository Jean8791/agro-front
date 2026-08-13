import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { Permissoes } from '../auth/permissoes';
import { CodigoPermissao } from '../papel/models/permissao';

/**
 * Mostra o trecho só para quem tem a permissão:
 *
 * ```html
 * <button *appSePode="'usuario:inserir'" (click)="inserir()">Novo usuário</button>
 * ```
 *
 * <p>É o `ng-if` da autorização. Existe para que a decisão fique escrita ao
 * lado do botão, e não num sinal `podeX` declarado longe dele.
 *
 * <p>Esconder botão é conforto de interface, não segurança: quem monta a
 * requisição na mão continua tomando 403 do back.
 */
@Directive({
  selector: '[appSePode]',
})
export class SePode {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissoes = inject(Permissoes);

  readonly appSePode = input.required<CodigoPermissao>();

  private desenhado = false;

  constructor() {
    // effect e não ngOnInit: o token muda com refresh e logout, e o que está
    // na tela precisa acompanhar
    effect(() => {
      const permitido = this.permissoes.pode(this.appSePode());

      if (permitido && !this.desenhado) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.desenhado = true;
      } else if (!permitido && this.desenhado) {
        this.viewContainer.clear();
        this.desenhado = false;
      }
    });
  }
}
