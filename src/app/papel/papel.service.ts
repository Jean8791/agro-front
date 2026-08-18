import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../shared/components/grid/grid.types';
import { LIMITE_TUDO, paramsDeGrid } from '../shared/components/grid/parametros-grid.util';
import { TenantContext } from '../shared/tenant';
import { Papel, PapelRequest } from './models/papel';
import { RecursoComAcoes } from './models/permissao';

/**
 * Resource de papel — um método por endpoint do PapelResource do back.
 *
 * <p>Como em usuario.service.ts, o `produtorId` do super admin é anexado
 * aqui: na query string, exceto no POST, onde o campo pertence ao corpo.
 */
@Injectable({ providedIn: 'root' })
export class PapelService {
  private readonly http = inject(HttpClient);
  private readonly tenant = inject(TenantContext);
  private readonly url = `${environment.apiUrl}/papeis`;

  /** Lista completa, para o select de papel no formulário de usuário. */
  query(): Observable<Papel[]> {
    return this.http
      .get<PaginaGrid<Papel>>(this.url, { params: this.escopo().set('limit', LIMITE_TUDO) })
      .pipe(map((pagina) => pagina.conteudo));
  }

  /**
   * A matriz de recursos e ações que a tela desenha. Vem do back de propósito:
   * tela nova aparece aqui sem mexer no front.
   */
  permissoes(): Observable<RecursoComAcoes[]> {
    return this.http.get<RecursoComAcoes[]>(`${this.url}/permissoes`);
  }

  /** Alimenta o grid — `GET /papeis` paginado no back. */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<Papel>> {
    return this.http.get<PaginaGrid<Papel>>(this.url, {
      params: paramsDeGrid(parametros, this.escopo()),
    });
  }

  get(id: string): Observable<Papel> {
    return this.http.get<Papel>(`${this.url}/${id}`, { params: this.escopo() });
  }

  salvar(papel: PapelRequest): Observable<Papel> {
    // aqui o produtor vai no corpo, não na query: é o campo do PapelRequest
    const produtorId = this.tenant.produtor()?.id;
    return this.http.post<Papel>(this.url, produtorId ? { ...papel, produtorId } : papel);
  }

  editar(id: string, papel: PapelRequest): Observable<Papel> {
    return this.http.put<Papel>(`${this.url}/${id}`, papel, { params: this.escopo() });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { params: this.escopo() });
  }

  private escopo(): HttpParams {
    const produtorId = this.tenant.produtor()?.id;
    return produtorId ? new HttpParams().set('produtorId', produtorId) : new HttpParams();
  }
}
