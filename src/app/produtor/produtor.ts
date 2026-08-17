import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Grid } from '../shared/components/grid/grid';
import { AcaoGrid, ColunaGrid } from '../shared/components/grid/grid.types';
import { mensagemDoErro } from '../shared/erro';
import { Modal } from '../shared/modal.service';
import { Toast } from '../shared/toast.service';
import { Produtor as ProdutorModel } from './models/produtor';
import { ProdutorService } from './produtor.service';

@Component({
  selector: 'app-produtor',
  imports: [FormsModule, MatButtonModule, MatIconModule, Grid],
  templateUrl: './produtor.html',
  styleUrl: './produtor.scss',
})
export class Produtor {
  private readonly produtorService = inject(ProdutorService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);

  private readonly grid = viewChild.required(Grid<ProdutorModel>);

  /** Id do registro cuja requisição ainda não voltou — trava só a linha dele. */
  protected readonly emOperacao = signal<string | null>(null);
  protected readonly termo = signal('');

  protected readonly entidade = 'Produtores';

  protected readonly filtro = computed(() => ({ termo: this.termo() }));

  protected readonly colunas: ColunaGrid<ProdutorModel>[] = [
    {
      field: 'nome',
      titulo: 'Produtor',
      ordenavel: true,
      avatar: (linha) => linha.nome.slice(0, 2),
      secundario: (linha) => formatarDocumento(linha),
    },
    {
      field: 'tipoPessoa',
      titulo: 'Tipo',
      largura: '10rem',
      valor: (linha) => (linha.tipoPessoa === 'PF' ? 'Pessoa física' : 'Pessoa jurídica'),
    },
    {
      field: 'ativo',
      titulo: 'Situação',
      largura: '10rem',
      valor: (linha) => (linha.ativo ? 'Ativo' : 'Inativo'),
      pill: (linha) => (linha.ativo ? 'verde' : 'vermelho'),
    },
  ];

  protected readonly acoes: AcaoGrid<ProdutorModel>[] = [
    {
      icone: 'edit',
      titulo: 'Editar',
      tom: 'primario',
      executar: (linha) => this.editar(linha),
    },
    {
      icone: (linha) => (linha.ativo ? 'block' : 'check_circle'),
      titulo: (linha) => (linha.ativo ? 'Inativar' : 'Reativar'),
      desabilitado: (linha) => this.emOperacao() === linha.id,
      executar: (linha) => this.alternarAtivo(linha),
    },
  ];

  /** A busca do grid. Referência estável: passa direto para o `[carregar]`. */
  protected readonly carregar = (parametros: Parameters<ProdutorService['paginar']>[0]) =>
    this.produtorService.paginar(parametros);

  protected inserir(): void {
    this.router.navigate(['/produtores', 'novo']);
  }

  protected editar(produtor: ProdutorModel): void {
    this.router.navigate(['/produtores', produtor.id]);
  }

  protected alternarAtivo(produtor: ProdutorModel): void {
    const inativando = produtor.ativo;
    const acao = inativando ? 'inativar' : 'reativar';

    this.modal
      .confirmation(
        `Deseja mesmo ${acao} o produtor ${produtor.nome}?` +
          (inativando ? ' Ninguém dele consegue mais entrar no sistema.' : ''),
        inativando ? { textoConfirmar: 'Inativar', perigo: true } : undefined,
      )
      .subscribe(() => {
        this.emOperacao.set(produtor.id);

        const requisicao = inativando
          ? this.produtorService.inativar(produtor.id)
          : this.produtorService.reativar(produtor.id);

        requisicao.subscribe({
          next: () => {
            this.toast.success(`Produtor ${inativando ? 'inativado' : 'reativado'} com sucesso`);
            this.grid().recarregar();
            this.after();
          },
          error: (erro) => this.onError(erro),
        });
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

/** CPF em `000.000.000-00`, CNPJ em `00.000.000/0000-00`. */
function formatarDocumento(produtor: ProdutorModel): string {
  const digitos = produtor.documento;

  if (produtor.tipoPessoa === 'PF') {
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
