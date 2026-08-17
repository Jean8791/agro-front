import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../../shared/components/grid/grid.types';
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

  query(): Observable<Simulacao[]> {
    return this.http.get<Simulacao[]>(this.url, { params: this.escopo() });
  }

  /** GET /raiox/simulacoes devolve a lista inteira: filtro e paginação em memória. */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<Simulacao>> {
    const termo = String(parametros['termo'] ?? '')
      .trim()
      .toLowerCase();

    return this.query().pipe(
      map((simulacoes) => {
        const filtradas = termo
          ? simulacoes.filter(
              (simulacao) =>
                simulacao.nome.toLowerCase().includes(termo) ||
                simulacao.produto.toLowerCase().includes(termo),
            )
          : simulacoes;

        return { conteudo: filtradas, total: filtradas.length };
      }),
    );
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
