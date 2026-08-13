import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { authRoutes } from './auth/auth.routes';
import { papelRoutes } from './papel/papel.routes';
import { usuarioRoutes } from './usuario/usuario.routes';

export const routes: Routes = [
  ...authRoutes,
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Início · Agro',
        loadComponent: () => import('./inicio/inicio').then((m) => m.Inicio),
      },
      ...usuarioRoutes,
      ...papelRoutes,
    ],
  },
  { path: '**', redirectTo: '' },
];
