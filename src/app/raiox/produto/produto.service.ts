import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../../shared/components/grid/grid.types';
import { LIMITE_TUDO, paramsDeGrid } from '../../shared/components/grid/parametros-grid.util';
import { TenantContext } from '../../shared/tenant';
import { ProdutoBase, ProdutoBaseRequest } from './models/produto';

/**
 * Resource do catálogo de produtos/atividades do Raio-X — um método por
 * endpoint do ProdutoBaseResource do back. Mesmo esquema de `produtorId` de
 * usuario.service.ts e papel.service.ts: query string, exceto no POST.
 */
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly tenant = inject(TenantContext);
  private readonly url = `${environment.apiUrl}/raiox/produtos`;

  /** Lista completa, para o select de produto da calculadora. */
  query(): Observable<ProdutoBase[]> {
    return this.http
      .get<PaginaGrid<ProdutoBase>>(this.url, { params: this.escopo().set('limit', LIMITE_TUDO) })
      .pipe(map((pagina) => pagina.conteudo));
  }

  /** Alimenta o grid — `GET /raiox/produtos` paginado no back. */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<ProdutoBase>> {
    return this.http.get<PaginaGrid<ProdutoBase>>(this.url, {
      params: paramsDeGrid(parametros, this.escopo()),
    });
  }

  get(id: string): Observable<ProdutoBase> {
    return this.http.get<ProdutoBase>(`${this.url}/${id}`, { params: this.escopo() });
  }

  salvar(produto: ProdutoBaseRequest): Observable<ProdutoBase> {
    const produtorId = this.tenant.produtor()?.id;
    return this.http.post<ProdutoBase>(this.url, produtorId ? { ...produto, produtorId } : produto);
  }

  editar(id: string, produto: ProdutoBaseRequest): Observable<ProdutoBase> {
    return this.http.put<ProdutoBase>(`${this.url}/${id}`, produto, { params: this.escopo() });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { params: this.escopo() });
  }

  /** Insere o que falta do catálogo padrão (75 produtos) — idempotente. */
  semearPadrao(): Observable<void> {
    return this.http.post<void>(`${this.url}/semear-padrao`, {}, { params: this.escopo() });
  }

  private escopo(): HttpParams {
    const produtorId = this.tenant.produtor()?.id;
    return produtorId ? new HttpParams().set('produtorId', produtorId) : new HttpParams();
  }
}
