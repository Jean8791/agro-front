import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Permissoes } from '../../../auth/permissoes';
import { Breadcrumb } from '../../../shared/components/breadcrumb/breadcrumb';
import { Loader } from '../../../shared/components/loader/loader';
import { mensagemDoErro } from '../../../shared/erro';
import { Modal } from '../../../shared/modal.service';
import { Step } from '../../../shared/models/step';
import { Toast } from '../../../shared/toast.service';
import { Simulacao } from '../../calculadora/models/simulacao';
import { SimulacaoService } from '../../calculadora/simulacao.service';

/** Uma linha do resumo "Dados informados" — rótulo + valor já formatado. */
interface LinhaResumo {
  rotulo: string;
  valor: string;
}

@Component({
  selector: 'app-raiox-simulacao-show',
  imports: [MatButtonModule, MatIconModule, Breadcrumb, Loader],
  templateUrl: './simulacao-show.html',
  styleUrl: './simulacao-show.scss',
})
export class SimulacaoShow implements OnInit {
  private readonly simulacaoService = inject(SimulacaoService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);
  protected readonly permissoes = inject(Permissoes);

  protected readonly loading = signal(false);
  protected readonly excluindo = signal(false);
  protected readonly simulacao = signal<Simulacao | null>(null);

  protected readonly steps = computed<Step[]>(() => [
    { label: 'Raio-X', url: '/raiox/calculadora' },
    { label: 'Histórico', url: '/raiox/simulacoes' },
    { label: this.simulacao()?.nome ?? '…' },
  ]);

  protected readonly resumo = computed<LinhaResumo[]>(() => {
    const simulacao = this.simulacao();
    if (!simulacao) {
      return [];
    }

    const formulario = simulacao.formulario as unknown as Record<string, unknown>;
    const texto = (chave: string) => String(formulario[chave] ?? '').trim();

    const linhas: LinhaResumo[] = [
      { rotulo: 'Módulo', valor: simulacao.modulo === 'VEGETAL' ? 'Vegetal' : 'Animal' },
      { rotulo: 'Produto ou atividade', valor: simulacao.produto },
      { rotulo: 'Região', valor: texto('regiao') },
      { rotulo: 'Canal de venda', valor: texto('canalVenda') },
      {
        rotulo: 'Unidade comercial',
        valor: `${texto('unidadeComercial')} (${texto('quantidadePorUnidade')} ${texto('unidadeTecnica')})`,
      },
      { rotulo: 'Preço esperado', valor: `R$ ${texto('precoEsperado')}` },
      { rotulo: 'Fonte da cotação', valor: texto('fonteCotacao') || '—' },
    ];

    return linhas.filter((linha) => linha.valor.trim().length > 0 && linha.valor !== 'R$ ');
  });

  ngOnInit(): void {
    const id = this.rota.snapshot.paramMap.get('uri');
    if (!id) {
      this.voltar();
      return;
    }

    this.loading.set(true);

    this.simulacaoService.get(id).subscribe({
      next: (simulacao) => {
        this.simulacao.set(simulacao);
        this.loading.set(false);
      },
      error: (erro) => {
        this.toast.danger(mensagemDoErro(erro));
        this.loading.set(false);
      },
    });
  }

  protected excluir(): void {
    const simulacao = this.simulacao();
    if (!simulacao) {
      return;
    }

    this.modal
      .confirmation(`Deseja mesmo excluir a simulação "${simulacao.nome}"?`, {
        textoConfirmar: 'Excluir',
        perigo: true,
      })
      .subscribe(() => {
        this.excluindo.set(true);

        this.simulacaoService.excluir(simulacao.id).subscribe({
          next: () => {
            this.toast.success('Simulação excluída com sucesso');
            this.voltar();
          },
          error: (erro) => {
            this.toast.danger(mensagemDoErro(erro));
            this.excluindo.set(false);
          },
        });
      });
  }

  protected voltar(): void {
    this.router.navigate(['/raiox/simulacoes']);
  }
}
