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
import { ChecklistService } from './checklist.service';
import { ChecklistItem } from './models/checklist-item';

const ROTULO_MODULO: Record<ChecklistItem['modulo'], string> = {
  VEGETAL: 'Vegetal',
  ANIMAL: 'Animal',
  AMBOS: 'Ambos',
};

@Component({
  selector: 'app-raiox-checklist',
  imports: [FormsModule, MatButtonModule, MatIconModule, RouterLink, Grid, SePode],
  templateUrl: './checklist.html',
  styleUrl: './checklist.scss',
})
export class Checklist {
  private readonly checklistService = inject(ChecklistService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);
  private readonly auth = inject(AuthService);
  private readonly permissoes = inject(Permissoes);
  private readonly tenant = inject(TenantContext);

  private readonly grid = viewChild.required(Grid<ChecklistItem>);

  protected readonly emOperacao = signal<string | null>(null);
  protected readonly termo = signal('');

  protected readonly entidade = 'Checklist de custos do Raio-X';

  protected readonly precisaEscolherProdutor = computed(
    () => this.auth.usuario()?.superAdmin === true && this.tenant.produtor() === null,
  );

  protected readonly filtro = computed(() => ({
    termo: this.termo(),
    produtorId: this.tenant.produtor()?.id ?? null,
  }));

  protected readonly colunas: ColunaGrid<ChecklistItem>[] = [
    {
      field: 'rotulo',
      titulo: 'Custo',
      ordenavel: true,
      avatar: (linha) => linha.rotulo.slice(0, 2),
      secundario: (linha) => linha.nota,
    },
    {
      field: 'modulo',
      titulo: 'Módulo',
      largura: '9rem',
      valor: (linha) => ROTULO_MODULO[linha.modulo],
    },
  ];

  protected readonly acoes: AcaoGrid<ChecklistItem>[] = [
    {
      icone: 'edit',
      titulo: 'Editar',
      tom: 'primario',
      visivel: () => this.permissoes.pode('raioxchecklist:editar'),
      executar: (linha) => this.editar(linha),
    },
    {
      icone: 'delete',
      titulo: 'Excluir',
      tom: 'perigo',
      visivel: () => this.permissoes.pode('raioxchecklist:excluir'),
      desabilitado: (linha) => this.emOperacao() === linha.id,
      executar: (linha) => this.excluir(linha),
    },
  ];

  protected readonly carregar = (parametros: Parameters<ChecklistService['paginar']>[0]) =>
    this.checklistService.paginar(parametros);

  protected inserir(): void {
    this.router.navigate(['/raiox/checklist', 'novo']);
  }

  protected editar(item: ChecklistItem): void {
    this.router.navigate(['/raiox/checklist', item.id]);
  }

  protected excluir(item: ChecklistItem): void {
    this.modal
      .confirmation(`Deseja mesmo excluir "${item.rotulo}" do checklist?`, {
        textoConfirmar: 'Excluir',
        perigo: true,
      })
      .subscribe(() => {
        this.emOperacao.set(item.id);

        this.checklistService.excluir(item.id).subscribe({
          next: () => {
            this.toast.success('Item excluído com sucesso');
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
