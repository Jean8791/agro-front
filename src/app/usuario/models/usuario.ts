/** Espelha usuario/dto/UsuarioResponse.java. Ids são UUID, então string. */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  admin: boolean;
  /** O papel do vínculo. Vem como id e nome para a listagem não fazer 2ª busca. */
  papelId: string;
  papelNome: string;
}

/** Espelha usuario/dto/UsuarioRequest.java (POST /usuarios — leva senha). */
export interface UsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  papelId: string;
  /** Só o super admin informa: ele não tem produtor na sessão. */
  produtorId?: string;
}

/** Espelha usuario/dto/UsuarioUpdateRequest.java (PUT — sem senha). */
export interface UsuarioUpdateRequest {
  nome: string;
  email: string;
  papelId: string;
}
