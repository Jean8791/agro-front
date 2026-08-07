import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';
import { Loader } from '../../shared/components/loader/loader';
import { mensagemDoErro } from '../../shared/erro';
import { Step } from '../../shared/models/step';
import { Toast } from '../../shared/toast.service';
import { PAPEIS, Papel } from '../models/papel';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-usuario-show',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    Breadcrumb,
    Loader,
  ],
  templateUrl: './usuario-show.html',
  styleUrl: './usuario-show.scss',
})
export class UsuarioShow implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);
  protected readonly papeis = PAPEIS;

  /** 'novo' na rota = inserção; qualquer outro valor é o id para edição. */
  private readonly uri = signal<string>('novo');
  protected readonly inserindo = computed(() => this.uri() === 'novo');

  protected readonly steps = computed<Step[]>(() => [
    { label: 'Usuários', url: '/usuarios' },
    { label: this.inserindo() ? 'Inserir' : 'Editar' },
  ]);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: [''],
    papel: ['CONSULTA' as Papel, Validators.required],
  });

  ngOnInit(): void {
    this.uri.set(this.rota.snapshot.paramMap.get('uri') ?? 'novo');
    this.get();
  }

  private get(): void {
    if (this.inserindo()) {
      // senha só é exigida (e enviada) na inserção — o PUT do back não a aceita
      this.form.controls.senha.addValidators([Validators.required, Validators.minLength(6)]);
      this.form.controls.senha.updateValueAndValidity();
      return;
    }

    this.loading.set(true);
    this.usuarioService.get(this.uri()).subscribe({
      next: (usuario) => {
        this.form.patchValue({
          nome: usuario.nome,
          email: usuario.email,
          papel: usuario.papel,
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
      ? this.usuarioService.salvar(valor)
      : this.usuarioService.editar(this.uri(), {
          nome: valor.nome,
          email: valor.email,
          papel: valor.papel,
        });

    requisicao.subscribe({
      next: () => {
        this.toast.success(`Usuário ${this.inserindo() ? 'inserido' : 'alterado'} com sucesso`);
        this.voltar();
      },
      error: (erro) => this.onError(erro),
    });
  }

  protected voltar(): void {
    this.router.navigate(['/usuarios']);
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
