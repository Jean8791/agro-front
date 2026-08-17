/** Espelha produtor/dto/ProdutorResponse.java. Ids são UUID, então string. */
export interface Produtor {
  id: string;
  nome: string;
  documento: string;
  tipoPessoa: TipoPessoa;
  ativo: boolean;
}

/** Espelha produtor/enums/TipoPessoa.java. */
export type TipoPessoa = 'PF' | 'PJ';

/** Espelha produtor/dto/ProdutorRequest.java — mesmo corpo em POST e PUT. */
export interface ProdutorRequest {
  nome: string;
  documento: string;
  tipoPessoa: TipoPessoa;
}
