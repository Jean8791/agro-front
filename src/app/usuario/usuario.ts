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
import { Usuario as UsuarioModel } from './models/usuario';
import { UsuarioService } from './usuario.service';

@Component({
  selector: 'app-usuario',
  imports: [FormsModule, MatButtonModule, MatIconModule, Grid, SePode],
  templateUrl: './usuario.html',
  styleUrl: './usuario.scss',
})
export class Usuario {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly modal = inject(Modal);
  private readonly auth = inject(AuthService);
  private readonly permissoes = inject(Permissoes);
  private readonly tenant = inject(TenantContext);

  private readonly grid = viewChild.required(Grid<UsuarioModel>);

  /** Id do registro cuja requisição ainda não voltou — trava só a linha dele. */
  protected readonly emOperacao = signal<string | null>(null);
  protected readonly termo = signal('');

  protected readonly entidade = 'Usuários';

  /**
   * Super admin sem produtor escolhido: o back responderia "Informe o
   * produtor" em toda chamada, então a tela pede a escolha em vez de tentar.
   */
  protected readonly precisaEscolherProdutor = computed(
    () => this.auth.usuario()?.superAdmin === true && this.tenant.produtor() === null,
  );

  /**
   * Repassado ao grid; mudou o termo, ele volta para a primeira página. O
   * `produtorId` entra só para o grid perceber a troca de produtor e refazer a
   * busca — quem o envia ao back é o service.
   */
  protected readonly filtro = computed(() => ({
    termo: this.termo(),
    produtorId: this.tenant.produtor()?.id ?? null,
  }));

  protected readonly colunas: ColunaGrid<UsuarioModel>[] = [
    {
      field: 'nome',
      titulo: 'Usuário',
      ordenavel: true,
      avatar: (linha) => linha.nome.slice(0, 2),
      secundario: (linha) => linha.email,
    },
    {
      field: 'papelNome',
      titulo: 'Papel',
      largura: '14rem',
      valor: (linha) => linha.papelNome,
    },
    {
      field: 'ativo',
      titulo: 'Situação',
      largura: '10rem',
      valor: (linha) => (linha.ativo ? 'Ativo' : 'Bloqueado'),
      pill: (linha) => (linha.ativo ? 'verde' : 'vermelho'),
    },
  ];

  // `visivel` consulta a permissão: sem ela o ícone não aparece, e a linha
  // fica só com o que aquela pessoa realmente consegue fazer
  protected readonly acoes: AcaoGrid<UsuarioModel>[] = [
    {
      icone: 'edit',
      titulo: 'Editar',
      tom: 'primario',
      visivel: () => this.permissoes.pode('usuario:editar'),
      executar: (linha) => this.editar(linha),
    },
    {
      icone: (linha) => (linha.ativo ? 'lock' : 'lock_open'),
      titulo: (linha) => (linha.ativo ? 'Bloquear' : 'Desbloquear'),
      visivel: () => this.permissoes.pode('usuario:bloquear'),
      desabilitado: (linha) => this.emOperacao() === linha.id,
      executar: (linha) => this.bloquear(linha),
    },
    {
      icone: 'delete',
      titulo: 'Excluir',
      tom: 'perigo',
      visivel: () => this.permissoes.pode('usuario:excluir'),
      desabilitado: (linha) => this.emOperacao() === linha.id,
      executar: (linha) => this.excluir(linha),
    },
  ];

  /** A busca do grid. Referência estável: passa direto para o `[carregar]`. */
  protected readonly carregar = (parametros: Parameters<UsuarioService['paginar']>[0]) =>
    this.usuarioService.paginar(parametros);

  protected inserir(): void {
    // um segmento por item do array: '/usuarios/novo' numa string só não navega
    this.router.navigate(['/usuarios', 'novo']);
  }

  protected editar(usuario: UsuarioModel): void {
    this.router.navigate(['/usuarios', usuario.id]);
  }

  protected bloquear(usuario: UsuarioModel): void {
    const bloqueando = usuario.ativo;
    const acao = bloqueando ? 'bloquear' : 'desbloquear';

    this.modal.confirmation(`Deseja mesmo ${acao} o usuário ${usuario.nome}?`).subscribe(() => {
      this.emOperacao.set(usuario.id);

      const requisicao = bloqueando
        ? this.usuarioService.bloquear(usuario.id)
        : this.usuarioService.desbloquear(usuario.id);

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

  protected excluir(usuario: UsuarioModel): void {
    this.modal
      .confirmation(
        `Deseja mesmo excluir o usuário ${usuario.nome}? Ele deixa de conseguir entrar no sistema.`,
        { textoConfirmar: 'Excluir', perigo: true },
      )
      .subscribe(() => {
        this.emOperacao.set(usuario.id);

        this.usuarioService.excluir(usuario.id).subscribe({
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
    this.emOperacao.set(null);
  }
}
