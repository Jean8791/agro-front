import { calcularPrecoMinimo } from './calculo';
import { FormularioCalculo } from './models/simulacao';

/**
 * Casos portados de `tests/calculator.test.ts` do protótipo original
 * (`app_miniraiox_pronto`), com os nomes de campo traduzidos — a lógica é a
 * mesma, ver `calculo.ts`.
 */
function formularioAlface(): FormularioCalculo {
  return {
    modulo: 'VEGETAL',
    produtoSelecionado: 'Alface',
    produtoPersonalizado: '',
    regiao: 'Brasil',
    canalVenda: 'Feira',
    unidadeTecnica: 'cabeça',
    unidadeComercial: 'caixa',
    quantidadePorUnidade: 20,
    precoEsperado: 70,
    margemDesejadaPercent: 20,
    reservaPercent: 10,
    fonteCotacao: 'Comprador',
    dataCotacao: '2026-07-11',
    area: 1000,
    produtividade: null,
    producaoBrutaInformada: 1000,
    perdaVegetalPercent: 12,
    tipoProducaoAnimal: 'CONTINUA',
    quantidadeAnimais: null,
    producaoDiariaMedia: null,
    diasPeriodo: null,
    pesoMedioVenda: null,
    perdaMortalidadeAnimalPercent: null,
    custos: {
      insumos: 950,
      aquisicao: 0,
      maoDeObra: 600,
      energia: 120,
      sanidade: 0,
      servicos: 0,
      estrutura: 200,
      embalagem: 176,
      frete: 220,
      outros: 50,
      variavelPorUnidade: 0,
    },
    custosMarcados: [],
  };
}

describe('calcularPrecoMinimo', () => {
  it('reproduz o exemplo validado de alface', () => {
    const resultado = calcularPrecoMinimo(formularioAlface());

    expect(resultado.producaoTecnicaBruta).toBe(1000);
    expect(resultado.producaoTecnicaVendavel).toBe(880);
    expect(resultado.producaoComercial).toBe(44);
    expect(resultado.custoBase).toBe(2316);
    expect(resultado.custoTotal).toBeCloseTo(2547.6, 9);
    expect(resultado.precoMinimo).toBeCloseTo(57.9, 9);
    expect(resultado.precoAlvo ?? 0).toBeCloseTo(69.48, 9);
    expect(resultado.receitaEsperada).toBe(3080);
    expect(resultado.resultadoEstimado ?? 0).toBeCloseTo(532.4, 9);
    expect(resultado.semaforo).toBe('GREEN');
    expect(resultado.erros).toEqual([]);
  });

  it('classifica como vermelho quando o preço não cobre o custo', () => {
    const formulario = formularioAlface();
    formulario.precoEsperado = 50;

    const resultado = calcularPrecoMinimo(formulario);

    expect(resultado.semaforo).toBe('RED');
    expect(resultado.resultadoEstimado ?? 0).toBeLessThan(0);
  });

  it('classifica como amarelo entre preço mínimo e preço alvo', () => {
    const formulario = formularioAlface();
    formulario.precoEsperado = 60;

    const resultado = calcularPrecoMinimo(formulario);

    expect(resultado.semaforo).toBe('YELLOW');
    expect(resultado.resultadoEstimado ?? 0).toBeGreaterThan(0);
  });

  it('calcula produção animal por lote com mortalidade', () => {
    const formulario = formularioAlface();
    formulario.modulo = 'ANIMAL';
    formulario.produtoSelecionado = 'Tilápia';
    formulario.unidadeTecnica = 'kg';
    formulario.unidadeComercial = 'kg';
    formulario.quantidadePorUnidade = 1;
    formulario.tipoProducaoAnimal = 'LOTE';
    formulario.quantidadeAnimais = 1000;
    formulario.pesoMedioVenda = 0.9;
    formulario.perdaMortalidadeAnimalPercent = 10;
    formulario.precoEsperado = 15;
    formulario.reservaPercent = 0;

    const resultado = calcularPrecoMinimo(formulario);

    expect(resultado.producaoTecnicaBruta).toBe(900);
    expect(resultado.producaoTecnicaVendavel).toBe(810);
    expect(resultado.producaoComercial).toBe(810);
    expect(resultado.erros).toEqual([]);
  });

  it('bloqueia o semáforo quando faltam dados obrigatórios', () => {
    const formulario = formularioAlface();
    formulario.quantidadePorUnidade = null;
    formulario.producaoBrutaInformada = null;
    formulario.area = null;
    formulario.produtividade = null;

    const resultado = calcularPrecoMinimo(formulario);

    expect(resultado.semaforo).toBe('FILL');
    expect(resultado.erros.length).toBeGreaterThanOrEqual(2);
    expect(resultado.precoMinimo).toBeNull();
  });

  it('calcula lote animal vendido por cabeça sem exigir peso', () => {
    const formulario = formularioAlface();
    formulario.modulo = 'ANIMAL';
    formulario.produtoSelecionado = 'Bezerro';
    formulario.unidadeTecnica = 'cabeça';
    formulario.unidadeComercial = 'cabeça';
    formulario.quantidadePorUnidade = 1;
    formulario.tipoProducaoAnimal = 'LOTE';
    formulario.quantidadeAnimais = 20;
    formulario.pesoMedioVenda = null;
    formulario.perdaMortalidadeAnimalPercent = 5;
    formulario.precoEsperado = 1800;
    formulario.reservaPercent = 0;

    const resultado = calcularPrecoMinimo(formulario);

    expect(resultado.producaoTecnicaBruta).toBe(20);
    expect(resultado.producaoTecnicaVendavel).toBe(19);
    expect(resultado.producaoComercial).toBe(19);
    expect(resultado.erros).toEqual([]);
  });
});
