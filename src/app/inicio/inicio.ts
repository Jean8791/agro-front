import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Permissoes } from '../auth/permissoes';

interface Atalho {
  icone: string;
  etapa: string;
  titulo: string;
  descricao: string;
  acao: string;
  rota: string;
  disponivel: boolean;
}

/**
 * Porta de entrada depois do login: um cartão por etapa do trabalho. Os
 * cartões sem tela ainda ficam visíveis e apagados, para deixar claro o que
 * vem pela frente.
 */
@Component({
  selector: 'app-inicio',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private readonly auth = inject(AuthService);
  private readonly permissoes = inject(Permissoes);

  protected readonly usuario = this.auth.usuario;

  protected readonly atalhos = computed<Atalho[]>(() => [
    {
      icone: 'group',
      etapa: 'Cadastro',
      titulo: 'Quem acessa o sistema',
      descricao:
        'Cadastre as pessoas que vão usar a ferramenta e defina o que cada uma pode fazer.',
      acao: 'Abrir usuários',
      rota: '/usuarios',
      disponivel: this.permissoes.pode('usuario:listar'),
    },
    {
      icone: 'agriculture',
      etapa: 'Produção',
      titulo: 'O que você produz',
      descricao: 'Propriedades, áreas e culturas plantadas em cada ciclo.',
      acao: 'Abrir produção',
      rota: '/inicio',
      disponivel: false,
    },
    {
      icone: 'insights',
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
