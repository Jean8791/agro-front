import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Permissoes } from '../auth/permissoes';
import { Grid } from '../shared/components/grid/grid';
import { AcaoGrid, ColunaGrid } from '../shared/components/grid/grid.types';
import { mensagemDoErro } from '../shared/erro';
import { Modal } from '../shared/modal.service';
import { SePode } from '../shared/se-pode';
import { TenantContext } from '../shared/tenant';
import { Toast } from '../shared/toast.service';
import { Papel as PapelModel } from './models/papel';
import { PapelService } from './papel.service';

@Component({
  selector: 'app-papel',
  imports: [FormsModule, MatButtonModule, MatIconModule, Grid, SePode],
  templateUrl: './papel.html',
  styleUrl: './papel.scss',
})
export class Papel {
  private readonly papelService = inject(PapelService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);
  private readonly auth = inject(AuthService);
  private readonly permissoes = inject(Permissoes);
  private readonly tenant = inject(TenantContext);

  private readonly grid = viewChild.required(Grid<PapelModel>);

  /** Id do registro cuja requisição ainda não voltou — trava só a linha dele. */
  protected readonly emOperacao = signal<string | null>(null);
  protected readonly termo = signal('');

  protected readonly entidade = 'Papéis';

  /**
   * Super admin sem produtor escolhido: o back responderia "Informe o
   * produtor" em toda chamada, então a tela pede a escolha em vez de tentar.
   */
  protected readonly precisaEscolherProdutor = computed(
    () => this.auth.usuario()?.superAdmin === true && this.tenant.produtor() === null,
  );

  protected readonly filtro = computed(() => ({
    termo: this.termo(),
    produtorId: this.tenant.produtor()?.id ?? null,
  }));

  protected readonly colunas: ColunaGrid<PapelModel>[] = [
    {
      field: 'nome',
      titulo: 'Papel',
      ordenavel: true,
      avatar: (linha) => linha.nome.slice(0, 2),
      secundario: (linha) => linha.descricao ?? 'Sem descrição',
    },
    {
      field: 'permissoes',
      titulo: 'Permissões',
      largura: '12rem',
      valor: (linha) => rotuloDaContagem(linha.permissoes.length),
    },
    {
      field: 'sistema',
      titulo: 'Origem',
      largura: '10rem',
      valor: (linha) => (linha.sistema ? 'Do sistema' : 'Deste produtor'),
      pill: (linha) => (linha.sistema ? 'cinza' : 'azul'),
    },
  ];

  protected readonly acoes: AcaoGrid<PapelModel>[] = [
    {
      // papel de sistema abre em modo leitura: dá para conferir o que ele
      // permite sem poder mexer
      icone: (linha) => (this.podeEditar(linha) ? 'edit' : 'visibility'),
      titulo: (linha) => (this.podeEditar(linha) ? 'Editar' : 'Ver permissões'),
      tom: 'primario',
      executar: (linha) => this.editar(linha),
    },
    {
      icone: 'delete',
      titulo: 'Excluir',
      tom: 'perigo',
      visivel: (linha) => this.podeEditar(linha) && this.permissoes.pode('papel:excluir'),
      desabilitado: (linha) => this.emOperacao() === linha.id,
      executar: (linha) => this.excluir(linha),
    },
  ];

  /** A busca do grid. Referência estável: passa direto para o `[carregar]`. */
  protected readonly carregar = (parametros: Parameters<PapelService['paginar']>[0]) =>
    this.papelService.paginar(parametros);

  protected inserir(): void {
    this.router.navigate(['/papeis', 'novo']);
  }

  protected editar(papel: PapelModel): void {
    this.router.navigate(['/papeis', papel.id]);
  }

  protected excluir(papel: PapelModel): void {
    this.modal
      .confirmation(
        `Deseja mesmo excluir o papel ${papel.nome}? Quem o exerce hoje precisa receber outro antes.`,
        { textoConfirmar: 'Excluir', perigo: true },
      )
      .subscribe(() => {
        this.emOperacao.set(papel.id);

        this.papelService.excluir(papel.id).subscribe({
          next: () => {
            this.toast.success('Papel excluído com sucesso');
            this.grid().recarregar();
            this.after();
          },
          error: (erro) => this.onError(erro),
        });
      });
  }

  /** Papel de sistema é de todos e de ninguém: nem o super admin o altera. */
  private podeEditar(papel: PapelModel): boolean {
    return !papel.sistema && this.permissoes.pode('papel:editar');
  }

  private onError(erro: unknown): void {
    this.toast.danger(mensagemDoErro(erro));
    this.after();
  }

  private after(): void {
    this.emOperacao.set(null);
  }
}

function rotuloDaContagem(quantas: number): string {
  if (quantas === 0) {
    return 'Nenhuma';
  }
  return quantas === 1 ? '1 permissão' : `${quantas} permissões`;
}
