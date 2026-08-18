import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../shared/components/grid/grid.types';
import { paramsDeGrid } from '../shared/components/grid/parametros-grid.util';
import { TenantContext } from '../shared/tenant';
import { Usuario, UsuarioRequest, UsuarioUpdateRequest } from './models/usuario';

/**
 * Resource de usuário — um método por endpoint do UsuarioResource do back,
 * no mesmo espírito do `usuario.service.js` . Nenhum componente
 * monta URL: tudo passa por aqui.
 *
 * <p>Todos os endpoints exigem papel ADMIN no produtor (ou super admin) e
 * respondem sempre no escopo do produtor da sessão.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly tenant = inject(TenantContext);
  private readonly url = `${environment.apiUrl}/usuarios`;

  /** Alimenta o grid — `GET /usuarios` paginado no back. */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<Usuario>> {
    return this.http.get<PaginaGrid<Usuario>>(this.url, {
      params: paramsDeGrid(parametros, this.escopo()),
    });
  }

  get(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/${id}`, { params: this.escopo() });
  }

  salvar(usuario: UsuarioRequest): Observable<Usuario> {
    // aqui o produtor vai no corpo, não na query: é o campo do UsuarioRequest
    const produtorId = this.tenant.produtor()?.id;
    return this.http.post<Usuario>(this.url, produtorId ? { ...usuario, produtorId } : usuario);
  }

  editar(id: string, usuario: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/${id}`, usuario, { params: this.escopo() });
  }

  bloquear(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/bloquear`, {}, { params: this.escopo() });
  }

  desbloquear(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/desbloquear`, {}, { params: this.escopo() });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { params: this.escopo() });
  }

  /**
   * O `?produtorId=` que o back exige de quem é super admin. Para quem tem
   * papel dentro de um produtor não há nada escolhido, o parâmetro não vai, e
   * o back usa o produtor do token — que é o comportamento correto.
   */
  private escopo(): HttpParams {
    const produtorId = this.tenant.produtor()?.id;
    return produtorId ? new HttpParams().set('produtorId', produtorId) : new HttpParams();
  }
}
