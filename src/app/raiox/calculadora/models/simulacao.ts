import { ModuloProducao, TipoProducaoAnimal } from '../../produto/models/produto';

export type { ModuloProducao, TipoProducaoAnimal };

/** Campo numérico de formulário: vazio antes de preencher, nunca `NaN`. */
export type CampoNumerico = number | null;

/** Espelha raiox/simulacao/calculo/Custos.java. */
export interface Custos {
  insumos: CampoNumerico;
  aquisicao: CampoNumerico;
  maoDeObra: CampoNumerico;
  energia: CampoNumerico;
  sanidade: CampoNumerico;
  servicos: CampoNumerico;
  estrutura: CampoNumerico;
  embalagem: CampoNumerico;
  frete: CampoNumerico;
  outros: CampoNumerico;
  variavelPorUnidade: CampoNumerico;
}

/**
 * O que a tela da calculadora preenche. Espelha
 * raiox/simulacao/calculo/FormularioCalculo.java: o back calcula a partir
 * disto e grava como veio, num jsonb.
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

/** Espelha raiox/simulacao/calculo/ResultadoCalculo.java — calculado só no back. */
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

/**
 * Espelha raiox/simulacao/dto/SimulacaoRequest.java. Só nome e formulário:
 * o back recalcula o resultado ao salvar e ignora qualquer resultado mandado.
 */
export interface SimulacaoRequest {
  nome: string;
  formulario: FormularioCalculo;
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
