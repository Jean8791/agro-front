import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { mensagemDoErro } from '../../shared/erro';
import { TenantContext } from '../../shared/tenant';
import { Toast } from '../../shared/toast.service';
import { Produtor } from '../models/produtor';
import { ProdutorService } from '../produtor.service';

/**
 * Escolha do produtor sobre o qual o super admin está trabalhando.
 *
 * <p>Só ele vê: quem tem papel dentro de um produtor já o carrega no token.
 * Sem escolha feita, todo endpoint de `/usuarios` responde "Informe o
 * produtor", então este seletor é pré-requisito das telas de cadastro.
 */
@Component({
  selector: 'app-seletor-produtor',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './seletor-produtor.html',
  styleUrl: './seletor-produtor.scss',
})
export class SeletorProdutor implements OnInit {
  private readonly produtorService = inject(ProdutorService);
  private readonly tenant = inject(TenantContext);
  private readonly toast = inject(Toast);

  protected readonly carregando = signal(false);
  protected readonly produtores = signal<Produtor[]>([]);

  protected readonly selecionado = this.tenant.produtor;

  /** Ativos primeiro: o inativo é exceção e não deve abrir a lista. */
  protected readonly ordenados = computed(() =>
    [...this.produtores()].sort((a, b) =>
      a.ativo === b.ativo ? a.nome.localeCompare(b.nome) : a.ativo ? -1 : 1,
    ),
  );

  ngOnInit(): void {
    this.get();
  }

  protected selecionar(produtor: Produtor): void {
    this.tenant.selecionar({ id: produtor.id, nome: produtor.nome });
  }

  private get(): void {
    this.carregando.set(true);

    this.produtorService.query().subscribe({
      next: (produtores) => {
        this.produtores.set(produtores);
        this.after();
      },
      error: (erro) => this.onError(erro),
    });
  }

  private onError(erro: unknown): void {
    this.toast.danger(mensagemDoErro(erro));
    this.after();
  }

  private after(): void {
    this.carregando.set(false);
  }
}
