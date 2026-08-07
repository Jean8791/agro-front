import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Breadcrumb } from '../shared/components/breadcrumb/breadcrumb';
import { Grid } from '../shared/components/grid/grid';
import { ColunaGrid } from '../shared/components/grid/grid.types';
import { mensagemDoErro } from '../shared/erro';
import { Modal } from '../shared/modal.service';
import { Step } from '../shared/models/step';
import { Toast } from '../shared/toast.service';
import { Usuario as UsuarioModel } from './models/usuario';
import { rotuloDoPapel } from './models/papel';
import { UsuarioService } from './usuario.service';

@Component({
  selector: 'app-usuario',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    Breadcrumb,
    Grid,
  ],
  templateUrl: './usuario.html',
  styleUrl: './usuario.scss',
})
export class Usuario {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);

  private readonly grid = viewChild.required(Grid<UsuarioModel>);

  protected readonly excluindo = signal(false);
  protected readonly bloqueando = signal(false);
  protected readonly linhaSelecionada = signal<UsuarioModel | null>(null);
  protected readonly termo = signal('');

  protected readonly entidade = 'Usuários';
  protected readonly steps: Step[] = [{ label: 'Usuários' }];

  /** Repassado ao grid; mudou o termo, ele volta para a primeira página. */
  protected readonly filtro = computed(() => ({ termo: this.termo() }));

  protected readonly colunas: ColunaGrid<UsuarioModel>[] = [
    { field: 'nome', titulo: 'Nome', ordenavel: true },
    { field: 'email', titulo: 'E-mail', ordenavel: true },
    {
      field: 'papel',
      titulo: 'Papel',
      largura: '12rem',
      valor: (linha) => rotuloDoPapel(linha.papel),
    },
    {
      field: 'ativo',
      titulo: 'Situação',
      largura: '9rem',
      valor: (linha) => (linha.ativo ? 'Ativo' : 'Bloqueado'),
      classeDaCelula: (linha) => (linha.ativo ? '' : 'situacao-bloqueado'),
    },
  ];

  /** A busca do grid. Referência estável: passa direto para o `[carregar]`. */
  protected readonly carregar = (parametros: Parameters<UsuarioService['paginar']>[0]) =>
    this.usuarioService.paginar(parametros);

  protected inserir(): void {
    // um segmento por item do array: '/usuarios/novo' numa string só não navega
    this.router.navigate(['/usuarios', 'novo']);
  }

  protected editar(): void {
    const selecionado = this.linhaSelecionada();
    if (!selecionado) {
      this.toast.warning('Selecione um registro para editar');
      return;
    }
    this.router.navigate(['/usuarios', selecionado.id]);
  }

  protected bloquear(): void {
    const selecionado = this.linhaSelecionada();
    if (!selecionado) {
      this.toast.warning('Selecione um usuário para bloquear ou desbloquear');
      return;
    }

    const bloqueando = selecionado.ativo;
    const acao = bloqueando ? 'bloquear' : 'desbloquear';

    this.modal.confirmation(`Deseja mesmo ${acao} o usuário ${selecionado.nome}?`).subscribe(() => {
      this.bloqueando.set(true);

      const requisicao = bloqueando
        ? this.usuarioService.bloquear(selecionado.id)
        : this.usuarioService.desbloquear(selecionado.id);

      requisicao.subscribe({
        next: () => {
          this.toast.success(`Usuário ${bloqueando ? 'bloqueado' : 'desbloqueado'} com sucesso`);
          this.grid().recarregar();
          this.after();
        },
        error: (erro) => this.onError(erro),
      });
    });
  }

  protected excluir(): void {
    const selecionado = this.linhaSelecionada();
    if (!selecionado) {
      this.toast.warning('Selecione um usuário para excluir');
      return;
    }

    this.modal
      .confirmation(
        `Deseja mesmo excluir o usuário ${selecionado.nome}? Ele deixa de conseguir entrar no sistema.`,
        { textoConfirmar: 'Excluir' },
      )
      .subscribe(() => {
        this.excluindo.set(true);

        this.usuarioService.excluir(selecionado.id).subscribe({
          next: () => {
            this.toast.success('Usuário excluído com sucesso');
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
    this.excluindo.set(false);
    this.bloqueando.set(false);
  }
}
