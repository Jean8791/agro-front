import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Produtor } from './models/produtor';

/**
 * Resource de produtor — um método por endpoint do ProdutorResource do back.
 *
 * <p>Todos exigem SUPER_ADMIN: produtor é entidade do produto, não de dentro
 * de um produtor. Por isso só o seletor do cabeçalho consome isto.
 */
@Injectable({ providedIn: 'root' })
export class ProdutorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/produtores`;

  query(): Observable<Produtor[]> {
    return this.http.get<Produtor[]>(this.url);
  }
}
