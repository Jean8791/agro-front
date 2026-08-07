import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, map } from 'rxjs';
import { Confirmacao, ConfirmacaoData } from './confirmacao/confirmacao';

/**
 * Equivalente ao `Modal` .
 *
 * <p>Diferença de uso: lá era `Modal.confirmation(msg, callback)`; aqui o
 * retorno é um Observable que só emite quando o usuário confirma — fechar no
 * X ou clicar fora simplesmente não emite. Assim o `.subscribe()` fica com o
 * mesmo corpo que o callback tinha, sem `if (confirmou)`.
 */
@Injectable({ providedIn: 'root' })
export class Modal {
  private readonly dialog = inject(MatDialog);

  confirmation(
    mensagem: string,
    opcoes: { textoConfirmar?: string; textoCancelar?: string } = {},
  ): Observable<void> {
    const data: ConfirmacaoData = {
      mensagem,
      textoConfirmar: opcoes.textoConfirmar ?? 'Confirmar',
      textoCancelar: opcoes.textoCancelar ?? 'Cancelar',
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
