import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Breadcrumb } from '../../../shared/components/breadcrumb/breadcrumb';
import { Loader } from '../../../shared/components/loader/loader';
import { mensagemDoErro } from '../../../shared/erro';
import { Step } from '../../../shared/models/step';
import { Toast } from '../../../shared/toast.service';
import { ChecklistService } from '../checklist.service';
import { ModuloChecklist } from '../models/checklist-item';

@Component({
  selector: 'app-raiox-checklist-show',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    Breadcrumb,
    Loader,
  ],
  templateUrl: './checklist-show.html',
  styleUrl: './checklist-show.scss',
})
export class ChecklistShow implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly checklistService = inject(ChecklistService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);

  private readonly uri = signal<string>('novo');
  protected readonly inserindo = computed(() => this.uri() === 'novo');

  protected readonly steps = computed<Step[]>(() => [
    { label: 'Raio-X', url: '/raiox/calculadora' },
    { label: 'Checklist', url: '/raiox/checklist' },
    { label: this.inserindo() ? 'Inserir' : 'Editar' },
  ]);

  protected readonly form = this.fb.nonNullable.group({
    modulo: this.fb.nonNullable.control<ModuloChecklist>('AMBOS', Validators.required),
    rotulo: ['', Validators.required],
    nota: [''],
  });

  ngOnInit(): void {
    this.uri.set(this.rota.snapshot.paramMap.get('uri') ?? 'novo');
    this.get();
  }

  private get(): void {
    if (this.inserindo()) {
      return;
    }

    this.loading.set(true);

    this.checklistService.get(this.uri()).subscribe({
      next: (item) => {
        this.form.patchValue(item);
        this.after();
      },
      error: (erro) => this.onError(erro),
    });
  }

  protected salvar(): void {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    const valor = this.form.getRawValue();

    const requisicao = this.inserindo()
      ? this.checklistService.salvar(valor)
      : this.checklistService.editar(this.uri(), valor);

    requisicao.subscribe({
      next: () => {
        this.toast.success(`Item ${this.inserindo() ? 'inserido' : 'alterado'} com sucesso`);
        this.voltar();
      },
      error: (erro) => this.onError(erro),
    });
  }

  protected voltar(): void {
    this.router.navigate(['/raiox/checklist']);
  }

  private onError(erro: unknown): void {
    this.toast.danger(mensagemDoErro(erro));
    this.after();
  }

  private after(): void {
    this.loading.set(false);
    this.salvando.set(false);
  }
}
