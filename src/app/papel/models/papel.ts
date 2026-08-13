import { Permissao } from './permissao';

/** Espelha papel/dto/PapelResponse.java. Ids são UUID, então string. */
export interface Papel {
  id: string;
  nome: string;
  descricao?: string;
  /** Papel que nasce com o sistema: pode ser usado, nunca alterado. */
  sistema: boolean;
  permissoes: Permissao[];
}

/** Espelha papel/dto/PapelRequest.java (serve para POST e PUT). */
export interface PapelRequest {
  nome: string;
  descricao?: string;
  permissoes: Permissao[];
  /** Só o super admin informa: ele não tem produtor na sessão. */
  produtorId?: string;
}
