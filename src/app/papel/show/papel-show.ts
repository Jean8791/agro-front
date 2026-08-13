import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';
import { Loader } from '../../shared/components/loader/loader';
import { mensagemDoErro } from '../../shared/erro';
import { Step } from '../../shared/models/step';
import { Toast } from '../../shared/toast.service';
import { Permissao, RecursoComAcoes } from '../models/permissao';
import { PapelService } from '../papel.service';

@Component({
  selector: 'app-papel-show',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    Breadcrumb,
    Loader,
  ],
  templateUrl: './papel-show.html',
  styleUrl: './papel-show.scss',
})
export class PapelShow implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly papelService = inject(PapelService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);

  /** As linhas da matriz, como o back as define. */
  protected readonly recursos = signal<RecursoComAcoes[]>([]);

  /** O que está marcado. Set porque a pergunta da tela é sempre "tem?". */
  protected readonly marcadas = signal<ReadonlySet<Permissao>>(new Set());

  /** Papel de sistema abre em leitura: dá para conferir, não para alterar. */
  protected readonly sistema = signal(false);

  /**
   * As colunas da matriz: os rótulos de ação que aparecem em algum recurso,
   * na ordem em que o back os declara. Sai daí, e não de uma lista fixa, para
   * que uma ação nova no back apareça sozinha — e para que uma coluna que
   * nenhum recurso usa não ocupe espaço.
   */
  protected readonly colunas = computed(() => {
    const vistas: string[] = [];
    for (const recurso of this.recursos()) {
      for (const acao of recurso.acoes) {
        if (!vistas.includes(acao.rotulo)) {
          vistas.push(acao.rotulo);
        }
      }
    }
    return vistas;
  });

  /** 'novo' na rota = inserção; qualquer outro valor é o id para edição. */
  private readonly uri = signal<string>('novo');
  protected readonly inserindo = computed(() => this.uri() === 'novo');

  protected readonly steps = computed<Step[]>(() => [
    { label: 'Papéis', url: '/papeis' },
    { label: this.inserindo() ? 'Inserir' : this.sistema() ? 'Ver' : 'Editar' },
  ]);

  protected readonly titulo = computed(() => {
    if (this.inserindo()) {
      return 'Novo papel';
    }
    return this.sistema() ? 'Papel do sistema' : 'Editar papel';
  });

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    descricao: [''],
  });

  ngOnInit(): void {
    this.uri.set(this.rota.snapshot.paramMap.get('uri') ?? 'novo');
    this.get();
  }

  private get(): void {
    this.loading.set(true);

    // a matriz e o papel chegam juntos: desenhar as linhas antes de saber o
    // que está marcado faria as caixas piscarem de vazias para marcadas
    forkJoin({
      recursos: this.papelService.permissoes(),
      papel: this.inserindo() ? of(null) : this.papelService.get(this.uri()),
    }).subscribe({
      next: ({ recursos, papel }) => {
        this.recursos.set(recursos);

        if (papel) {
          this.form.patchValue({ nome: papel.nome, descricao: papel.descricao ?? '' });
          this.marcadas.set(new Set(papel.permissoes));
          this.sistema.set(papel.sistema);

          if (papel.sistema) {
            this.form.disable();
          }
        }

        this.after();
      },
      error: (erro) => this.onError(erro),
    });
  }

  /**
   * A permissão no cruzamento de uma linha com uma coluna, ou null quando
   * aquele recurso não admite a ação — "bloquear" só existe para usuário, e a
   * célula vazia diz isso melhor do que uma caixa que não faz nada.
   */
  protected permissaoDe(recurso: RecursoComAcoes, rotuloDaAcao: string): Permissao | null {
    return recurso.acoes.find((acao) => acao.rotulo === rotuloDaAcao)?.permissao ?? null;
  }

  protected marcada(permissao: Permissao): boolean {
    return this.marcadas().has(permissao);
  }

  protected alternar(permissao: Permissao, marcar: boolean): void {
    this.marcadas.update((atual) => {
      const proximo = new Set(atual);
      if (marcar) {
        proximo.add(permissao);
      } else {
        proximo.delete(permissao);
      }
      return proximo;
    });
  }

  /**
   * Marca ou desmarca a linha inteira de um recurso. É o atalho que faz a
   * matriz valer a pena quando o recurso tem cinco ações.
   */
  protected alternarRecurso(recurso: RecursoComAcoes, marcar: boolean): void {
    this.marcadas.update((atual) => {
      const proximo = new Set(atual);
      for (const acao of recurso.acoes) {
        if (marcar) {
          proximo.add(acao.permissao);
        } else {
          proximo.delete(acao.permissao);
        }
      }
      return proximo;
    });
  }

  protected recursoInteiroMarcado(recurso: RecursoComAcoes): boolean {
    return recurso.acoes.every((acao) => this.marcada(acao.permissao));
  }

  protected recursoParcialmenteMarcado(recurso: RecursoComAcoes): boolean {
    const marcadas = recurso.acoes.filter((acao) => this.marcada(acao.permissao)).length;
    return marcadas > 0 && marcadas < recurso.acoes.length;
  }

  protected salvar(): void {
    if (this.sistema()) {
      return;
    }

    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    const valor = this.form.getRawValue();
    const corpo = {
      nome: valor.nome,
      descricao: valor.descricao || undefined,
      permissoes: [...this.marcadas()],
    };

    const requisicao = this.inserindo()
      ? this.papelService.salvar(corpo)
      : this.papelService.editar(this.uri(), corpo);

    requisicao.subscribe({
      next: () => {
        this.toast.success(`Papel ${this.inserindo() ? 'inserido' : 'alterado'} com sucesso`);
        this.voltar();
      },
      error: (erro) => this.onError(erro),
    });
  }

  protected voltar(): void {
    this.router.navigate(['/papeis']);
  }

  private onError(erro: unknown): void {
    this.toast.danger(mensagemDoErro(erro));
    this.after();
  }

  private after(): void {
    this.loading.set(false);
    this.salvando.set(false);
  }
}
