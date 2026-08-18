import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../shared/components/grid/grid.types';
import { LIMITE_TUDO, paramsDeGrid } from '../shared/components/grid/parametros-grid.util';
import { Produtor, ProdutorRequest } from './models/produtor';

/**
 * Resource de produtor — um método por endpoint do ProdutorResource do back.
 *
 * <p>Todos exigem SUPER_ADMIN: produtor é entidade do produto, não de dentro
 * de um produtor, então nenhum método daqui anexa `produtorId` — ao
 * contrário de usuario.service.ts e papel.service.ts.
 */
@Injectable({ providedIn: 'root' })
export class ProdutorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/produtores`;

  /** Lista completa, para o seletor do cabeçalho — não é a listagem paginada. */
  query(): Observable<Produtor[]> {
    return this.http
      .get<PaginaGrid<Produtor>>(this.url, { params: new HttpParams().set('limit', LIMITE_TUDO) })
      .pipe(map((pagina) => pagina.conteudo));
  }

  /** Alimenta o grid — `GET /produtores` paginado no back. */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<Produtor>> {
    return this.http.get<PaginaGrid<Produtor>>(this.url, { params: paramsDeGrid(parametros) });
  }

  get(id: string): Observable<Produtor> {
    return this.http.get<Produtor>(`${this.url}/${id}`);
  }

  salvar(produtor: ProdutorRequest): Observable<Produtor> {
    return this.http.post<Produtor>(this.url, produtor);
  }

  editar(id: string, produtor: ProdutorRequest): Observable<Produtor> {
    return this.http.put<Produtor>(`${this.url}/${id}`, produtor);
  }

  inativar(id: string): Observable<Produtor> {
    return this.http.patch<Produtor>(`${this.url}/${id}/inativar`, {});
  }

  reativar(id: string): Observable<Produtor> {
    return this.http.patch<Produtor>(`${this.url}/${id}/reativar`, {});
  }
}
