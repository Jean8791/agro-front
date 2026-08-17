import { Routes } from '@angular/router';
import { superAdminGuard } from '../auth/auth.guard';

/**
 * Rotas do domínio. A listagem fica na raiz e o formulário em `/:uri`, onde
 * `uri` é 'novo' ou o id — mesmo esquema de rota .
 *
 * <p>Guarda por `superAdminGuard`, não `permissaoGuard`: produtor não tem
 * `CodigoPermissao`, é papel de sistema (`SUPER_ADMIN`) no back.
 */
export const produtorRoutes: Routes = [
  {
    path: 'produtores',
    canActivate: [superAdminGuard],
    children: [
      {
        path: '',
        title: 'Produtores · Agro',
        loadComponent: () => import('./produtor').then((m) => m.Produtor),
      },
      {
        path: ':uri',
        title: 'Cadastro de produtor · Agro',
        loadComponent: () => import('./show/produtor-show').then((m) => m.ProdutorShow),
      },
    ],
  },
];
