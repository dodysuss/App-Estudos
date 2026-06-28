# App de Estudos

Aplicação web para organizar cursos e playlists de vídeos, acompanhar aulas, registrar progresso e manter anotações em Markdown.

## Tecnologias

- Next.js 15, React 19 e TypeScript
- Tailwind CSS, componentes Shadcn/UI e Lucide Icons
- Prisma ORM e PostgreSQL
- Docker Compose para o banco local
- Zod, Server Actions e Vitest

## Requisitos

- Node.js 20.9 ou mais recente
- npm 10 ou mais recente
- Docker Desktop

## Instalação local automatizada

Depois de clonar o projeto, execute:

```bash
npm install
npm run setup:local
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

O comando `setup:local` realiza automaticamente:

1. Criação do `.env` a partir do `.env.example`, somente quando ele ainda não existe.
2. Inicialização do Docker Desktop no Windows, se necessário.
3. Inicialização do PostgreSQL local na porta `54329`.
4. Espera pelo banco ficar saudável.
5. Geração do Prisma Client.
6. Aplicação das migrations pendentes.

O `.env` existente nunca é sobrescrito. O banco usa um volume persistente do Docker, portanto os dados sobrevivem à reinicialização do contêiner.

## Estratégia dos arquivos de ambiente

| Arquivo/local | Finalidade | Vai para o GitHub? |
| --- | --- | --- |
| `.env.example` | Configuração segura do PostgreSQL local | Sim |
| `.env` | Configuração ativa da máquina do desenvolvedor | Não |
| `.env.production.example` | Modelo das variáveis de produção | Sim |
| Vercel Environment Variables | Credenciais reais de produção | Não |

Nunca coloque senhas reais em `.env.example`, `.env.production.example`, commits, issues ou pull requests.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run setup:local` | Prepara `.env`, Docker, banco, migrations e Prisma |
| `npm run db:local:up` | Inicia apenas o banco local |
| `npm run db:local:stop` | Interrompe o banco sem apagar os dados |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o Prisma Client e cria o build de produção |
| `npm start` | Inicia o build de produção |
| `npm test` | Executa os testes unitários |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Cria/aplica migrations de desenvolvimento |
| `npm run db:deploy` | Aplica migrations existentes |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:reset` | Recria o banco e apaga seus dados |

## Funcionalidades

- Dashboard separado em Cursos e Playlists de vídeos
- Busca, filtros por status e ordenação
- Cadastro que preserva os campos preenchidos quando ocorre erro de validação
- Geração automática do checklist de aulas ou vídeos
- Progresso, próximo item e datas de conclusão
- Área de estudo individual em cada item
- Player para URLs `watch`, `youtu.be`, `embed` e `shorts` do YouTube
- Editor Markdown com pré-visualização e autosave
- Temas claro/escuro e layout responsivo

## Banco local

O PostgreSQL local é definido em `docker-compose.yml` e usa:

```env
DATABASE_URL="postgresql://app_estudos:app_estudos_local@localhost:54329/app_estudos"
DIRECT_URL="postgresql://app_estudos:app_estudos_local@localhost:54329/app_estudos"
```

Essas credenciais são apenas locais. Para inspecionar os dados:

```bash
npm run db:studio
```

## Produção na Vercel

Use PostgreSQL hospedado no Supabase, Neon, Railway ou em uma VPS. Na Vercel, configure `DATABASE_URL` e `DIRECT_URL` em **Project Settings → Environment Variables** para os ambientes Production, Preview e Development necessários.

- `DATABASE_URL`: conexão usada pela aplicação; com Supabase, prefira o pooler indicado pelo provedor.
- `DIRECT_URL`: conexão direta usada para operações de migration.

Após configurar as variáveis, aplique as migrations com acesso ao ambiente de produção:

```bash
npm run db:deploy
```

O arquivo `.env.production.example` mostra apenas o formato esperado e não deve receber credenciais reais.

## Estrutura

```text
scripts/
  setup-local.mjs  Preparação automática do ambiente local
src/
  actions/         Server Actions
  app/             Rotas do App Router
  components/      Interface e componentes
  lib/             Prisma, validações e regras de domínio
prisma/
  migrations/      Histórico versionado do banco
  schema.prisma    Modelagem dos dados
docker-compose.yml PostgreSQL local persistente
```

## Solução de problemas

- **Docker não iniciou:** abra o Docker Desktop e execute `npm run setup:local` novamente.
- **Porta 54329 ocupada:** encerre o processo que usa a porta ou ajuste a porta em `docker-compose.yml`, `.env.example` e `.env`.
- **Prisma Client não encontrado:** execute `npm run db:generate`.
- **Banco fora de sincronia:** execute `npm run db:deploy`.
- **Porta 3000 ocupada:** execute `npm run dev -- --port 3001`.
