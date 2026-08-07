import { Routes } from '@angular/router';
import { papelGuard } from '../auth/auth.guard';

/**
 * Rotas do domínio. A listagem fica na raiz e o formulário em `/:uri`, onde
 * `uri` é 'novo' ou o id — mesmo esquema de rota .
 */
export const usuarioRoutes: Routes = [
  {
    path: 'usuarios',
    canActivate: [papelGuard('ADMIN')],
    children: [
      {
        path: '',
        title: 'Usuários · Agro',
        loadComponent: () => import('./usuario').then((m) => m.Usuario),
      },
      {
        path: ':uri',
        title: 'Cadastro de usuário · Agro',
        loadComponent: () => import('./show/usuario-show').then((m) => m.UsuarioShow),
      },
    ],
  },
];
