import { Routes } from '@angular/router';
import { permissaoGuard } from '../auth/auth.guard';

/**
 * Rotas do domínio Raio-X, um subdomínio por sub-área — decalque do esquema
 * `/<dominio>` + `/<dominio>/:uri` dos demais domínios, só que aqui são três
 * grupos de telas sob o mesmo prefixo `raiox/`.
 */
export const raioxRoutes: Routes = [
  {
    path: 'raiox/calculadora',
    canActivate: [permissaoGuard('raioxsimulacao:listar')],
    title: 'Raio-X · Agro',
    loadComponent: () => import('./calculadora/calculadora').then((m) => m.Calculadora),
  },
  {
    path: 'raiox/simulacoes',
    canActivate: [permissaoGuard('raioxsimulacao:listar')],
    children: [
      {
        path: '',
        title: 'Histórico do Raio-X · Agro',
        loadComponent: () => import('./simulacoes/simulacoes').then((m) => m.Simulacoes),
      },
      {
        path: ':uri',
        title: 'Simulação · Agro',
        loadComponent: () =>
          import('./simulacoes/show/simulacao-show').then((m) => m.SimulacaoShow),
      },
    ],
  },
  {
    path: 'raiox/produtos',
    canActivate: [permissaoGuard('raioxproduto:listar')],
    children: [
      {
        path: '',
        title: 'Catálogo do Raio-X · Agro',
        loadComponent: () => import('./produto/produto').then((m) => m.Produto),
      },
      {
        path: ':uri',
        title: 'Cadastro de produto · Agro',
        loadComponent: () => import('./produto/show/produto-show').then((m) => m.ProdutoShow),
      },
    ],
  },
  {
    path: 'raiox/checklist',
    canActivate: [permissaoGuard('raioxchecklist:listar')],
    children: [
      {
        path: '',
        title: 'Checklist do Raio-X · Agro',
        loadComponent: () => import('./checklist/checklist').then((m) => m.Checklist),
      },
      {
        path: ':uri',
        title: 'Item de checklist · Agro',
        loadComponent: () =>
          import('./checklist/show/checklist-show').then((m) => m.ChecklistShow),
      },
    ],
  },
];
