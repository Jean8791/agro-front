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

  papel/                        -> domínio: o que cada pessoa pode fazer
    papel.ts / .html / .scss       LISTAGEM
    papel.service.ts               resource: CRUD + GET /papeis/permissoes
    papel.routes.ts
    models/
      papel.ts  permissao.ts       espelham PapelResponse e RecursoResponse
    show/                          FORMULÁRIO: nome + matriz recurso x ação

  produtor/                     -> domínio do produto (só super admin acessa)
    produtor.service.ts            resource: GET /produtores
    seletor/                       o seletor do cabeçalho
    models/produtor.ts

  auth/                         -> técnico acoplado a usuario (login/JWT)
    login/  auth.service.ts  auth.guard.ts  auth.interceptor.ts
    token-storage.ts  auth.routes.ts  models/
    permissoes.ts                  pode('usuario:inserir') — fonte única

  inicio/                       -> tela inicial pós-login

  shared/                       -> técnico, transversal a mais de um domínio
    layout/                        casca: barra lateral + cabeçalho + outlet
    tenant.ts                      produtor escolhido pelo super admin
    se-pode.ts                     diretiva *appSePode="'usuario:inserir'"
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
| `panel panel-default` | classes `.cartao` / `.cartao-cabecalho` / `.cartao-corpo` (globais) |
| `Grid.createGrid(callback, columnDefs, options)` | `<app-grid [colunas] [acoes] [carregar] [filtro] />` |
| `gridOptions.refresh()` | `grid().recarregar()` (via `viewChild`) |
| `gridOptions.setFilter(criterios)` | input `[filtro]` — mudou, volta para a primeira página |
| botoeira + `gridOptions.selectedRow` | input `[acoes]`: botão de ícone na própria linha |
| `ParametrosGrid {offset, limit, sort}` | `ParametrosGrid` — mesmos nomes |
| `clientSidePaging: true` | `modo="cliente"` |

### O grid (`shared/components/grid`)

Cuida de paginação, quantidade por página, ordenação, esqueleto de carregando
e mensagem de vazio/erro. A tela declara as colunas, as ações e a função de
busca.

**Não há botoeira.** O que age sobre um registro vira botão de ícone na coluna
Ações da própria linha — o alvo é sempre a linha em que o ícone está, sem o
passo de "selecione primeiro". Inserir fica no cabeçalho da tela, não na grid.
A coluna Ações some inteira quando nada nela está visível — o caso de quem só
tem permissão de consultar, que veria um título sobre o vazio.
`[selecionavel]="true"` traz de volta o realce de linha e o output
`(selecionou)`, para a tela que precisar do registro fora das ações.

```ts
protected readonly colunas: ColunaGrid<Usuario>[] = [
  // avatar + secundario montam a célula que identifica o registro
  { field: 'nome', titulo: 'Usuário', ordenavel: true,
    avatar: (l) => l.nome.slice(0, 2), secundario: (l) => l.email },
  { field: 'papel', titulo: 'Papel', valor: (l) => rotuloDoPapel(l.papel) },
  { field: 'ativo', titulo: 'Situação',
    valor: (l) => (l.ativo ? 'Ativo' : 'Bloqueado'),
    pill: (l) => (l.ativo ? 'verde' : 'vermelho') },
];

protected readonly acoes: AcaoGrid<Usuario>[] = [
  { icone: 'edit', titulo: 'Editar', tom: 'primario', executar: (l) => this.editar(l) },
  // ícone e título podem variar por linha
  { icone: (l) => (l.ativo ? 'lock' : 'lock_open'),
    titulo: (l) => (l.ativo ? 'Bloquear' : 'Desbloquear'),
    desabilitado: (l) => this.emOperacao() === l.id,
    executar: (l) => this.bloquear(l) },
  { icone: 'delete', titulo: 'Excluir', tom: 'perigo', executar: (l) => this.excluir(l) },
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
   constantes da tela (`entidade`, `steps`, `colunas`, `acoes`), depois
   `ngOnInit()`, depois as ações na ordem em que aparecem na tela, e por último
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

Painel administrativo em superfícies claras e neutras: fundo cinza-esverdeado
(`#f6f8f8`), cartões brancos de canto largo com sombra rasa, fonte Inter. A cor
da marca — **verde-petróleo `#0E3B3A`** — aparece só em blocos sólidos: barra
lateral, botão primário, avatar, ícone de destaque. A referência de linguagem é
o `marknow-web` (`~/workspace/codenest/marknow-web`, Next + Tailwind), de onde
vêm a casca, a densidade e o tratamento de tabela.

A paleta do Material foi **gerada a partir do mesmo `#0E3B3A`**
(`src/styles/_theme-colors.scss`, via `ng generate @angular/material:theme-color
--primary-color="#0E3B3A" --secondary-color="#155150" --tertiary-color="#34D399"
--neutral-color="#6B7280" --directory="src/styles"`). O tom 40 que ela gera
(`#3c6564`) é claro demais para o botão principal, então `:root` sobrescreve
`--mat-sys-primary` com a cor da marca — `:root` tem mais especificidade que o
`html` do `mat.theme`, e isso basta.

Tokens e classes ficam em `src/styles.scss`:

| Classe | Para que serve |
| --- | --- |
| `.pagina` | empilha o conteúdo da tela com o respiro padrão |
| `.pagina-cabecalho` + `.pagina-acoes` | título e subtítulo à esquerda, ação primária à direita |
| `.cartao` + `.cartao-corpo` / `-cabecalho` / `-rodape` | a superfície branca sobre a qual tudo acontece |
| `.pill` + `.verde` / `.vermelho` / `.ambar` / `.azul` / `.cinza` | rótulo curto de estado |
| `.indicador` | mini-cartão de número (ícone, rótulo miúdo, valor grande) |
| `.rotulo-micro` | rótulo em caixa-alta espaçada que abre um bloco |
| `.texto-apoio` / `.intro` | texto de apoio |
| `.botao-perigo` | botão preenchido em vermelho, para o que destrói |
| `.status-red` / `.status-yellow` / `.status-green` | estados soltos (erro, `classeDaCelula`) |

**Nada de hero em tela de trabalho.** A faixa de cor cheia existe só no login.
Toda tela interna abre com `.pagina-cabecalho`.

**O tom importa tanto quanto as cores**: títulos que são perguntas ("Quanto
precisa receber"), campo com texto de ajuda, resultado como semáforo e não como
número solto. Telas novas seguem isso.

### A casca (`shared/layout`)

Barra lateral fixa de 260px na cor da marca + cabeçalho branco de 76px +
conteúdo com teto de 1480px. Abaixo de 960px a barra sai do fluxo e vira
gaveta, aberta pelo botão de menu do cabeçalho, com véu para fechar clicando
fora. O item ativo do menu ganha fundo claro e uma barra de acento à esquerda.

O lado esquerdo do cabeçalho está vazio de propósito: é onde entraria a busca
global, e um campo de busca que não busca nada é pior do que espaço em branco.
Quando o back tiver esse endpoint, ele mora ali.

## Decisões já tomadas

- **Zoneless.** O `ng new` do Angular 21 não gera `zone.js` nem polyfills.
  `provideZonelessChangeDetection()` no `app.config.ts` é **obrigatório** —
  sem ele, nada que renderize fora de um evento do template chega a ser
  desenhado, e menu, dialog e select do Material simplesmente não abrem, sem
  erro nenhum no console.
- **Sem SSR.** O scaffold veio com `@angular/ssr` + express; foi removido.
- **Angular Material** 21.2.14, tema gerado a partir do `#0E3B3A` da marca.
  `@angular/animations` **não**
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
| POST/GET | `/produtores` · `/produtores/{id}` | SUPER_ADMIN |
| PATCH | `/produtores/{id}/inativar` · `/reativar` | SUPER_ADMIN |
| GET | `/papeis` · `/papeis/permissoes` · `/papeis/{id}` | `papel:listar` |
| POST/PUT/DELETE | `/papeis` · `/papeis/{id}` | `papel:inserir`/`editar`/`excluir` |

### Permissões

A partir de 13/08/2026 a autorização é por **permissão**, não por papel. O
papel virou tabela no back (um conjunto de permissões com nome) e a claim
`groups` do token carrega os códigos `recurso:acao` — `usuario:inserir`. O
super admin não tem papel e entra com o marcador `SUPER_ADMIN`, que passa em
tudo. A claim `papel` traz o nome do papel só para o cabeçalho exibir; **nada
decide por ela**.

Quatro lugares decidem o que aparece, e todos consultam o mesmo
`auth/permissoes.ts`:

| Onde | Como |
| --- | --- |
| rota | `canActivate: [permissaoGuard('papel:listar')]` — sempre a de listar |
| item do menu | campo `permissao` no `MENU` do `layout.ts` |
| botão do cabeçalho | `*appSePode="'usuario:inserir'"` |
| ação da linha | `visivel: () => this.permissoes.pode('usuario:excluir')` |

**Esconder botão é conforto, não segurança.** Quem barra é o `@RolesAllowed`
de cada endpoint — o front só evita mostrar o que responderia 403. Nunca
tratar a ausência do botão como garantia.

Ao criar uma tela nova: acrescentar recurso e permissões no back, e no front
só declarar o `permissaoGuard`, o item de menu e os `visivel` das ações. A
matriz da tela de papéis se monta sozinha a partir de
`GET /papeis/permissoes`.

### O super admin e o `produtorId`

Todo endpoint de `/usuarios` aceita `?produtorId=<uuid>`, e ele é
**obrigatório** quando quem chama é super admin — que não tem produtor no
token. Sem ele o back responde `Informe o produtor: super admin não tem um na
sessão`, e a tela inteira fica inútil.

Quem cuida disso é o `TenantContext` (`shared/tenant.ts`): guarda o produtor
escolhido no seletor do cabeçalho (`produtor/seletor/`, visível só para super
admin) e persiste em localStorage. O `usuario.service.ts` anexa `produtorId`
em toda chamada quando há produtor escolhido — na query string, exceto no
`POST /usuarios`, onde o campo pertence ao corpo (`UsuarioRequest.produtorId`).
Quem tem papel dentro de um produtor nunca escolhe nada, nada é anexado, e o
back usa o produtor do token.

Duas consequências para telas novas: a listagem não deve chamar o back
enquanto o super admin não escolher (`precisaEscolherProdutor` em
`usuario.ts`), e o `produtorId` entra no `[filtro]` do grid só para ele
perceber a troca de produtor e refazer a busca — quem envia ao back é o
service. `AuthService.sair()` limpa a escolha junto com os tokens.

Access token dura 15 min, refresh 7 dias com rotação. Erros vêm sempre como
`ErrorResponse`; login com excesso de tentativas devolve **429**, não 400.

**Limitação conhecida**: `GET /usuarios` devolve a lista inteira, sem
paginação nem filtro. A pesquisa da listagem é local (client-side). Para
chegar no grid paginado , o back precisa ganhar paginação e
filtros primeiro.
