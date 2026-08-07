import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Step } from '../../models/step';

/** Equivalente ao `<app-breadcrumb steps="$ctrl.steps">`. */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  readonly steps = input.required<Step[]>();
}
