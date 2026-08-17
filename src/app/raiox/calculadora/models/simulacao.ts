import { ModuloProducao, TipoProducaoAnimal } from '../../produto/models/produto';

export type { ModuloProducao, TipoProducaoAnimal };

/** Campo numérico de formulário: vazio antes de preencher, nunca `NaN`. */
export type CampoNumerico = number | null;

export const CHAVES_CUSTO_FIXO = [
  'insumos',
  'aquisicao',
  'maoDeObra',
  'energia',
  'sanidade',
  'servicos',
  'estrutura',
  'embalagem',
  'frete',
  'outros',
] as const;

export type ChaveCusto = (typeof CHAVES_CUSTO_FIXO)[number] | 'variavelPorUnidade';

export type Custos = Record<ChaveCusto, CampoNumerico>;

/**
 * O que a tela da calculadora preenche. Não é DTO de back — o back grava
 * isto como está, num jsonb, sem reconstruir os tipos (ver
 * SimulacaoRequest.java). Porta de `CalculatorForm` do protótipo original,
 * com os nomes em português e `""` trocado por `null` nos campos numéricos.
 */
export interface FormularioCalculo {
  modulo: ModuloProducao;
  produtoSelecionado: string;
  produtoPersonalizado: string;
  regiao: string;
  canalVenda: string;
  unidadeTecnica: string;
  unidadeComercial: string;
  quantidadePorUnidade: CampoNumerico;
  precoEsperado: CampoNumerico;
  margemDesejadaPercent: CampoNumerico;
  reservaPercent: CampoNumerico;
  fonteCotacao: string;
  dataCotacao: string;
  area: CampoNumerico;
  produtividade: CampoNumerico;
  producaoBrutaInformada: CampoNumerico;
  perdaVegetalPercent: CampoNumerico;
  tipoProducaoAnimal: TipoProducaoAnimal;
  quantidadeAnimais: CampoNumerico;
  producaoDiariaMedia: CampoNumerico;
  diasPeriodo: CampoNumerico;
  pesoMedioVenda: CampoNumerico;
  perdaMortalidadeAnimalPercent: CampoNumerico;
  custos: Custos;
  custosMarcados: string[];
}

/** Sentinel de "produto ou atividade" quando não veio do catálogo. */
export const PRODUTO_PERSONALIZADO = '__personalizado__';

/** Espelha raiox/simulacao/enums/Semaforo.java. */
export type Semaforo = 'FILL' | 'RED' | 'YELLOW' | 'GREEN';

/** Porta de `CalculationResult` do protótipo original, nomes em português. */
export interface ResultadoCalculo {
  producaoTecnicaBruta: number | null;
  producaoTecnicaVendavel: number | null;
  producaoComercial: number | null;
  custoBase: number | null;
  valorReserva: number | null;
  custoTotal: number | null;
  precoMinimo: number | null;
  precoAlvo: number | null;
  receitaEsperada: number | null;
  resultadoEstimado: number | null;
  margemSegurancaReal: number | null;
  semaforo: Semaforo;
  mensagem: string;
  acao: string;
  erros: string[];
  avisos: string[];
}

/** Espelha raiox/simulacao/dto/SimulacaoRequest.java. */
export interface SimulacaoRequest {
  nome: string;
  modulo: ModuloProducao;
  produto: string;
  semaforo: Semaforo;
  precoMinimo: number | null;
  formulario: FormularioCalculo;
  resultado: ResultadoCalculo;
  produtorId?: string;
}

/** Espelha raiox/simulacao/dto/SimulacaoResponse.java. */
export interface Simulacao {
  id: string;
  nome: string;
  modulo: ModuloProducao;
  produto: string;
  semaforo: Semaforo;
  precoMinimo: number | null;
  formulario: FormularioCalculo;
  resultado: ResultadoCalculo;
  criadoEm: string;
}
