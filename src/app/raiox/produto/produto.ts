import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { Permissoes } from '../../auth/permissoes';
import { Grid } from '../../shared/components/grid/grid';
import { AcaoGrid, ColunaGrid } from '../../shared/components/grid/grid.types';
import { mensagemDoErro } from '../../shared/erro';
import { Modal } from '../../shared/modal.service';
import { SePode } from '../../shared/se-pode';
import { TenantContext } from '../../shared/tenant';
import { Toast } from '../../shared/toast.service';
import { ProdutoBase } from './models/produto';
import { ProdutoService } from './produto.service';

@Component({
  selector: 'app-raiox-produto',
  imports: [FormsModule, MatButtonModule, MatIconModule, RouterLink, Grid, SePode],
  templateUrl: './produto.html',
  styleUrl: './produto.scss',
})
export class Produto {
  private readonly produtoService = inject(ProdutoService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);
  private readonly auth = inject(AuthService);
  private readonly permissoes = inject(Permissoes);
  private readonly tenant = inject(TenantContext);

  private readonly grid = viewChild.required(Grid<ProdutoBase>);

  protected readonly emOperacao = signal<string | null>(null);
  protected readonly termo = signal('');
  protected readonly semeando = signal(false);

  protected readonly entidade = 'Catálogo do Raio-X';

  protected readonly precisaEscolherProdutor = computed(
    () => this.auth.usuario()?.superAdmin === true && this.tenant.produtor() === null,
  );

  protected readonly filtro = computed(() => ({
    termo: this.termo(),
    produtorId: this.tenant.produtor()?.id ?? null,
  }));

  protected readonly colunas: ColunaGrid<ProdutoBase>[] = [
    {
      field: 'produto',
      titulo: 'Produto',
      ordenavel: true,
      avatar: (linha) => linha.produto.slice(0, 2),
      secundario: (linha) => linha.categoria,
    },
    {
      field: 'modulo',
      titulo: 'Módulo',
      largura: '9rem',
      valor: (linha) => (linha.modulo === 'VEGETAL' ? 'Vegetal' : 'Animal'),
    },
    {
      field: 'unidadeComercial',
      titulo: 'Unidade comercial',
      largura: '12rem',
      valor: (linha) => `${linha.unidadeComercial} (${linha.quantidadePorUnidade} ${linha.unidadeTecnica})`,
    },
    {
      field: 'unidadePreco',
      titulo: 'Preço em',
      largura: '10rem',
      valor: (linha) => linha.unidadePreco,
    },
  ];

  protected readonly acoes: AcaoGrid<ProdutoBase>[] = [
    {
      icone: 'edit',
      titulo: 'Editar',
      tom: 'primario',
      visivel: () => this.permissoes.pode('raioxproduto:editar'),
      executar: (linha) => this.editar(linha),
    },
    {
      icone: 'delete',
      titulo: 'Excluir',
      tom: 'perigo',
      visivel: () => this.permissoes.pode('raioxproduto:excluir'),
      desabilitado: (linha) => this.emOperacao() === linha.id,
      executar: (linha) => this.excluir(linha),
    },
  ];

  protected readonly carregar = (parametros: Parameters<ProdutoService['paginar']>[0]) =>
    this.produtoService.paginar(parametros);

  protected inserir(): void {
    this.router.navigate(['/raiox/produtos', 'novo']);
  }

  protected editar(produto: ProdutoBase): void {
    this.router.navigate(['/raiox/produtos', produto.id]);
  }

  protected excluir(produto: ProdutoBase): void {
    this.modal
      .confirmation(`Deseja mesmo excluir "${produto.produto}" do catálogo?`, {
        textoConfirmar: 'Excluir',
        perigo: true,
      })
      .subscribe(() => {
        this.emOperacao.set(produto.id);

        this.produtoService.excluir(produto.id).subscribe({
          next: () => {
            this.toast.success('Produto excluído com sucesso');
            this.grid().recarregar();
            this.after();
          },
          error: (erro) => this.onError(erro),
        });
      });
  }

  protected semearPadrao(): void {
    this.semeando.set(true);

    this.produtoService.semearPadrao().subscribe({
      next: () => {
        this.toast.success('Catálogo padrão importado com sucesso');
        this.grid().recarregar();
        this.semeando.set(false);
      },
      error: (erro) => {
        this.toast.danger(mensagemDoErro(erro));
        this.semeando.set(false);
      },
    });
  }

  private onError(erro: unknown): void {
    this.toast.danger(mensagemDoErro(erro));
    this.after();
  }

  private after(): void {
    this.emOperacao.set(null);
  }
}
