import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { Permissoes } from '../../auth/permissoes';
import { mensagemDoErro } from '../../shared/erro';
import { SePode } from '../../shared/se-pode';
import { Toast } from '../../shared/toast.service';
import { ChecklistService } from '../checklist/checklist.service';
import { ChecklistItem } from '../checklist/models/checklist-item';
import { ModuloProducao, ProdutoBase } from '../produto/models/produto';
import { ProdutoService } from '../produto/produto.service';
import { calcularPrecoMinimo } from './calculo';
import { FormularioCalculo, PRODUTO_PERSONALIZADO } from './models/simulacao';
import { SimulacaoService } from './simulacao.service';

@Component({
  selector: 'app-raiox-calculadora',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    RouterLink,
    SePode,
  ],
  templateUrl: './calculadora.html',
  styleUrl: './calculadora.scss',
})
export class Calculadora implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly produtoService = inject(ProdutoService);
  private readonly checklistService = inject(ChecklistService);
  private readonly simulacaoService = inject(SimulacaoService);
  private readonly toast = inject(Toast);
  protected readonly permissoes = inject(Permissoes);

  protected readonly carregandoBase = signal(false);
  protected readonly salvando = signal(false);
  protected readonly nomeSimulacao = signal('');

  protected readonly produtos = signal<ProdutoBase[]>([]);
  protected readonly checklist = signal<ChecklistItem[]>([]);
  protected readonly custosMarcados = signal<string[]>([]);

  protected readonly PRODUTO_PERSONALIZADO = PRODUTO_PERSONALIZADO;

  protected readonly form = this.fb.group({
    modulo: this.fb.nonNullable.control<ModuloProducao>('VEGETAL'),
    produtoSelecionado: this.fb.nonNullable.control(''),
    produtoPersonalizado: this.fb.nonNullable.control(''),
    regiao: this.fb.nonNullable.control('Brasil'),
    canalVenda: this.fb.nonNullable.control(''),
    unidadeTecnica: this.fb.nonNullable.control(''),
    unidadeComercial: this.fb.nonNullable.control(''),
    quantidadePorUnidade: this.fb.control<number | null>(null),
    precoEsperado: this.fb.control<number | null>(null),
    margemDesejadaPercent: this.fb.control<number | null>(20),
    reservaPercent: this.fb.control<number | null>(10),
    fonteCotacao: this.fb.nonNullable.control(''),
    dataCotacao: this.fb.nonNullable.control(''),
    area: this.fb.control<number | null>(null),
    produtividade: this.fb.control<number | null>(null),
    producaoBrutaInformada: this.fb.control<number | null>(null),
    perdaVegetalPercent: this.fb.control<number | null>(null),
    tipoProducaoAnimal: this.fb.nonNullable.control<'CONTINUA' | 'LOTE'>('CONTINUA'),
    quantidadeAnimais: this.fb.control<number | null>(null),
    producaoDiariaMedia: this.fb.control<number | null>(null),
    diasPeriodo: this.fb.control<number | null>(null),
    pesoMedioVenda: this.fb.control<number | null>(null),
    perdaMortalidadeAnimalPercent: this.fb.control<number | null>(null),
    custos: this.fb.group({
      insumos: this.fb.control<number | null>(null),
      aquisicao: this.fb.control<number | null>(null),
      maoDeObra: this.fb.control<number | null>(null),
      energia: this.fb.control<number | null>(null),
      sanidade: this.fb.control<number | null>(null),
      servicos: this.fb.control<number | null>(null),
      estrutura: this.fb.control<number | null>(null),
      embalagem: this.fb.control<number | null>(null),
      frete: this.fb.control<number | null>(null),
      outros: this.fb.control<number | null>(null),
      variavelPorUnidade: this.fb.control<number | null>(null),
    }),
  });

  /** Sinal do valor do form — o computed abaixo depende dele, não de `getRawValue()`. */
  private readonly valorForm = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /**
   * "Configurar base" cobre duas telas com permissões independentes —
   * mostra o link se a pessoa administra qualquer uma das duas.
   */
  protected readonly podeConfigurarBase = computed(
    () => this.permissoes.pode('raioxproduto:editar') || this.permissoes.pode('raioxchecklist:editar'),
  );

  protected readonly eVegetal = computed(() => {
    this.valorForm();
    return this.form.controls.modulo.value === 'VEGETAL';
  });

  protected readonly eContinua = computed(() => {
    this.valorForm();
    return this.form.controls.tipoProducaoAnimal.value === 'CONTINUA';
  });

  protected readonly produtoEhPersonalizado = computed(() => {
    this.valorForm();
    return this.form.controls.produtoSelecionado.value === PRODUTO_PERSONALIZADO;
  });

  protected readonly produtosDoModulo = computed(() => {
    this.valorForm();
    const modulo = this.form.controls.modulo.value;
    return this.produtos()
      .filter((produto) => produto.modulo === modulo)
      .sort((a, b) => a.produto.localeCompare(b.produto));
  });

  protected readonly checklistDoModulo = computed(() => {
    this.valorForm();
    const modulo = this.form.controls.modulo.value;
    return this.checklist().filter((item) => item.modulo === modulo || item.modulo === 'AMBOS');
  });

  protected readonly resultado = computed(() => {
    this.valorForm();
    return calcularPrecoMinimo(this.montarFormulario(this.form.getRawValue()));
  });

  ngOnInit(): void {
    this.carregandoBase.set(true);

    this.produtoService.query().subscribe({
      next: (produtos) => this.produtos.set(produtos),
      error: (erro) => this.toast.danger(mensagemDoErro(erro)),
      complete: () => this.carregandoBase.set(false),
    });

    this.checklistService.query().subscribe({
      next: (itens) => this.checklist.set(itens),
      error: (erro) => this.toast.danger(mensagemDoErro(erro)),
    });
  }

  protected aoSelecionarProduto(nomeOuSentinela: string): void {
    if (nomeOuSentinela === PRODUTO_PERSONALIZADO) {
      return;
    }

    const preset = this.produtosDoModulo().find((produto) => produto.produto === nomeOuSentinela);
    if (!preset) {
      return;
    }

    this.form.patchValue({
      unidadeTecnica: preset.unidadeTecnica,
      unidadeComercial: preset.unidadeComercial,
      quantidadePorUnidade: preset.quantidadePorUnidade,
      ...(preset.tipoProducaoAnimal ? { tipoProducaoAnimal: preset.tipoProducaoAnimal } : {}),
    });
  }

  protected alternarCustoMarcado(rotulo: string): void {
    this.custosMarcados.update((marcados) =>
      marcados.includes(rotulo) ? marcados.filter((r) => r !== rotulo) : [...marcados, rotulo],
    );
  }

  protected novaSimulacao(): void {
    this.form.reset({
      modulo: 'VEGETAL',
      produtoSelecionado: '',
      produtoPersonalizado: '',
      regiao: 'Brasil',
      canalVenda: '',
      unidadeTecnica: '',
      unidadeComercial: '',
      margemDesejadaPercent: 20,
      reservaPercent: 10,
      fonteCotacao: '',
      dataCotacao: '',
      tipoProducaoAnimal: 'CONTINUA',
      custos: {},
    });
    this.custosMarcados.set([]);
    this.nomeSimulacao.set('');
  }

  protected salvar(): void {
    const resultado = this.resultado();
    if (resultado.erros.length > 0 || this.salvando()) {
      return;
    }

    const nome = this.nomeSimulacao().trim();
    if (!nome) {
      this.toast.warning('Dê um nome para a simulação antes de salvar.');
      return;
    }

    const formulario = this.montarFormulario(this.form.getRawValue());
    const produto =
      formulario.produtoSelecionado === PRODUTO_PERSONALIZADO
        ? formulario.produtoPersonalizado.trim()
        : formulario.produtoSelecionado.trim();

    this.salvando.set(true);

    this.simulacaoService
      .salvar({
        nome,
        modulo: formulario.modulo,
        produto,
        semaforo: resultado.semaforo,
        precoMinimo: resultado.precoMinimo,
        formulario,
        resultado,
      })
      .subscribe({
        next: () => {
          this.toast.success('Simulação salva com sucesso');
          this.nomeSimulacao.set('');
          this.salvando.set(false);
        },
        error: (erro) => {
          this.toast.danger(mensagemDoErro(erro));
          this.salvando.set(false);
        },
      });
  }

  /** Junta o valor do form (achatado) com o que só existe como sinal (checklist marcado). */
  private montarFormulario(valor: ReturnType<typeof this.form.getRawValue>): FormularioCalculo {
    return {
      ...valor,
      custosMarcados: this.custosMarcados(),
    } as FormularioCalculo;
  }
}
