import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../../shared/components/grid/grid.types';
import { LIMITE_TUDO, paramsDeGrid } from '../../shared/components/grid/parametros-grid.util';
import { TenantContext } from '../../shared/tenant';
import { ChecklistItem, ChecklistItemRequest } from './models/checklist-item';

/** Resource do checklist de custos do Raio-X — um método por endpoint do back. */
@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly http = inject(HttpClient);
  private readonly tenant = inject(TenantContext);
  private readonly url = `${environment.apiUrl}/raiox/checklist`;

  /** Lista completa, para o checklist de apoio da calculadora. */
  query(): Observable<ChecklistItem[]> {
    return this.http
      .get<PaginaGrid<ChecklistItem>>(this.url, { params: this.escopo().set('limit', LIMITE_TUDO) })
      .pipe(map((pagina) => pagina.conteudo));
  }

  /** Alimenta o grid — `GET /raiox/checklist` paginado no back. */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<ChecklistItem>> {
    return this.http.get<PaginaGrid<ChecklistItem>>(this.url, {
      params: paramsDeGrid(parametros, this.escopo()),
    });
  }

  get(id: string): Observable<ChecklistItem> {
    return this.http.get<ChecklistItem>(`${this.url}/${id}`, { params: this.escopo() });
  }

  salvar(item: ChecklistItemRequest): Observable<ChecklistItem> {
    const produtorId = this.tenant.produtor()?.id;
    return this.http.post<ChecklistItem>(this.url, produtorId ? { ...item, produtorId } : item);
  }

  editar(id: string, item: ChecklistItemRequest): Observable<ChecklistItem> {
    return this.http.put<ChecklistItem>(`${this.url}/${id}`, item, { params: this.escopo() });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { params: this.escopo() });
  }

  private escopo(): HttpParams {
    const produtorId = this.tenant.produtor()?.id;
    return produtorId ? new HttpParams().set('produtorId', produtorId) : new HttpParams();
  }
}
