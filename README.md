# App de Estudos

Aplicação web para organizar cursos, acompanhar aulas, assistir a vídeos do YouTube e manter anotações com salvamento automático.

## Tecnologias

- Next.js 15, React 19 e TypeScript
- Tailwind CSS, componentes no padrão Shadcn/UI e Lucide Icons
- Prisma ORM com PostgreSQL
- Zod e Server Actions
- Vitest

## Requisitos

- Node.js 20.9 ou mais recente
- npm 10 ou mais recente

## Instalação

```bash
git clone URL_DO_REPOSITORIO
cd app-de-estudos
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Também é possível executar toda a preparação de uma vez:

```bash
npm run setup
```

No PowerShell, copie o arquivo de ambiente com `Copy-Item .env.example .env`.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o Prisma Client e cria o build de produção |
| `npm start` | Inicia o build de produção |
| `npm test` | Executa os testes unitários |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Cria/aplica migrations de desenvolvimento |
| `npm run db:deploy` | Aplica migrations em produção |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:reset` | Recria o banco local (apaga os dados) |

## Funcionalidades

- Dashboard com métricas gerais, cursos recentes e continuação de estudos
- Busca, filtros por status e ordenação de cursos
- Cadastro com geração automática do checklist de aulas
- Progresso, próxima aula e datas de conclusão
- Área de estudo individual em cada aula
- Player para URLs `watch`, `youtu.be`, `embed` e `shorts` do YouTube
- Editor Markdown por aula com barra de ferramentas, pré-visualização e autosave
- Temas claro/escuro e layout responsivo

## Estrutura

```text
src/
  actions/       Server Actions de cursos, aulas e anotações
  app/           Rotas do App Router
  components/    Interface e componentes Shadcn/UI locais
  lib/           Prisma, validações e regras de domínio
prisma/
  migrations/    Histórico versionado do banco
  schema.prisma  Modelagem dos dados
```

## Banco de dados

O projeto está configurado para PostgreSQL por meio de:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/postgres"
```

Para inspecionar os dados, execute `npm run db:studio`.

### SQLite local

Se você quiser voltar ao fluxo original com SQLite local, altere o datasource em `prisma/schema.prisma` para:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

E use:

```env
DATABASE_URL="file:./dev.db"
```

Na Vercel, adicione `DATABASE_URL` em **Project Settings → Environment Variables** e use `npm run build` como comando de build. Nunca envie o arquivo `.env` ao GitHub.

## Publicar no GitHub

```bash
git init
git add .
git commit -m "Initial commit: App de Estudos"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

## Solução de problemas

- **`node` ou `npm` não reconhecido:** instale o Node.js LTS e reabra o terminal.
- **Prisma Client não encontrado:** execute `npm run db:generate`.
- **Banco fora de sincronia:** em desenvolvimento, execute `npm run db:migrate`. Use `npm run db:reset` somente se puder perder os dados locais.
- **Porta 3000 ocupada:** execute `npm run dev -- --port 3001`.
