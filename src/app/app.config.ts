import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth/auth.interceptor';
import { routes } from './app.routes';

// O app roda sem zone.js (o `ng new` do Angular 21 não gera polyfills). Sem o
// provider zoneless explícito, nada que renderize fora de um evento do
// template — overlay de menu, dialog, snackbar — chega a ser desenhado.
//
// Nada de Material aqui: importar um símbolo do Material neste arquivo puxa o
// módulo inteiro para o bundle inicial (o MatPaginatorIntl traduzido mora no
// próprio componente de grid, que é carregado por rota).
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
