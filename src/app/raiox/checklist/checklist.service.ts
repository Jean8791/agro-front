import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../../shared/components/grid/grid.types';
import { TenantContext } from '../../shared/tenant';
import { ChecklistItem, ChecklistItemRequest } from './models/checklist-item';

/** Resource do checklist de custos do Raio-X — um método por endpoint do back. */
@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly http = inject(HttpClient);
  private readonly tenant = inject(TenantContext);
  private readonly url = `${environment.apiUrl}/raiox/checklist`;

  query(): Observable<ChecklistItem[]> {
    return this.http.get<ChecklistItem[]>(this.url, { params: this.escopo() });
  }

  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<ChecklistItem>> {
    const termo = String(parametros['termo'] ?? '')
      .trim()
      .toLowerCase();

    return this.query().pipe(
      map((itens) => {
        const filtrados = termo
          ? itens.filter((item) => item.rotulo.toLowerCase().includes(termo))
          : itens;

        return { conteudo: filtrados, total: filtrados.length };
      }),
    );
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
