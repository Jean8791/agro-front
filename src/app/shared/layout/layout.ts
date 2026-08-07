import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/** Casca das telas autenticadas: barra superior + conteúdo da rota filha. */
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuario;

  /** Esconde o que responderia 403 — a checagem de verdade é do back. */
  protected readonly admin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(this.usuario()?.papel ?? ''));

  protected sair(): void {
    this.auth.sair().subscribe(() => this.router.navigate(['/login']));
  }
}
