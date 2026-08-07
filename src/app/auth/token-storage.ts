import { Injectable, signal } from '@angular/core';
import { Papel, SUPER_ADMIN } from '../usuario/models/papel';
import { LoginResponse } from './models/login-response';
import { UsuarioAutenticado } from './models/usuario-autenticado';

const CHAVE_ACCESS_TOKEN = 'agro.accessToken';
const CHAVE_REFRESH_TOKEN = 'agro.refreshToken';

/**
 * Guarda o par de tokens e expõe quem está logado.
 *
 * Fica em localStorage: sobrevive a reload e a fechar o navegador, ao custo
 * de ser legível por qualquer script na página. É o preço aceito para não
 * exigir login a cada aba — se um dia isso incomodar, o caminho é mover o
 * refresh token para cookie httpOnly, o que também exige ligar
 * `access-control-allow-credentials` no CORS do back.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly _usuario = signal<UsuarioAutenticado | null>(null);

  /** Quem está logado, ou null. Reativo — dá para usar direto no template. */
  readonly usuario = this._usuario.asReadonly();

  constructor() {
    this._usuario.set(lerClaims(this.accessToken));
  }

  get accessToken(): string | null {
    return localStorage.getItem(CHAVE_ACCESS_TOKEN);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(CHAVE_REFRESH_TOKEN);
  }

  guardar(resposta: LoginResponse): void {
    localStorage.setItem(CHAVE_ACCESS_TOKEN, resposta.token);
    localStorage.setItem(CHAVE_REFRESH_TOKEN, resposta.refreshToken);
    this._usuario.set(lerClaims(resposta.token));
  }

  limpar(): void {
    localStorage.removeItem(CHAVE_ACCESS_TOKEN);
    localStorage.removeItem(CHAVE_REFRESH_TOKEN);
    this._usuario.set(null);
  }

  temPapel(papel: Papel): boolean {
    return this._usuario()?.papel === papel;
  }

  /** Super admin passa em qualquer exigência de papel: ele enxerga tudo. */
  podeComoPapel(papel: Papel): boolean {
    const logado = this._usuario();
    return logado ? logado.superAdmin || logado.papel === papel : false;
  }
}

/**
 * Lê as claims do access token. Isso NÃO valida assinatura — quem valida é o
 * back a cada requisição. Serve só para a interface saber o que mostrar.
 */
function lerClaims(token: string | null): UsuarioAutenticado | null {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as {
      sub: string;
      email: string;
      groups?: string[];
      produtor?: string;
      exp: number;
    };

    const papel = (claims.groups?.[0] ?? 'CONSULTA') as Papel | typeof SUPER_ADMIN;

    return {
      id: claims.sub,
      email: claims.email,
      papel,
      produtorId: claims.produtor,
      superAdmin: papel === SUPER_ADMIN,
      expiraEm: claims.exp,
    };
  } catch {
    // token corrompido ou de um formato antigo — trata como deslogado
    return null;
  }
}
