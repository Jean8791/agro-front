import { Papel } from './papel';

/** Espelha usuario/dto/UsuarioResponse.java. Ids são UUID, então string. */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  admin: boolean;
  papel: Papel;
}

/** Espelha usuario/dto/UsuarioRequest.java (POST /usuarios — leva senha). */
export interface UsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
  /** Só o super admin informa: ele não tem produtor na sessão. */
  produtorId?: string;
}

/** Espelha usuario/dto/UsuarioUpdateRequest.java (PUT — sem senha). */
export interface UsuarioUpdateRequest {
  nome: string;
  email: string;
  papel: Papel;
}
