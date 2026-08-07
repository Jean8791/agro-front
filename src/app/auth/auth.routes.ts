import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    title: 'Entrar · Agro',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
];
