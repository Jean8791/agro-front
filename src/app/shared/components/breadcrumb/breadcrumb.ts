import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Step } from '../../models/step';

/** Breadcrumb da tela, montado a partir de uma lista de {@link Step}. */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  readonly steps = input.required<Step[]>();
}
