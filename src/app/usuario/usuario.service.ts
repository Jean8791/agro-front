import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginaGrid, ParametrosGrid } from '../shared/components/grid/grid.types';
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
  private readonly url = `${environment.apiUrl}/usuarios`;

  query(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  /**
   * Alimenta o grid.
   *
   * <p>Enquanto `GET /usuarios` devolver a lista inteira, o filtro por nome e
   * e-mail é feito aqui e o grid roda em modo `cliente`. Quando o back ganhar
   * paginação, esta função passa a mandar `offset`/`limit`/`sort` como params
   * e o grid volta para o modo `servidor` — o componente da tela não muda.
   */
  paginar(parametros: ParametrosGrid): Observable<PaginaGrid<Usuario>> {
    const termo = String(parametros['termo'] ?? '')
      .trim()
      .toLowerCase();

    return this.query().pipe(
      map((usuarios) => {
        const filtrados = termo
          ? usuarios.filter(
              (usuario) =>
                usuario.nome.toLowerCase().includes(termo) ||
                usuario.email.toLowerCase().includes(termo),
            )
          : usuarios;

        return { conteudo: filtrados, total: filtrados.length };
      }),
    );
  }

  get(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/${id}`);
  }

  salvar(usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, usuario);
  }

  editar(id: string, usuario: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/${id}`, usuario);
  }

  bloquear(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/bloquear`, {});
  }

  desbloquear(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/desbloquear`, {});
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
