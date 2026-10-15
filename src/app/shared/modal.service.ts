import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, map } from 'rxjs';
import { Confirmacao, ConfirmacaoData } from './confirmacao/confirmacao';

/**
 * Dialogs de confirmação.
 *
 * <p>`confirmation(msg)` devolve um Observable que só emite quando o usuário
 * confirma — fechar no X ou clicar fora simplesmente não emite. Assim o
 * `.subscribe()` recebe só o caminho da confirmação, sem `if (confirmou)`.
 */
@Injectable({ providedIn: 'root' })
export class Modal {
  private readonly dialog = inject(MatDialog);

  confirmation(
    mensagem: string,
    opcoes: { textoConfirmar?: string; textoCancelar?: string; perigo?: boolean } = {},
  ): Observable<void> {
    const data: ConfirmacaoData = {
      mensagem,
      textoConfirmar: opcoes.textoConfirmar ?? 'Confirmar',
      textoCancelar: opcoes.textoCancelar ?? 'Cancelar',
      // pinta o botão de vermelho: o que destrói não deve sair na cor da marca
      perigo: opcoes.perigo ?? false,
    };

    return this.dialog
      .open(Confirmacao, { data, width: '26rem', autoFocus: 'dialog' })
      .afterClosed()
      .pipe(
        filter((confirmado) => confirmado === true),
        map(() => undefined),
      );
  }
}
