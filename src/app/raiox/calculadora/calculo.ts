import {
  CampoNumerico,
  CHAVES_CUSTO_FIXO,
  ChaveCusto,
  FormularioCalculo,
  PRODUTO_PERSONALIZADO,
  ResultadoCalculo,
  Semaforo,
} from './models/simulacao';

/**
 * Motor de cálculo do Raio-X — porta fiel de `lib/calculator.ts` do
 * protótipo `app_miniraiox_pronto` (função `calculateMinimumPrice`), só com
 * os nomes em português e `NumericField` (`number | ""`) trocado por
 * `CampoNumerico` (`number | null`). A lógica e a ordem das validações são
 * as mesmas — ver `calculo.spec.ts` para os casos que vieram do
 * `tests/calculator.test.ts` original.
 */

function numeroOuZero(valor: CampoNumerico): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

function positivo(valor: CampoNumerico): number | null {
  const normalizado = numeroOuZero(valor);
  return normalizado > 0 ? normalizado : null;
}

function fracao(valor: CampoNumerico): number {
  return numeroOuZero(valor) / 100;
}

function unicos(mensagens: string[]): string[] {
  return [...new Set(mensagens)];
}

function unidadeNormalizada(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/** Lote animal vendido por cabeça/unidade não precisa de peso médio. */
export function ehLoteAnimalPorUnidade(
  unidadeTecnica: string,
  unidadeComercial: string,
  quantidadePorUnidade: number | null,
): boolean {
  const rotulosDeUnidade = new Set(['unidade', 'unidades', 'cabeca', 'cabecas']);
  return (
    quantidadePorUnidade === 1 &&
    rotulosDeUnidade.has(unidadeNormalizada(unidadeTecnica)) &&
    rotulosDeUnidade.has(unidadeNormalizada(unidadeComercial))
  );
}

export function calcularPrecoMinimo(formulario: FormularioCalculo): ResultadoCalculo {
  const erros: string[] = [];
  const avisos: string[] = [];

  const quantidadePorUnidade = positivo(formulario.quantidadePorUnidade);
  const precoEsperado = positivo(formulario.precoEsperado);
  const margemDesejadaPercent = numeroOuZero(formulario.margemDesejadaPercent);
  const reservaPercent = numeroOuZero(formulario.reservaPercent);

  if (!formulario.unidadeComercial.trim()) {
    erros.push('Informe a unidade comercial de venda.');
  }
  if (!quantidadePorUnidade) {
    erros.push('A quantidade por unidade comercial deve ser maior que zero.');
  }
  if (!precoEsperado) {
    erros.push('O preço líquido esperado deve ser maior que zero.');
  }
  if (margemDesejadaPercent < 0) {
    erros.push('A margem desejada não pode ser negativa.');
  }
  if (reservaPercent < 0 || reservaPercent > 50) {
    erros.push('A reserva para imprevistos deve ficar entre 0% e 50%.');
  }

  const nomeProduto =
    formulario.produtoSelecionado === PRODUTO_PERSONALIZADO
      ? formulario.produtoPersonalizado.trim()
      : formulario.produtoSelecionado.trim();
  if (!nomeProduto) {
    avisos.push('Informe o produto ou atividade para identificar o cálculo.');
  }
  if (!formulario.fonteCotacao.trim()) {
    avisos.push('Preço sem fonte: valide a cotação antes de decidir.');
  }

  let producaoTecnicaBruta: number | null = null;
  let producaoTecnicaVendavel: number | null = null;

  if (formulario.modulo === 'VEGETAL') {
    const brutaInformada = positivo(formulario.producaoBrutaInformada);
    const area = positivo(formulario.area);
    const produtividade = positivo(formulario.produtividade);
    const percentPerda = numeroOuZero(formulario.perdaVegetalPercent);

    if (percentPerda < 0 || percentPerda > 80) {
      erros.push('A perda vegetal deve ficar entre 0% e 80%.');
    }

    producaoTecnicaBruta = brutaInformada ?? (area && produtividade ? area * produtividade : null);

    if (!producaoTecnicaBruta) {
      erros.push(
        'Informe a produção bruta ou preencha área e produtividade com valores maiores que zero.',
      );
    } else if (percentPerda >= 0 && percentPerda <= 80) {
      producaoTecnicaVendavel = producaoTecnicaBruta * (1 - percentPerda / 100);
    }

    if (formulario.perdaVegetalPercent === null) {
      avisos.push('Perda vegetal vazia: considerando 0%.');
    }
  } else {
    const quantidadeAnimais = positivo(formulario.quantidadeAnimais);
    const percentPerda = numeroOuZero(formulario.perdaMortalidadeAnimalPercent);

    if (!quantidadeAnimais) {
      erros.push('Informe o número de animais, matrizes ou colmeias.');
    }
    if (percentPerda < 0 || percentPerda >= 100) {
      erros.push('A perda ou mortalidade animal deve ficar entre 0% e menos de 100%.');
    }

    if (formulario.tipoProducaoAnimal === 'CONTINUA') {
      const producaoDiaria = positivo(formulario.producaoDiariaMedia);
      const dias = positivo(formulario.diasPeriodo);
      if (!producaoDiaria) {
        erros.push('Informe a produção média por animal ou colmeia no período diário.');
      }
      if (!dias) {
        erros.push('Informe a quantidade de dias do período.');
      }
      if (quantidadeAnimais && producaoDiaria && dias) {
        producaoTecnicaBruta = quantidadeAnimais * producaoDiaria * dias;
      }
    } else {
      const loteBaseadoEmUnidade = ehLoteAnimalPorUnidade(
        formulario.unidadeTecnica,
        formulario.unidadeComercial,
        quantidadePorUnidade,
      );

      if (loteBaseadoEmUnidade) {
        producaoTecnicaBruta = quantidadeAnimais;
      } else {
        const pesoMedio = positivo(formulario.pesoMedioVenda);
        if (!pesoMedio) {
          erros.push('Informe o peso médio de venda por animal.');
        }
        if (quantidadeAnimais && pesoMedio) {
          producaoTecnicaBruta = quantidadeAnimais * pesoMedio;
        }
      }
    }

    if (producaoTecnicaBruta && percentPerda >= 0 && percentPerda < 100) {
      producaoTecnicaVendavel = producaoTecnicaBruta * (1 - percentPerda / 100);
    }

    if (formulario.perdaMortalidadeAnimalPercent === null) {
      avisos.push('Perda animal vazia: considerando 0%.');
    }
  }

  const producaoComercial =
    producaoTecnicaVendavel && quantidadePorUnidade
      ? producaoTecnicaVendavel / quantidadePorUnidade
      : null;

  const custosInvalidos = Object.values(formulario.custos).some((valor) => numeroOuZero(valor) < 0);
  if (custosInvalidos) {
    erros.push('Os custos não podem conter valores negativos.');
  }

  const custosFixos = CHAVES_CUSTO_FIXO.reduce(
    (total: number, chave: ChaveCusto) => total + Math.max(0, numeroOuZero(formulario.custos[chave])),
    0,
  );
  const variavelPorUnidade = Math.max(0, numeroOuZero(formulario.custos.variavelPorUnidade));
  const custoBase =
    producaoComercial && !custosInvalidos ? custosFixos + variavelPorUnidade * producaoComercial : null;

  if (custosFixos <= 0 && variavelPorUnidade <= 0) {
    erros.push('Informe ao menos um custo do ciclo ou período.');
  }

  const valorReserva =
    custoBase !== null && reservaPercent >= 0 && reservaPercent <= 50
      ? custoBase * fracao(formulario.reservaPercent)
      : null;
  const custoTotal = custoBase !== null && valorReserva !== null ? custoBase + valorReserva : null;
  const precoMinimo =
    custoTotal !== null && producaoComercial && producaoComercial > 0
      ? custoTotal / producaoComercial
      : null;
  const precoAlvo =
    precoMinimo !== null && margemDesejadaPercent >= 0
      ? precoMinimo * (1 + fracao(formulario.margemDesejadaPercent))
      : null;
  const receitaEsperada =
    producaoComercial && precoEsperado ? producaoComercial * precoEsperado : null;
  const resultadoEstimado =
    receitaEsperada !== null && custoTotal !== null ? receitaEsperada - custoTotal : null;
  const margemSegurancaReal =
    precoEsperado && precoMinimo && precoMinimo > 0 ? precoEsperado / precoMinimo - 1 : null;

  let semaforo: Semaforo = 'FILL';
  let mensagem = 'Complete os dados obrigatórios antes de decidir.';
  let acao = 'Revise unidade, produção, custos e preço.';

  if (erros.length === 0 && precoEsperado !== null && precoMinimo !== null && precoAlvo !== null) {
    if (precoEsperado < precoMinimo) {
      semaforo = 'RED';
      mensagem = 'Venda ou produção com risco de prejuízo.';
      acao = 'Renegocie, reduza custos, mude o canal ou revise a produção.';
    } else if (precoEsperado < precoAlvo) {
      semaforo = 'YELLOW';
      mensagem = 'Cobre o custo, mas a folga é baixa.';
      acao = 'Busque preço melhor, reduza perdas ou corte custos.';
    } else {
      semaforo = 'GREEN';
      mensagem = 'Preço acima do mínimo com margem de segurança.';
      acao = 'Avance com controle e mantenha os dados atualizados.';
    }
  }

  return {
    producaoTecnicaBruta,
    producaoTecnicaVendavel,
    producaoComercial,
    custoBase,
    valorReserva,
    custoTotal,
    precoMinimo,
    precoAlvo,
    receitaEsperada,
    resultadoEstimado,
    margemSegurancaReal,
    semaforo,
    mensagem,
    acao,
    erros: unicos(erros),
    avisos: unicos(avisos),
  };
}
