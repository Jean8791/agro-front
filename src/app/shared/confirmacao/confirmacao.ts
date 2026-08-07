import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmacaoData {
  mensagem: string;
  textoConfirmar: string;
  textoCancelar: string;
}

/** Corpo do dialog aberto por {@link Modal.confirmation}. */
@Component({
  selector: 'app-confirmacao',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirmacao.html',
})
export class Confirmacao {
  protected readonly data = inject<ConfirmacaoData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<Confirmacao, boolean>);

  protected confirmar(): void {
    this.dialogRef.close(true);
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }
}
