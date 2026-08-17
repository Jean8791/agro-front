import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';
import { Loader } from '../../shared/components/loader/loader';
import { mensagemDoErro } from '../../shared/erro';
import { Step } from '../../shared/models/step';
import { Toast } from '../../shared/toast.service';
import { ProdutorService } from '../produtor.service';

@Component({
  selector: 'app-produtor-show',
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
  templateUrl: './produtor-show.html',
  styleUrl: './produtor-show.scss',
})
export class ProdutorShow implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly produtorService = inject(ProdutorService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);

  /** 'novo' na rota = inserção; qualquer outro valor é o id para edição. */
  private readonly uri = signal<string>('novo');
  protected readonly inserindo = computed(() => this.uri() === 'novo');

  protected readonly steps = computed<Step[]>(() => [
    { label: 'Produtores', url: '/produtores' },
    { label: this.inserindo() ? 'Inserir' : 'Editar' },
  ]);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    documento: ['', [Validators.required, Validators.pattern(/^\d{11}|\d{14}$/)]],
    tipoPessoa: this.fb.nonNullable.control<'PF' | 'PJ'>('PF', Validators.required),
  });

  ngOnInit(): void {
    this.uri.set(this.rota.snapshot.paramMap.get('uri') ?? 'novo');
    this.get();
  }

  /** Só dígitos chegam ao service — o back não aceita pontuação. */
  protected aoDigitarDocumento(valor: string): void {
    this.form.controls.documento.setValue(valor.replace(/\D/g, ''));
  }

  private get(): void {
    if (this.inserindo()) {
      this.after();
      return;
    }

    this.loading.set(true);

    this.produtorService.get(this.uri()).subscribe({
      next: (produtor) => {
        this.form.patchValue({
          nome: produtor.nome,
          documento: produtor.documento,
          tipoPessoa: produtor.tipoPessoa,
        });
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
      ? this.produtorService.salvar(valor)
      : this.produtorService.editar(this.uri(), valor);

    requisicao.subscribe({
      next: () => {
        this.toast.success(`Produtor ${this.inserindo() ? 'inserido' : 'alterado'} com sucesso`);
        this.voltar();
      },
      error: (erro) => this.onError(erro),
    });
  }

  protected voltar(): void {
    this.router.navigate(['/produtores']);
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
