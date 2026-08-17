/** Espelha raiox/produto/enums/ModuloProducao.java. */
export type ModuloProducao = 'VEGETAL' | 'ANIMAL';

/** Espelha raiox/produto/enums/TipoProducaoAnimal.java. */
export type TipoProducaoAnimal = 'CONTINUA' | 'LOTE';

/** Espelha raiox/produto/dto/ProdutoBaseResponse.java. */
export interface ProdutoBase {
  id: string;
  modulo: ModuloProducao;
  categoria: string;
  produto: string;
  unidadeTecnica: string;
  unidadeComercial: string;
  quantidadePorUnidade: number;
  unidadePreco: string;
  tipoProducaoAnimal: TipoProducaoAnimal | null;
  nota: string;
  fonte: string;
}

/** Espelha raiox/produto/dto/ProdutoBaseRequest.java. */
export interface ProdutoBaseRequest {
  modulo: ModuloProducao;
  categoria: string;
  produto: string;
  unidadeTecnica: string;
  unidadeComercial: string;
  quantidadePorUnidade: number;
  unidadePreco: string;
  tipoProducaoAnimal: TipoProducaoAnimal | null;
  nota: string;
  fonte: string;
}
