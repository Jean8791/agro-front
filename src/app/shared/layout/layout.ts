import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { Permissoes } from '../../auth/permissoes';
import { CodigoPermissao } from '../../papel/models/permissao';
import { SeletorProdutor } from '../../produtor/seletor/seletor-produtor';

/**
 * Um item da barra lateral. Sem `permissao` nem `apenasSuperAdmin`, todo
 * mundo vê. Produtor usa `apenasSuperAdmin`: não tem `CodigoPermissao`, é
 * papel de sistema (`SUPER_ADMIN`) no back.
 */
interface ItemDeMenu {
  rotulo: string;
  icone: string;
  rota: string;
  permissao?: CodigoPermissao;
  apenasSuperAdmin?: boolean;
}

const MENU: ItemDeMenu[] = [
  { rotulo: 'Início', icone: 'space_dashboard', rota: '/inicio' },
  { rotulo: 'Usuários', icone: 'group', rota: '/usuarios', permissao: 'usuario:listar' },
  { rotulo: 'Papéis', icone: 'admin_panel_settings', rota: '/papeis', permissao: 'papel:listar' },
  {
    rotulo: 'Raio-X',
    icone: 'calculate',
    rota: '/raiox/calculadora',
    permissao: 'raioxsimulacao:listar',
  },
  {
    rotulo: 'Produtores',
    icone: 'agriculture',
    rota: '/produtores',
    apenasSuperAdmin: true,
  },
];

/**
 * Casca das telas autenticadas: barra lateral fixa + cabeçalho + conteúdo da
 * rota filha. Abaixo de 960px a barra sai do fluxo e vira gaveta, aberta pelo
 * botão de menu do cabeçalho.
 */
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    SeletorProdutor,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly auth = inject(AuthService);
  private readonly permissoes = inject(Permissoes);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuario;
  protected readonly menuAberto = signal(false);

  /** Só ele escolhe produtor: os demais já o carregam no token. */
  protected readonly superAdmin = computed(() => this.usuario()?.superAdmin === true);

  /** Esconde o que responderia 403 — a checagem de verdade é do back. */
  protected readonly menu = computed(() =>
    MENU.filter((item) => {
      if (item.apenasSuperAdmin) {
        return this.superAdmin();
      }
      return !item.permissao || this.permissoes.pode(item.permissao);
    }),
  );

  /** Duas primeiras letras do e-mail, para o avatar do cabeçalho. */
  protected readonly iniciais = computed(() =>
    (this.usuario()?.email ?? '??').slice(0, 2).toUpperCase(),
  );

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected fecharMenu(): void {
    this.menuAberto.set(false);
  }

  protected sair(): void {
    this.auth.sair().subscribe(() => this.router.navigate(['/login']));
  }
}
