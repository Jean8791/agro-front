import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { Permissoes } from '../../auth/permissoes';
import { Grid } from '../../shared/components/grid/grid';
import { AcaoGrid, ColunaGrid, TomPill } from '../../shared/components/grid/grid.types';
import { mensagemDoErro } from '../../shared/erro';
import { Modal } from '../../shared/modal.service';
import { TenantContext } from '../../shared/tenant';
import { Toast } from '../../shared/toast.service';
import { Simulacao } from '../calculadora/models/simulacao';
import { SimulacaoService } from '../calculadora/simulacao.service';

const TOM_SEMAFORO: Record<Simulacao['semaforo'], TomPill> = {
  FILL: 'cinza',
  RED: 'vermelho',
  YELLOW: 'ambar',
  GREEN: 'verde',
};

const ROTULO_SEMAFORO: Record<Simulacao['semaforo'], string> = {
  FILL: 'Incompleta',
  RED: 'Risco de prejuízo',
  YELLOW: 'Margem baixa',
  GREEN: 'Com margem',
};

@Component({
  selector: 'app-raiox-simulacoes',
  imports: [FormsModule, MatButtonModule, MatIconModule, RouterLink, Grid],
  templateUrl: './simulacoes.html',
  styleUrl: './simulacoes.scss',
})
export class Simulacoes {
  private readonly simulacaoService = inject(SimulacaoService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);
  private readonly permissoes = inject(Permissoes);
  private readonly tenant = inject(TenantContext);

  private readonly grid = viewChild.required(Grid<Simulacao>);

  protected readonly emOperacao = signal<string | null>(null);
  protected readonly termo = signal('');

  protected readonly entidade = 'Histórico de simulações';

  protected readonly filtro = computed(() => ({
    termo: this.termo(),
    produtorId: this.tenant.produtor()?.id ?? null,
  }));

  protected readonly colunas: ColunaGrid<Simulacao>[] = [
    {
      field: 'nome',
      titulo: 'Simulação',
      ordenavel: true,
      avatar: (linha) => linha.produto.slice(0, 2),
      secundario: (linha) => linha.produto,
    },
    {
      field: 'semaforo',
      titulo: 'Situação',
      largura: '11rem',
      valor: (linha) => ROTULO_SEMAFORO[linha.semaforo],
      pill: (linha) => TOM_SEMAFORO[linha.semaforo],
    },
    {
      field: 'precoMinimo',
      titulo: 'Preço mínimo',
      largura: '10rem',
      valor: (linha) => (linha.precoMinimo !== null ? `R$ ${linha.precoMinimo.toFixed(2)}` : '—'),
    },
    {
      field: 'criadoEm',
      titulo: 'Calculada em',
      largura: '11rem',
      valor: (linha) => new Date(linha.criadoEm).toLocaleString('pt-BR'),
    },
  ];

  protected readonly acoes: AcaoGrid<Simulacao>[] = [
    {
      icone: 'visibility',
      titulo: 'Ver',
      tom: 'primario',
      executar: (linha) => this.ver(linha),
    },
    {
      icone: 'delete',
      titulo: 'Excluir',
      tom: 'perigo',
      visivel: () => this.permissoes.pode('raioxsimulacao:excluir'),
      desabilitado: (linha) => this.emOperacao() === linha.id,
      executar: (linha) => this.excluir(linha),
    },
  ];

  protected readonly carregar = (parametros: Parameters<SimulacaoService['paginar']>[0]) =>
    this.simulacaoService.paginar(parametros);

  protected ver(simulacao: Simulacao): void {
    this.router.navigate(['/raiox/simulacoes', simulacao.id]);
  }

  protected excluir(simulacao: Simulacao): void {
    this.modal
      .confirmation(`Deseja mesmo excluir a simulação "${simulacao.nome}"?`, {
        textoConfirmar: 'Excluir',
        perigo: true,
      })
      .subscribe(() => {
        this.emOperacao.set(simulacao.id);

        this.simulacaoService.excluir(simulacao.id).subscribe({
          next: () => {
            this.toast.success('Simulação excluída com sucesso');
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
