import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../../shared/components/grid/grid.types';
import { paramsDeGrid } from '../../shared/components/grid/parametros-grid.util';
import { TenantContext } from '../../shared/tenant';
import { Simulacao, SimulacaoRequest } from './models/simulacao';

/**
 * Resource de simulações do Raio-X. Sem `editar`: simulação é imutável — ver
 * SimulacaoService.java no back.
 */
@Injectable({ providedIn: 'root' })
export class SimulacaoService {
  private readonly http = inject(HttpClient);
  private readonly tenant = inject(TenantContext);
  private readonly url = `${environment.apiUrl}/raiox/simulacoes`;

  /** Alimenta o grid — `GET /raiox/simulacoes` paginado no back. */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<Simulacao>> {
    return this.http.get<PaginaGrid<Simulacao>>(this.url, {
      params: paramsDeGrid(parametros, this.escopo()),
    });
  }

  get(id: string): Observable<Simulacao> {
    return this.http.get<Simulacao>(`${this.url}/${id}`, { params: this.escopo() });
  }

  salvar(simulacao: SimulacaoRequest): Observable<Simulacao> {
    const produtorId = this.tenant.produtor()?.id;
    return this.http.post<Simulacao>(
      this.url,
      produtorId ? { ...simulacao, produtorId } : simulacao,
    );
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { params: this.escopo() });
  }

  private escopo(): HttpParams {
    const produtorId = this.tenant.produtor()?.id;
    return produtorId ? new HttpParams().set('produtorId', produtorId) : new HttpParams();
  }
}
