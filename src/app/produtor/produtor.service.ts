import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../shared/components/grid/grid.types';
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

  query(): Observable<Produtor[]> {
    return this.http.get<Produtor[]>(this.url);
  }

  /**
   * Alimenta o grid. Como `GET /produtores` devolve a lista inteira, o filtro
   * por nome e documento é feito aqui e o grid roda em modo `cliente` —
   * mesma situação de `GET /usuarios`.
   */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<Produtor>> {
    const termo = String(parametros['termo'] ?? '')
      .trim()
      .toLowerCase();

    return this.query().pipe(
      map((produtores) => {
        const filtrados = termo
          ? produtores.filter(
              (produtor) =>
                produtor.nome.toLowerCase().includes(termo) || produtor.documento.includes(termo),
            )
          : produtores;

        return { conteudo: filtrados, total: filtrados.length };
      }),
    );
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
