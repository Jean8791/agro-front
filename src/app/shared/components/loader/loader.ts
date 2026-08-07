import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/** Equivalente ao `<app-loader>`: barra de progresso enquanto carrega. */
@Component({
  selector: 'app-loader',
  imports: [MatProgressBarModule],
  template: '<mat-progress-bar mode="indeterminate" />',
})
export class Loader {}
