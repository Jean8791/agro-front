import { Injectable, signal } from '@angular/core';

/** O mínimo que a casca precisa saber do produtor escolhido. */
export interface ProdutorDaSessao {
  id: string;
  nome: string;
}

const CHAVE = 'agro.produtorSelecionado';

/**
 * Sobre qual produtor o super admin está trabalhando — o `TenantContext` do
 * back, do lado de cá.
 *
 * <p>Quem tem papel dentro de um produtor já o carrega no token e nunca passa
 * por aqui. O super admin não tem produtor na sessão, então precisa dizer:
 * sem isso, todo endpoint de `/usuarios` responde "Informe o produtor".
 *
 * <p>Fica em localStorage porque a escolha é de sessão de trabalho, não de
 * navegação — reescolher o produtor a cada F5 seria pedir demais.
 */
@Injectable({ providedIn: 'root' })
export class TenantContext {
  private readonly _produtor = signal<ProdutorDaSessao | null>(null);

  /** O produtor escolhido, ou null. Reativo — dá para usar no template. */
  readonly produtor = this._produtor.asReadonly();

  constructor() {
    this._produtor.set(ler());
  }

  selecionar(produtor: ProdutorDaSessao): void {
    localStorage.setItem(CHAVE, JSON.stringify(produtor));
    this._produtor.set(produtor);
  }

  limpar(): void {
    localStorage.removeItem(CHAVE);
    this._produtor.set(null);
  }
}

function ler(): ProdutorDaSessao | null {
  const bruto = localStorage.getItem(CHAVE);
  if (!bruto) {
    return null;
  }

  try {
    const guardado = JSON.parse(bruto) as ProdutorDaSessao;
    return guardado?.id && guardado?.nome ? guardado : null;
  } catch {
    // sobra de um formato antigo — trata como nada escolhido
    return null;
  }
}
