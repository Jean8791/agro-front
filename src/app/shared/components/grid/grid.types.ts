import { Observable } from 'rxjs';

/**
 * Definição de uma coluna — equivalente ao `columnDefs` do Grid do
 * projeto de referência (`{field, title, width, cellClass, template}`).
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
  /** Se a coluna pode ser ordenada. Padrão: false, como . */
  ordenavel?: boolean;
  /**
   * Formata o valor exibido — faz o papel do `template`/`cellFilter`.
   * Sem isso, mostra o valor cru do `field`.
   */
  valor?: (linha: T) => string;
  /**
   * Classe aplicada só na célula, calculada por linha — usado para pintar
   * situação (ver `.status-red`/`.status-green` do tema).
   */
  classeDaCelula?: (linha: T) => string;
}

/**
 * O que o grid manda para quem busca os dados. Mesmos nomes do
 * `ParametrosGrid` , mais os critérios do filtro.
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
 * - `cliente`: busca tudo de uma vez e pagina em memória. Equivale ao
 *   `clientSidePaging`  — serve para endpoint que ainda devolve
 *   a lista inteira, como o `GET /usuarios` de hoje.
 */
export type ModoPaginacao = 'servidor' | 'cliente';
