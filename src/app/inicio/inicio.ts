import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface Atalho {
  etapa: string;
  titulo: string;
  descricao: string;
  acao: string;
  rota: string;
  disponivel: boolean;
}

/**
 * Porta de entrada depois do login. Segue o formato do Mini Raio-X: faixa
 * verde de abertura e cartões numerados, um por etapa do trabalho. Os
 * cartões sem tela ainda ficam visíveis e apagados, para deixar claro o que
 * vem pela frente.
 */
@Component({
  selector: 'app-inicio',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.usuario;

  private readonly admin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(this.usuario()?.papel ?? ''));

  protected readonly atalhos = computed<Atalho[]>(() => [
    {
      etapa: 'Cadastro',
      titulo: 'Quem acessa o sistema',
      descricao:
        'Cadastre as pessoas que vão usar a ferramenta e defina o que cada uma pode fazer.',
      acao: 'Abrir usuários',
      rota: '/usuarios',
      disponivel: this.admin(),
    },
    {
      etapa: 'Produção',
      titulo: 'O que você produz',
      descricao: 'Propriedades, áreas e culturas plantadas em cada ciclo.',
      acao: 'Abrir produção',
      rota: '/inicio',
      disponivel: false,
    },
    {
      etapa: 'Resultado',
      titulo: 'Quanto precisa receber',
      descricao:
        'Custo do ciclo, produção vendável e o menor preço que cobre a conta sem prejuízo.',
      acao: 'Abrir cálculo',
      rota: '/inicio',
      disponivel: false,
    },
  ]);
}
