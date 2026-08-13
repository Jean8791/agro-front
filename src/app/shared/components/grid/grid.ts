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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { mensagemDoErro } from '../../erro';
import { paginatorIntlPtBr } from '../../paginator-intl';
import {
  AcaoGrid,
  CarregarGrid,
  ColunaGrid,
  ModoPaginacao,
  PaginaGrid,
  ParametrosGrid,
} from './grid.types';

/**
 * Grid padrão das telas de listagem — o que o `Grid` faz .
 *
 * <p>Recebe as colunas, uma função que busca os dados e as ações que agem sobre
 * um registro, e cuida de paginação, quantidade por página, ordenação e estado
 * de carregando. A tela só declara o que aparece e chama `recarregar()` depois
 * de gravar algo.
 *
 * <p>As ações viram botões de ícone na própria linha: o alvo é sempre o
 * registro em que o ícone está, sem passo de "selecionar primeiro".
 *
 * ```html
 * <app-grid
 *   [colunas]="colunas"
 *   [acoes]="acoes"
 *   [carregar]="carregar"
 *   [filtro]="filtro()"
 *   modo="cliente" />
 * ```
 */
@Component({
  selector: 'app-grid',
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
  providers: [{ provide: MatPaginatorIntl, useFactory: paginatorIntlPtBr }],
})
// O id é só a identidade da linha (seleção e comparação). String cobre UUID,
// que é o formato do back; number continua servindo se algum dia voltar.
export class Grid<T extends { id: string | number }> {
  readonly colunas = input.required<ColunaGrid<T>[]>();
  readonly carregar = input.required<CarregarGrid<T>>();

  /**
   * Botões de ícone da coluna Ações. Vazio, ou nenhuma ação visível para as
   * linhas em tela, e a coluna inteira não aparece.
   */
  readonly acoes = input<AcaoGrid<T>[]>([]);

  /** Critérios extras enviados na busca. Mudou, volta para a primeira página. */
  readonly filtro = input<Record<string, unknown>>({});
  readonly modo = input<ModoPaginacao>('servidor');
  readonly quantidades = input<number[]>([5, 10, 25, 50, 100]);
  readonly mensagemVazia = input('Nenhum registro encontrado.');

  /**
   * Realça a linha clicada e emite `selecionou`. Só faz sentido quando a tela
   * precisa do registro fora das ações da linha — com `[acoes]`, não precisa.
   */
  readonly selecionavel = input(false);

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

  /** O que a tabela mostra: no modo cliente, a fatia da página atual. */
  protected readonly linhas = computed(() => {
    if (this.modo() === 'servidor') {
      return this.dados();
    }
    const inicio = this.pagina() * this.quantidade();
    return this.dados().slice(inicio, inicio + this.quantidade());
  });

  /**
   * Se a coluna Ações tem o que mostrar.
   *
   * <p>Com autorização por permissão, é comum toda ação de uma tela estar
   * escondida para quem só consulta — e aí a coluna sobraria como um título
   * sobre o vazio. Uma ação sem `visivel` conta como visível; as demais
   * precisam valer para ao menos uma linha em tela.
   */
  protected readonly temAcaoVisivel = computed(() =>
    this.acoes().some((acao) => {
      const visivel = acao.visivel;
      return visivel ? this.linhas().some((linha) => visivel(linha)) : true;
    }),
  );

  /** `acoes` é uma coluna sintética: entra por último e não vem de `colunas`. */
  protected readonly nomesDasColunas = computed(() => {
    const nomes = this.colunas().map((c) => c.field);
    return this.temAcaoVisivel() ? [...nomes, 'acoes'] : nomes;
  });

  /** Barras cinzas mostradas no lugar da tabela enquanto a busca não volta. */
  protected readonly esqueleto = computed(() =>
    Array.from({ length: Math.min(this.quantidade(), 6) }),
  );

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
    if (!this.selecionavel()) {
      return;
    }
    this.selecionar(this.selecionada()?.id === linha.id ? null : linha);
  }

  protected estaSelecionada(linha: T): boolean {
    return this.selecionavel() && this.selecionada()?.id === linha.id;
  }

  protected conteudoDaCelula(coluna: ColunaGrid<T>, linha: T): string {
    if (coluna.valor) {
      return coluna.valor(linha);
    }
    const bruto = (linha as Record<string, unknown>)[coluna.field];
    return bruto === null || bruto === undefined || bruto === '' ? '—' : String(bruto);
  }

  /** Resolve o que pode ser valor fixo ou função da linha (ícone e título). */
  protected resolver(valor: string | ((linha: T) => string), linha: T): string {
    return typeof valor === 'function' ? valor(linha) : valor;
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
