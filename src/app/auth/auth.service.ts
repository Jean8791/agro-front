import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest } from './models/login-request';
import { LoginResponse } from './models/login-response';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorage);

  private readonly url = `${environment.apiUrl}/auth`;

  /**
   * Renovação em curso, compartilhada: se várias requisições tomarem 401 ao
   * mesmo tempo, todas esperam o mesmo refresh em vez de dispararem um cada.
   * Isso importa porque o back rotaciona o refresh token — dois refreshes
   * concorrentes fariam o segundo falhar com "Sessão inválida ou expirada".
   */
  private renovacaoEmCurso: Observable<LoginResponse> | null = null;

  readonly usuario = this.storage.usuario;

  entrar(credenciais: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.url}/login`, credenciais)
      .pipe(tap((resposta) => this.storage.guardar(resposta)));
  }

  renovar(): Observable<LoginResponse> {
    if (this.renovacaoEmCurso) {
      return this.renovacaoEmCurso;
    }

    const refreshToken = this.storage.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('Sem refresh token'));
    }

    this.renovacaoEmCurso = this.http
      .post<LoginResponse>(`${this.url}/refresh`, { refreshToken })
      .pipe(
        tap({
          next: (resposta) => {
            this.storage.guardar(resposta);
            this.renovacaoEmCurso = null;
          },
          error: () => {
            this.storage.limpar();
            this.renovacaoEmCurso = null;
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.renovacaoEmCurso;
  }

  /**
   * Revoga a sessão no back e limpa o storage local. O logout do back é
   * idempotente e o local acontece de qualquer jeito — sair não pode
   * depender de a rede estar boa.
   */
  sair(): Observable<void> {
    const refreshToken = this.storage.refreshToken;
    this.storage.limpar();

    if (!refreshToken) {
      return of(undefined);
    }

    return this.http
      .post<void>(`${this.url}/logout`, { refreshToken })
      .pipe(catchError(() => of(undefined)));
  }

  estaAutenticado(): boolean {
    return this.storage.usuario() !== null;
  }
}
