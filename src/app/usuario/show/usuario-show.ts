import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';
import { Loader } from '../../shared/components/loader/loader';
import { mensagemDoErro } from '../../shared/erro';
import { Step } from '../../shared/models/step';
import { Toast } from '../../shared/toast.service';
import { Papel } from '../../papel/models/papel';
import { PapelService } from '../../papel/papel.service';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-usuario-show',
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
  templateUrl: './usuario-show.html',
  styleUrl: './usuario-show.scss',
})
export class UsuarioShow implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly papelService = inject(PapelService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);

  /** Os papéis que este produtor pode atribuir: os de sistema e os dele. */
  protected readonly papeis = signal<Papel[]>([]);

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
    papelId: ['', Validators.required],
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
    }

    this.loading.set(true);

    // a lista de papéis e o usuário chegam juntos: o select precisa das
    // opções antes de receber o papelId, senão o valor não casa com nada
    forkJoin({
      papeis: this.papelService.query(),
      usuario: this.inserindo() ? of(null) : this.usuarioService.get(this.uri()),
    }).subscribe({
      next: ({ papeis, usuario }) => {
        this.papeis.set(papeis);

        if (usuario) {
          this.form.patchValue({
            nome: usuario.nome,
            email: usuario.email,
            papelId: usuario.papelId,
          });
        }

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
          papelId: valor.papelId,
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
