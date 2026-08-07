import {
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { mensagemDoErro } from '../../erro';
import { paginatorIntlPtBr } from '../../paginator-intl';
import {
  CarregarGrid,
  ColunaGrid,
  ModoPaginacao,
  PaginaGrid,
  ParametrosGrid,
} from './grid.types';

/**
 * Grid padrão das telas de listagem — o que o `Grid` faz .
 *
 * <p>Recebe as colunas e uma função que busca os dados, e cuida de paginação,
 * quantidade por página, ordenação, seleção de linha e estado de carregando.
 * A tela não mexe em nenhum desses controles: só reage ao que foi selecionado
 * e chama `recarregar()` depois de gravar algo.
 *
 * ```html
 * <app-grid
 *   [colunas]="colunas"
 *   [carregar]="carregar"
 *   [filtro]="filtro()"
 *   modo="cliente"
 *   (selecionou)="linhaSelecionada.set($event)" />
 * ```
 */
@Component({
  selector: 'app-grid',
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatProgressBarModule],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
  providers: [{ provide: MatPaginatorIntl, useFactory: paginatorIntlPtBr }],
})
// O id é só a identidade da linha (seleção e comparação). String cobre UUID,
// que é o formato do back; number continua servindo se algum dia voltar.
export class Grid<T extends { id: string | number }> {
  readonly colunas = input.required<ColunaGrid<T>[]>();
  readonly carregar = input.required<CarregarGrid<T>>();

  /** Critérios extras enviados na busca. Mudou, volta para a primeira página. */
  readonly filtro = input<Record<string, unknown>>({});
  readonly modo = input<ModoPaginacao>('servidor');
  readonly quantidades = input<number[]>([5, 10, 25, 50, 100]);
  readonly mensagemVazia = input('Nenhum registro encontrado.');

  readonly selecionou = output<T | null>();

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly selecionada = signal<T | null>(null);
  protected readonly total = signal(0);
  protected readonly ordenacao = signal<string | undefined>(undefined);

  /** Volta para a quantidade padrão sempre que a lista de opções muda. */
  protected readonly quantidade = linkedSignal(() => this.quantidades()[0]);

  /**
   * Página atual. Filtrar ou reordenar joga de volta para a primeira — ficar
   * na página 4 depois de pesquisar deixaria a tela vazia sem explicação.
   */
  protected readonly pagina = linkedSignal<unknown, number>({
    source: () => [this.filtro(), this.ordenacao()],
    computation: () => 0,
  });

  /** Tudo que veio do servidor. No modo cliente, é a lista inteira. */
  private readonly dados = signal<T[]>([]);

  protected readonly nomesDasColunas = computed(() => this.colunas().map((c) => c.field));

  /** O que a tabela mostra: no modo cliente, a fatia da página atual. */
  protected readonly linhas = computed(() => {
    if (this.modo() === 'servidor') {
      return this.dados();
    }
    const inicio = this.pagina() * this.quantidade();
    return this.dados().slice(inicio, inicio + this.quantidade());
  });

  constructor() {
    // Refaz a busca quando muda filtro, página, quantidade ou ordenação. No
    // modo cliente só o filtro e a ordenação disparam ida ao servidor — o
    // resto é fatiado em memória.
    effect(() => {
      this.filtro();
      this.ordenacao();
      if (this.modo() === 'servidor') {
        this.pagina();
        this.quantidade();
      }
      untracked(() => this.buscar());
    });
  }

  /** Recarrega mantendo página e filtro — o `refresh()` do Grid. */
  recarregar(): void {
    this.buscar();
  }

  /** Limpa a seleção e volta para a primeira página. */
  reiniciar(): void {
    this.selecionar(null);
    this.pagina.set(0);
  }

  protected trocarPagina(evento: PageEvent): void {
    this.quantidade.set(evento.pageSize);
    this.pagina.set(evento.pageIndex);
    this.selecionar(null);
  }

  protected ordenar(evento: Sort): void {
    this.ordenacao.set(evento.direction ? `${evento.active},${evento.direction}` : undefined);
    this.pagina.set(0);
  }

  protected clicarNaLinha(linha: T): void {
    this.selecionar(this.selecionada()?.id === linha.id ? null : linha);
  }

  protected estaSelecionada(linha: T): boolean {
    return this.selecionada()?.id === linha.id;
  }

  protected conteudoDaCelula(coluna: ColunaGrid<T>, linha: T): string {
    if (coluna.valor) {
      return coluna.valor(linha);
    }
    const bruto = (linha as Record<string, unknown>)[coluna.field];
    return bruto === null || bruto === undefined || bruto === '' ? '—' : String(bruto);
  }

  private selecionar(linha: T | null): void {
    this.selecionada.set(linha);
    this.selecionou.emit(linha);
  }

  private buscar(): void {
    const clienteBuscaTudo = this.modo() === 'cliente';

    const parametros: ParametrosGrid = {
      offset: clienteBuscaTudo ? 0 : this.pagina() * this.quantidade(),
      limit: clienteBuscaTudo ? 0 : this.quantidade(),
      sort: this.ordenacao(),
      ...this.filtro(),
    };

    this.carregando.set(true);
    this.erro.set(null);
    this.selecionar(null);

    this.carregar()(parametros).subscribe({
      next: (pagina: PaginaGrid<T>) => {
        this.dados.set(pagina.conteudo);
        this.total.set(pagina.total);
        this.carregando.set(false);

        // uma exclusão pode ter esvaziado a última página
        const ultimaPagina = Math.max(0, Math.ceil(pagina.total / this.quantidade()) - 1);
        if (this.pagina() > ultimaPagina) {
          this.pagina.set(ultimaPagina);
        }
      },
      error: (falha) => {
        this.dados.set([]);
        this.total.set(0);
        this.erro.set(mensagemDoErro(falha));
        this.carregando.set(false);
      },
    });
  }
}
