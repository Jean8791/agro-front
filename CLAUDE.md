# agro-front

Front Angular 21 (standalone, zoneless, sem SSR) para a ferramenta de
agronegócio. Consome o `agro-back` (Quarkus, `http://localhost:8090` em dev).

## Convenção de estrutura de pastas

A estrutura é um decalque do padrão que o dono do projeto já usa em produção
no `projeto de referência` .
A ideia é que quem conhece aquele projeto se ache aqui sem reaprender nada.

**Package by feature**: cada domínio é uma pasta autocontida direto em
`src/app/`. Nada de `pages/`, `services/` ou `models/` globais na raiz.

```
src/app/
  usuario/                      -> domínio de negócio
    usuario.ts / .html / .scss     LISTAGEM (o componente da raiz é a grid)
    usuario.service.ts             resource: 1 método por endpoint + listas de domínio
    usuario.routes.ts              rotas do domínio
    models/
      usuario.ts  perfil.ts        espelham 1-para-1 os DTOs do back
    show/                          FORMULÁRIO (inserir e editar na mesma tela)
      usuario-show.ts / .html / .scss
    pesquisa-avancada/             modal de filtro (quando existir)

  auth/                         -> técnico acoplado a usuario (login/JWT)
    login/  auth.service.ts  auth.guard.ts  auth.interceptor.ts
    token-storage.ts  auth.routes.ts  models/

  inicio/                       -> tela inicial pós-login

  shared/                       -> técnico, transversal a mais de um domínio
    layout/                        casca: toolbar + menu + router-outlet
    toast.service.ts               = Toast 
    modal.service.ts               = Modal 
    confirmacao/                   corpo do dialog de confirmação
    erro.ts                        = onError(response)
    components/breadcrumb/         = <app-breadcrumb steps="...">
    components/loader/             = <app-loader>
    models/                        error-response.ts, step.ts
```

### Equivalências com o projeto de referência (AngularJS 1.6)

| projeto de referência | agro-front |
| --- | --- |
| `<tela>.component.js` na raiz | `<dominio>.ts` na raiz — é a listagem |
| `<tela>.service.js` (factory `resource`) | `<dominio>.service.ts` (classe injetável) |
| `show/` | `show/` |
| `pesquisa-avancada/` | `pesquisa-avancada/` |
| `$ctrl.inserir = inserir;` no topo | métodos `protected` da classe (o template já enxerga) |
| `function onInit()` | `ngOnInit()` |
| `$ctrl.salvando = false` | `readonly salvando = signal(false)` |
| `$ctrl.showLoader` | `readonly showLoader = signal(false)` |
| `$ctrl.steps = [{url, label}]` | `readonly steps: Step[]` + `<app-breadcrumb [steps]="steps" />` |
| `Toast.success/warning/danger` | idem, injetando `Toast` |
| `Modal.confirmation(msg, cb)` | `modal.confirmation(msg).subscribe(() => …)` |
| `onError(response)` / `after()` | métodos privados com os mesmos nomes, no fim da classe |
| `resource.situacoes = [{label, value}]` | `export const SITUACOES = [{label, value}]` no service |
| `panel panel-default` | classes `.painel` / `.painel-cabecalho` / `.painel-corpo` (globais) |
| `Grid.createGrid(callback, columnDefs, options)` | `<app-grid [colunas] [carregar] [filtro] />` |
| `gridOptions.refresh()` | `grid().recarregar()` (via `viewChild`) |
| `gridOptions.setFilter(criterios)` | input `[filtro]` — mudou, volta para a primeira página |
| `gridOptions.selectedRow` | output `(selecionou)` |
| `ParametrosGrid {offset, limit, sort}` | `ParametrosGrid` — mesmos nomes |
| `clientSidePaging: true` | `modo="cliente"` |

### O grid (`shared/components/grid`)

Cuida de paginação, quantidade por página, ordenação, seleção de linha,
estado de carregando e mensagem de vazio/erro. A tela só declara as colunas,
passa a função de busca e reage ao que foi selecionado.

```ts
protected readonly colunas: ColunaGrid<Usuario>[] = [
  { field: 'nome', titulo: 'Nome', ordenavel: true },
  { field: 'perfis', titulo: 'Perfis', valor: (l) => l.perfis.map(rotuloDoPerfil).join(', ') },
  { field: 'ativo', titulo: 'Situação',
    valor: (l) => (l.ativo ? 'Ativo' : 'Bloqueado'),
    classeDaCelula: (l) => (l.ativo ? '' : 'situacao-bloqueado') },
];
protected readonly carregar = (p: ParametrosGrid) => this.usuarioService.paginar(p);
```

`modo="servidor"` (padrão) refaz a busca a cada mudança de página;
`modo="cliente"` busca tudo uma vez e fatia em memória — é o que `usuario/`
usa enquanto `GET /usuarios` não pagina. Trocar de um para o outro mexe só no
service e no atributo `modo`; o componente da tela não muda.

**Cuidado com bundle**: não importe nada do Material em `app.config.ts`. O
`MatPaginatorIntl` traduzido é provido dentro do próprio grid justamente por
isso — importá-lo na config dobrou o bundle inicial (297 kB → 612 kB).

### Regras

1. **Ordem dentro do componente**: injeções, depois sinais de estado, depois
   constantes da tela (`entidade`, `steps`, `colunas`), depois `ngOnInit()`,
   depois as ações na ordem em que aparecem na botoeira, e por último
   `onError()` e `after()`. É a mesma leitura de cima para baixo .
2. **Nenhuma URL no componente**: base vem de `environment.apiUrl` e a chamada
   HTTP mora sempre no service do domínio. Componente não injeta `HttpClient`.
3. Os `models/` espelham os DTOs do back, com um comentário citando o record
   Java de origem. Nome de campo igual ao JSON, sem renomear no caminho.
4. Model e componente ficam no próprio domínio. Só sobem para `shared/`
   quando forem usados por 2+ domínios — nunca "por precaução".
5. `auth/` depende de `usuario/`, nunca o contrário — igual ao back.
6. Rotas do domínio em `<dominio>.routes.ts`, carregadas com `loadComponent`
   no `app.routes.ts`. O padrão de rota é `/<dominio>` para a listagem e
   `/<dominio>/:uri` para o formulário, onde `uri` é `novo` ou o id — mesmo
   esquema .
7. Sem sufixo `.component` nos arquivos: o Angular 21 gera `app.ts`/`app.html`
   e seguimos isso (`usuario.ts`, classe `Usuario`).
8. `router.navigate()` recebe **um segmento por item** do array:
   `['/usuarios', 'novo']`. `['/usuarios/novo']` numa string só não navega.

## Identidade visual

O visual vem do **Mini Raio-X do Preço Mínimo** (`~/workspace/codenest/RAIO X
RURAL/.../app_miniraiox_pronto`): verde floresta sobre fundo creme, cartões de
canto largo e sombra difusa, fonte Inter. A paleta do Material foi **gerada a
partir do mesmo `#1f6047`** (`src/styles/_theme-colors.scss`, via
`ng generate @angular/material:theme-color`), então componente pronto e classe
própria saem na mesma cor.

Tokens e classes ficam em `src/styles.scss`:

| Classe | Para que serve |
| --- | --- |
| `.hero` / `.hero-inner` / `.hero-copy` / `.hero-badges` | faixa verde de abertura, largura total |
| `.brand-row` / `.brand-mark` | marca com o quadrado de canto assimétrico |
| `.eyebrow` | rótulo em caixa-alta espaçada que abre cada bloco |
| `.main-content` | container central de 1180px |
| `.card` + `.card-heading` + `.step-number` | cartão branco aberto por número em quadrado verde |
| `.painel` / `.painel-cabecalho` / `.painel-corpo` | casca das telas administrativas (grid + botoeira) |
| `.primary-result` | bloco de destaque com gradiente verde e valor grande |
| `.result-metric` | mini-cartão indicador (label em cima, valor embaixo) |
| `.status-red` / `.status-yellow` / `.status-green` | estados do semáforo |
| `.field-help` / `.section-intro` | texto de apoio |

**O tom importa tanto quanto as cores**: no Raio-X os títulos são perguntas
("Como você vende?", "Quanto custa produzir e vender?"), todo campo tem texto
de ajuda e o resultado aparece como semáforo, não como número solto. Telas
novas seguem isso.

`.layout-conteudo` **não tem padding** de propósito — o hero precisa ir de
ponta a ponta. Cada tela envolve seu conteúdo em `.main-content`.

## Decisões já tomadas

- **Zoneless.** O `ng new` do Angular 21 não gera `zone.js` nem polyfills.
  `provideZonelessChangeDetection()` no `app.config.ts` é **obrigatório** —
  sem ele, nada que renderize fora de um evento do template chega a ser
  desenhado, e menu, dialog e select do Material simplesmente não abrem, sem
  erro nenhum no console.
- **Sem SSR.** O scaffold veio com `@angular/ssr` + express; foi removido.
- **Angular Material** 21.2.14, tema azure-blue. `@angular/animations` **não**
  é necessário (o `ng add` não o instala e o Material 21 usa animação CSS).
- **Node 20.19.6** (`~/.nvm/versions/node/v20.19.6`). O `node` do PATH padrão
  desta máquina é o v8.13.0, que quebra o npm no postinstall do esbuild.
- Autenticação por **Bearer no header**, não cookie: o CORS do back está com
  `access-control-allow-credentials: false`.

## Contratos do back já disponíveis

| Método | Rota | Perfil |
| --- | --- | --- |
| POST | `/auth/login` · `/auth/refresh` · `/auth/logout` | público |
| GET/PUT | `/auth/rate-limit` | ADMIN |
| POST/GET | `/usuarios` | ADMIN |
| GET/PUT/DELETE | `/usuarios/{id}` | ADMIN |
| PATCH | `/usuarios/{id}/bloquear` · `/desbloquear` | ADMIN |

Access token dura 15 min, refresh 7 dias com rotação. Erros vêm sempre como
`ErrorResponse`; login com excesso de tentativas devolve **429**, não 400.

**Limitação conhecida**: `GET /usuarios` devolve a lista inteira, sem
paginação nem filtro. A pesquisa da listagem é local (client-side). Para
chegar no grid paginado , o back precisa ganhar paginação e
filtros primeiro.
