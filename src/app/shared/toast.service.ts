import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Equivalente ao `Toast` : mensagem curta no rodapé.
 * Mesmos nomes de método para não ter que reaprender nada.
 */
@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  success(mensagem: string): void {
    this.abrir(mensagem, 'toast-success', 3000);
  }

  warning(mensagem: string): void {
    this.abrir(mensagem, 'toast-warning', 4000);
  }

  danger(mensagem: string): void {
    this.abrir(mensagem, 'toast-danger', 5000);
  }

  private abrir(mensagem: string, classe: string, duracao: number): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: duracao,
      panelClass: classe,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
