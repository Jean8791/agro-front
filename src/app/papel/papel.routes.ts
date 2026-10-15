import { Routes } from '@angular/router';
import { permissaoGuard } from '../auth/auth.guard';

/**
 * Rotas do domínio. A listagem fica na raiz e o formulário em `/:uri`, onde
 * `uri` é 'novo' ou o id.
 */
export const papelRoutes: Routes = [
  {
    path: 'papeis',
    canActivate: [permissaoGuard('papel:listar')],
    children: [
      {
        path: '',
        title: 'Papéis · Agro',
        loadComponent: () => import('./papel').then((m) => m.Papel),
      },
      {
        path: ':uri',
        title: 'Cadastro de papel · Agro',
        loadComponent: () => import('./show/papel-show').then((m) => m.PapelShow),
      },
    ],
  },
];
