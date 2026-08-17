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
import { ModuloProducao, TipoProducaoAnimal } from '../models/produto';
import { ProdutoService } from '../produto.service';

@Component({
  selector: 'app-raiox-produto-show',
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
  templateUrl: './produto-show.html',
  styleUrl: './produto-show.scss',
})
export class ProdutoShow implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly produtoService = inject(ProdutoService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);

  private readonly uri = signal<string>('novo');
  protected readonly inserindo = computed(() => this.uri() === 'novo');

  protected readonly steps = computed<Step[]>(() => [
    { label: 'Raio-X', url: '/raiox/calculadora' },
    { label: 'Produtos', url: '/raiox/produtos' },
    { label: this.inserindo() ? 'Inserir' : 'Editar' },
  ]);

  protected readonly form = this.fb.nonNullable.group({
    modulo: this.fb.nonNullable.control<ModuloProducao>('VEGETAL', Validators.required),
    categoria: ['', Validators.required],
    produto: ['', Validators.required],
    unidadeTecnica: ['', Validators.required],
    unidadeComercial: ['', Validators.required],
    quantidadePorUnidade: this.fb.nonNullable.control(1, [Validators.required, Validators.min(0.0001)]),
    unidadePreco: ['', Validators.required],
    tipoProducaoAnimal: this.fb.control<TipoProducaoAnimal | null>(null),
    nota: [''],
    fonte: [''],
  });

  /** Só o módulo animal usa isto — vegetal sempre manda nulo. */
  protected readonly ehAnimal = computed(() => this.form.controls.modulo.value === 'ANIMAL');

  ngOnInit(): void {
    this.uri.set(this.rota.snapshot.paramMap.get('uri') ?? 'novo');

    this.form.controls.modulo.valueChanges.subscribe((modulo) => {
      if (modulo === 'VEGETAL') {
        this.form.controls.tipoProducaoAnimal.setValue(null);
      }
    });

    this.get();
  }

  private get(): void {
    if (this.inserindo()) {
      return;
    }

    this.loading.set(true);

    this.produtoService.get(this.uri()).subscribe({
      next: (produto) => {
        this.form.patchValue(produto);
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
      ? this.produtoService.salvar(valor)
      : this.produtoService.editar(this.uri(), valor);

    requisicao.subscribe({
      next: () => {
        this.toast.success(`Produto ${this.inserindo() ? 'inserido' : 'alterado'} com sucesso`);
        this.voltar();
      },
      error: (erro) => this.onError(erro),
    });
  }

  protected voltar(): void {
    this.router.navigate(['/raiox/produtos']);
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
