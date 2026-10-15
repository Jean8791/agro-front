import { Observable } from 'rxjs';

/** Tons dos rótulos de estado. Mesmos nomes das classes `.pill` do tema. */
export type TomPill = 'verde' | 'vermelho' | 'ambar' | 'azul' | 'cinza';

/**
 * Definição de uma coluna do grid.
 */
export interface ColunaGrid<T> {
  /** Nome do campo no objeto. Também é a chave da coluna. */
  field: string;
  /** Texto do cabeçalho. */
  titulo: string;
  /** Largura CSS fixa (ex: '10rem'). Sem isso a coluna se ajusta. */
  largura?: string;
  /** Classe aplicada às células, para alinhar à direita etc. */
  classe?: string;
  /** Se a coluna pode ser ordenada. Padrão: false. */
  ordenavel?: boolean;
  /**
   * Formata o valor exibido — faz o papel do `template`/`cellFilter`.
   * Sem isso, mostra o valor cru do `field`.
   */
  valor?: (linha: T) => string;
  /**
   * Segunda linha em corpo menor sob o valor — e-mail sob o nome, documento
   * sob a razão social. Devolver vazio omite a linha.
   */
  secundario?: (linha: T) => string;
  /**
   * Iniciais do círculo à esquerda do valor. Serve para dar rosto à coluna que
   * identifica o registro; as outras colunas não devem usar.
   */
  avatar?: (linha: T) => string;
  /**
   * Desenha o valor como rótulo de estado colorido em vez de texto puro.
   * Devolver `null` cai de volta no texto.
   */
  pill?: (linha: T) => TomPill | null;
  /**
   * Classe aplicada só na célula, calculada por linha — usado para pintar
   * situação (ver `.status-red`/`.status-green` do tema).
   */
  classeDaCelula?: (linha: T) => string;
}

/**
 * Uma ação que age sobre um registro, mostrada como botão de ícone na própria
 * linha. Substitui a botoeira "selecione a linha, depois clique no botão" —
 * o alvo da ação é sempre a linha em que o ícone está.
 */
export interface AcaoGrid<T> {
  /** Nome do ícone do Material. Pode variar por linha (bloquear/desbloquear). */
  icone: string | ((linha: T) => string);
  /** Vira o `title` e o `aria-label` do botão. */
  titulo: string | ((linha: T) => string);
  /** O que fazer com o registro da linha. */
  executar: (linha: T) => void;
  /** Cor do hover. `perigo` é vermelho, para o que destrói. */
  tom?: 'neutro' | 'primario' | 'perigo';
  /** Some com a ação em linhas onde ela não faz sentido. Padrão: sempre visível. */
  visivel?: (linha: T) => boolean;
  /** Desabilita sem esconder — usado enquanto a requisição anterior não voltou. */
  desabilitado?: (linha: T) => boolean;
}

/**
 * O que o grid manda para quem busca os dados: paginação, ordenação e os
 * critérios do filtro.
 */
export interface ParametrosGrid {
  offset: number;
  limit: number;
  sort?: string;
  [criterio: string]: unknown;
}

/** Uma página de resultados. */
export interface PaginaGrid<T> {
  conteudo: T[];
  total: number;
}

/** A função que busca os dados — o `callback` do `createGrid`. */
export type CarregarGrid<T> = (parametros: ParametrosGrid) => Observable<PaginaGrid<T>>;

/**
 * Onde a paginação acontece.
 *
 * - `servidor`: cada mudança de página refaz a busca com offset/limit novos.
 *   É o padrão e o que se espera de um endpoint paginado.
 * - `cliente`: busca tudo de uma vez e pagina em memória. Serve para
 *   endpoint que ainda devolve a lista inteira, como o `GET /usuarios` de hoje.
 */
export type ModoPaginacao = 'servidor' | 'cliente';
