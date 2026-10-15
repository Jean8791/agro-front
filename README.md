# agro-front

Front-end da plataforma de gestão para o agronegócio. Consome a API [agro-back](https://github.com/Jean8791/agro-back) e traz a **calculadora de preço mínimo (Raio-X)**, além dos cadastros de produtores, usuários e papéis.

## Stack

- **Angular 21**: componentes standalone, *zoneless* (sem Zone.js) e sem SSR
- **TypeScript**
- **Angular Material**
- **Vitest** para testes unitários
- RxJS

## Funcionalidades

- **Login** com access token e refresh token. Um interceptor HTTP injeta o token em toda chamada e, no primeiro `401`, renova o token uma vez e refaz a requisição automaticamente.
- **Controle de acesso** por guards de rota: `authGuard` (logado), `permissaoGuard` (permissão específica do papel) e `superAdminGuard` (área de administração).
- **Seletor de produtor** para o super admin alternar entre clientes (multi-tenant).
- **Raio-X:**
  - **Calculadora de preço mínimo** a partir dos custos do produto, com resultado em semáforo (vermelho, amarelo, verde). O motor de cálculo é coberto por testes.
  - **Simulações** salvas, com listagem e detalhe.
  - **Catálogo de produtos** e **checklist de custos**.
- **Cadastros** de produtores, usuários e papéis, com uma **matriz de permissões** (recurso × ação) na edição de papel.
- **Componentes compartilhados:** grid com paginação, ordenação e busca, breadcrumb, loader, modal de confirmação e layout.

## Estrutura

Organização **por funcionalidade**: cada domínio é uma pasta autocontida com listagem, formulário, service e models.

```
src/app/
├── auth/        login, guards, interceptor, armazenamento do token
├── inicio/
├── produtor/    listagem, formulário (show/) e seletor de produtor
├── usuario/
├── papel/       listagem e formulário com matriz de permissões
├── raiox/
│   ├── calculadora/   motor de cálculo (calculo.ts) e tela
│   ├── simulacoes/
│   ├── produto/
│   └── checklist/
└── shared/      grid, breadcrumb, loader, confirmação, layout
```

Em cada domínio, o componente da raiz é a **listagem**, a pasta `show/` é o **formulário** (inserir e editar na mesma tela) e `models/` espelha os DTOs do back.

## Como rodar

### Pré-requisitos

- Node.js 20+ e npm
- O [agro-back](https://github.com/Jean8791/agro-back) rodando em `http://localhost:8090`

### Instalação

```bash
npm install
```

### Servidor de desenvolvimento

```bash
npm start
```

Acesse `http://localhost:4200`. Em desenvolvimento a API usada é a de `src/environments/environment.development.ts` (`http://localhost:8090`).

### Testes

```bash
npm test
```

### Build de produção

```bash
npm run build
```

Os arquivos ficam em `dist/`. A URL da API de produção é configurada em `src/environments/environment.ts`.
