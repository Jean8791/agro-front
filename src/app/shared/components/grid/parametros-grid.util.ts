import { HttpParams } from '@angular/common/http';
import { ParametrosGrid } from './grid.types';

/**
 * Teto de página do back (`ParametrosPaginacao.LIMIT_MAXIMO`) — o maior lote
 * que dá pra pedir de uma vez. Usado pelos `query()` que alimentam select e
 * seletor (querem a lista inteira, não uma página).
 */
export const LIMITE_TUDO = 200;

/**
 * Converte o que o grid manda (`offset`/`limit`/`sort`/filtro) nos
 * `HttpParams` que o back espera. `extras` carrega o que o service já monta
 * por conta própria — normalmente o `produtorId` do `escopo()`.
 */
export function paramsDeGrid(parametros: ParametrosGrid, extras = new HttpParams()): HttpParams {
  let params = extras.set('offset', parametros.offset).set('limit', parametros.limit);

  if (parametros.sort) {
    params = params.set('sort', parametros.sort);
  }

  const termo = String(parametros['termo'] ?? '').trim();
  if (termo) {
    params = params.set('termo', termo);
  }

  return params;
}
