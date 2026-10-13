# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bonsai Manager is a full-stack bonsai plant management application with a Node.js/Express backend and a **mobile-first web frontend** (`web/`, React + Vite + TypeScript). The React Native/Expo app in `mobile_app/` is **discontinued** — don't add features there. The project language (code comments, UI, docs) is **Portuguese**.

Production hosting (free tier): frontend on Cloudflare Pages, API on Vercel (`server/api/index.js` → compiled `dist/app`), Postgres on Neon, media on Cloudflare R2. See `docs/DEPLOY.md`.

Site em produção: https://bonsaimanager.pages.dev (deploy automático a partir da `main`) · API: https://bonsai-manager-ashen.vercel.app/api

### Testes no navegador (Claude in Chrome)

- Usar sempre a **conta de teste** `testeclaude@bonsai.dev` — nunca a conta pessoal do usuário. Nela pode criar, editar e apagar plantas/fotos/tarefas à vontade.
- A senha não fica no repositório: a sessão já fica logada no Chrome. Se expirar, pedir ao usuário para logar de novo.
- Imagens para upload em testes: `test-assets/` (fora do git).

## Commands

### Backend (server/)

All server commands run from `server/` or via Docker.

```bash
# Start backend + PostgreSQL (from project root)
docker compose up --build

# Run all tests
cd server && npm test

# Run tests for a specific module
cd server && npm test -- especie

# Run a single test file
cd server && npm test -- create-especie.use-case.test.ts

# Watch mode
cd server && npm run test:watch

# Coverage report
cd server && npm run test:coverage

# Dev server (outside Docker, requires local DB)
cd server && npm run dev

# Após mudar server/ com o Docker no Windows: o container não recarrega sozinho
docker restart bonsai_api

# Prisma commands
cd server && npm run prisma:generate
cd server && npm run prisma:migrate:dev
docker compose exec api npx prisma studio   # visual DB editor on port 5555
```

### Frontend web (web/)

```bash
cd web && npm install
cd web && npm run dev        # http://localhost:5173 (VITE_API_URL em web/.env, padrão http://localhost:3000/api)
cd web && npm run build      # tsc -b + vite build → web/dist
cd web && npm run lint       # oxlint
```

Structure: `src/lib/endpoints.ts` (all API calls), `src/lib/queries.ts` (TanStack Query hooks + cache keys), `src/lib/upload.ts` (compress → presigned URL → PUT direto no R2), `src/context/CareContext.tsx` (ações globais de cuidado: registrar → `/registrar`, agendar → `AgendarPage` `/agendar?planta=&repetir=1`, reagendar → `ReagendarSheet` (uma ou várias tarefas: nova data ou adiar N dias); Agendar/Reagendar mostram "Já marcado nesta planta" (`components/care/AgendaDaPlanta.tsx`, regras puras em `src/lib/agendaDaPlanta.ts`); `abrirTarefa` navega para `/tarefas/:id`), fluxos em etapas (Registrar, Concluir, Agendar): etapa em `?etapa=` com histórico via `src/components/fluxo/useEtapas.ts` (regras puras em `src/lib/fluxos.ts`), `FluxoLayout`, `MaisOpcoes` (recolhido, aberto/fechado no aparelho), desvio `AjustarPlantas` (2+ plantas) e preferência `mover_recem_transplantada` (última escolha, editável em Perfil → Preferências `/perfil/preferencias`, junto com dias de transplante e atividades favoritas `atividades_rastreadas` — `src/lib/favoritas.ts`, primeiro nos chips via `useAtividadesOrdenadas`), `src/pages/*` (incl. `BancadaPage` `/ ` (agrupa por grupo/tarefa/espécie e filtra por período — `src/lib/bancada.ts`; botão Acesso rápido no topo (ao lado de Preferências, abre a lista em gaveta) `components/bancada/AcessoRapido.tsx`, cartão da estação `components/bancada/EstacaoDoAno.tsx` (`estacaoAtual` em `src/lib/estacoes.ts`); atalhos na preferência `atalhos_bancada` (atividades + grupos/espécies + nome e descrição opcionais — a descrição vai como `detalhes` do cuidado; regras em `src/lib/atalhos.ts`) registram via `/agendas/registrar` e concluem pendentes atrasadas ou ≤ 7 dias), `TarefaPage` `/tarefas/:id` (tarefa pendente: `components/tarefa/PendentesDaPlanta.tsx` — planta, último cuidado e todas as pendentes com seleção para concluir/reagendar/excluir em lote, regras em `src/lib/tarefasDaPlanta.ts`; tarefa concluída: `components/cuidado/CuidadoFeito.tsx` — o cuidado do dia (`src/lib/cuidadoDoDia.ts`), deslizando entre os cuidados da planta, com edição/exclusão (`PUT /api/agendas/cuidado`, `POST /api/agendas/cuidado/excluir`); toda escrita de tarefa reavalia Recém transplantada pelo `Planta.transplanteAgendaId` (`planta/use-cases/reavaliar-grupos.ts`)), histórico agrupa por planta + dia (`src/lib/linhaDoTempo.ts`: item `cuidado`, `notasDoCuidado` com rótulo da tarefa, `tarefasDoDia`; registro grava descrição/obs. em todas as tarefas da planta), instrução do agendamento (`Agenda.detalhes` da pendente) vem pré-preenchida na Descrição/Nota do Concluir/Registrar — sem mudança é mantida, editada substitui (`src/lib/instrucao.ts`), `RegistrarPage` `/registrar?planta=` fotos → triagem por código → o que foi feito geral/planta; usa `POST /api/agendas/registrar` com `concluirAgendaIds` (pendentes da mesma planta+atividade, atrasadas ou ≤ 90 dias, escolhidas na tela, viram o registro — `dominio/reconciliar.ts`); "última vez" via `src/lib/cuidados.ts`, rotinas rolantes em `src/components/care/RepetirCampo.tsx` + `RotinaSheet.tsx` (API `/api/rotinas`, `POST /api/agendas/:id/pular`; regras puras em `server/src/modules/agenda/dominio/rotina.ts`), `ConcluirPage` `/concluir?ids=`, que usa `POST /api/agendas/concluir`: conclusão em lote; rotinas podem ter estações (`dominio/estacoes.ts`, sugestão pelo guia sazonal da espécie)), `src/lib/loteFotos.ts` + `src/components/TriagemFotos.tsx` (triagem fotos por código compartilhada lote/registrar; código novo → "Criar planta #X" criada só ao salvar), `POST /api/agendas/lote` aceita `plantaIds[]` + `detalhes` (observação agendamento). `Planta.especieId` opcional: planta sem espécie aparece topo Coleção com "!". `Planta.identificador` é `Int` obrigatório, único por usuário: sem ID na criação o servidor gera maior + 1 (`CreatePlantaUseCase`, nova tentativa em P2002); exibição via `plantaRotulo` (`#N`), `plantaCodigoNome` (`#N · nome`) e `plantaTitulo` (nome → espécie → `Planta #N`) em `src/lib/format.ts`. Styling: Tailwind v4, tokens em `src/index.css`. Visual "Caderno de sumi" (spec `2026-10-12-identidade-nagare-sumi-design.md`): peças em `web/public/arte`, ícones próprios em `web/public/icones` via `components/Icone.tsx` + `src/lib/icones.ts` (`iconeDaAtividade`), filtros de tinta em `components/FiltrosTinta.tsx` (raiz do App); `.chip-active` = mancha de tinta; novas peças pela skill `criando-assets-sumi`. Fase 3: `vasoDaPlanta` (`src/lib/arte.ts`) no `PlantThumb` sem foto (passe `id`), `EmptyState({ilustracao})`, `Spinner` ensō, `ErrorState({erro})` com `ErroDeRede` (`ehErroDeRede` em `lib/api.ts`, arte pré-carregada em `main.tsx`), `toast(texto, 'celebra')`. Fase 4: `ParticulasEstacao` no `Layout` (pétalas/folhas/neve atrás do conteúdo; regras puras em `src/lib/particulas.ts`; preferência no aparelho `bonsai_animacoes_sazonais` em Perfil → Preferências; desliga com `useMenosMovimento` de `src/lib/movimento.ts`; em dev, `localStorage.bonsai_estacao_teste` força a estação), tela da estação `components/bancada/EstacaoSheet.tsx` aberta pelo cartão `EstacaoDoAno` (`periodoDaEstacao`/`faltaParaProxima` em `src/lib/estacoes.ts`). Fase 5: nome **Nagare Bonsai · Caderno** (`short_name` "Nagare"); `Abertura` na raiz do App (uma vez por sessão, `sessionStorage` `nagare_abertura_vista`; vídeo `public/abertura.mp4` + marca; fases puras em `src/lib/abertura.ts`); favicon `icon.svg` = carimbo 流, ícones PNG do manifesto = fukinagashi + carimbo. Grupos fixos da planta (`Planta.grupo`, enum `GrupoPlanta`, um por planta): registrar Transplante com `moverRecemTransplantada` leva a "Recém transplantada" por `transplante_dias` (padrão 15) e depois volta ao `grupoAnterior` — resolvido na leitura de `GET /plantas` (`planta/dominio/grupo.ts`). Pré-transplante (`PRE_TRANSPLANTE`, automático): Transplante pendente a até `pre_transplante_dias` (padrão 30) põe a planta nele (`preTransplanteAgendaId` impede reentrada após troca manual) e ela sai quando não há mais transplante no prazo; `/concluir` também aceita `moverRecemTransplantada`. Comunidade (spec `2026-10-13-comunidade-design.md`; fase 1 = dados + privacidade): `Usuario.perfilPublico` (padrão false), `historicoPublico`, `postarAutomatico`; `Planta.plantaPublica` é a fonte da verdade ("Todas/Selecionadas" é derivado — `modoPlantas` em `src/lib/comunidade.ts`; `PUT /api/plantas/publicas`). Preferências → Comunidade (`components/comunidade/`), campo `components/planta/MostrarNaComunidade.tsx`. `Post` = planta + dia com foto, mantido por `SincronizarPostsUseCase` (`server/src/modules/comunidade/`, regras puras em `dominio/post.ts`: dia em America/Sao_Paulo, `noFeed` decidido ao nascer), chamado nos casos de uso de foto e via `emSequencia` junto do `reavaliar` de toda escrita de tarefa. Fase 2: aba `/comunidade` (Seguindo/Explorar, `?aba=`; sem ninguém seguido abre em Explorar; 3+ posts seguidos da mesma pessoa no mesmo dia agrupam — `agruparFeed` em `src/lib/comunidade.ts`), `/comunidade/post/:id`, `/comunidade/u/:id` (perfil público, seguir; "Ver meu perfil público" no Perfil), `/comunidade/planta/:id`, `/comunidade/buscar` (`pages/comunidade/`, cartões em `components/comunidade/`, rolagem infinita com `useFimDaLista`). API de leitura `GET /api/comunidade/{feed,posts/:id,usuarios/:id,usuarios/:id/posts,plantas/:id,buscar}` (regras puras em `server/src/modules/comunidade/dominio/{visibilidade,conteudo,montar}.ts`; invisível → 404). Seguir só perfil público. Ícone `comunidade` provisório (definitivo pela skill `criando-assets-sumi`).

### Backend extras

```bash
cd server && npm run build   # tsc -p tsconfig.build.json → dist/ (usado pela Vercel)
cd server && npm run seed    # atividades/insumos básicos; ADMIN_EMAIL=x promove usuário a ADMIN
```

`server/src/app.ts` monta o Express (exportado); `server/src/server.ts` só faz `listen` (dev/Docker). Prisma usa `DATABASE_URL` (pooled) + `DIRECT_URL` (migrations).

### Frontend legado (mobile_app/ — descontinuado)

```bash
cd mobile_app && npm install
cd mobile_app && npx expo run:android    # if there's new dependencies
cd mobile_app && npx expo start          # Metro Bundler
cd mobile_app && npm run android
cd mobile_app && npm run ios
cd mobile_app && npm run web
```

**Important**: Before running on a physical device, update the API base URL in `mobile_app/src/api/index.ts` to your local machine's IP address.

## Architecture

### Backend — Clean Architecture with Use Cases

The server follows a layered Clean Architecture. Each feature is a self-contained module under `server/src/modules/{moduleName}/`:

```
controllers/   → HTTP handlers (parse request, call use case, return response)
schemas/       → Zod validation schemas for request data
use-cases/     → Business logic classes (one class per action)
               → Co-located test files (*.use-case.test.ts)
repositories/  → Prisma data access (implements repository interface)
*.types.ts     → DTOs and repository interfaces
```

**Data flow**: Request → Controller → Schema validation → Use Case → Repository → Prisma → PostgreSQL

**Key conventions**:
- Use cases accept repository interfaces via constructor injection, making them testable with mocks
- Tests use the AAA pattern (Arrange-Act-Assert) with mocked repositories — no database needed
- Test setup in `server/src/test/setup.ts` globally mocks PrismaClient
- Controllers must NOT contain business logic; all domain rules live in use cases
- The `@/` path alias maps to `server/src/` (configured in tsconfig and jest)

### Middleware

- `server/src/middlewares/auth.middleware.ts` — JWT verification, attaches `req.user.userId`
- `server/src/middlewares/admin.middleware.ts` — Requires `ADMIN` role

### Database

- Schema defined in `server/prisma/schema.prisma` (~18 models)
- Key enums: `Role` (USER/ADMIN), `AgendaStatus`, `ModoAquisicao`, `Estacao`, `TipoPlanta`, `UnidadeMedida`
- Migrations applied automatically by `server/entrypoint.sh` on Docker startup

### Frontend — React Native + Expo

```
mobile_app/
├── App.tsx                        # Root: AuthProvider → AppNavigator
├── src/
│   ├── api/index.ts               # Axios instance with JWT token injection
│   ├── context/AuthContext.tsx     # Global auth state (React Context + AsyncStorage)
│   ├── navigation/AppNavigator.tsx # Stack + bottom tab navigation
│   ├── screens/                   # Screen components (auth, app, admin)
│   ├── components/                # Shared UI components
│   ├── constants/theme.ts         # Color palette, spacing, typography
│   ├── services/                  # API interaction helpers
│   └── types/index.ts             # TypeScript types mirroring backend DTOs
```

Navigation structure: unauthenticated users see Login/Register; authenticated users get a bottom tab navigator with Collection, Agenda, Inventory, Encyclopedia, Community, and Profile tabs. Admin users additionally see an admin panel.

### Infrastructure

- `docker-compose.yml` orchestrates PostgreSQL (port 5432) and the API (port 3000)
- API container mounts `./server` for hot-reloading via ts-node-dev
- Swagger docs available at `http://localhost:3000/api/docs` when server is running

## Adding a New Backend Module

1. Create the module directory under `server/src/modules/{name}/`
2. Define types/DTOs in `{name}.types.ts` and repository interface
3. Write use case tests first (TDD approach — the project follows Red-Green-Refactor)
4. Implement use cases, repository (Prisma), controller, schemas, and router
5. Register the router in `server/src/server.ts` under the `/api` prefix
6. Add Prisma model to `schema.prisma` and run migrations if needed

## commands

- eas build --platform android --profile preview na pasta /mobile_app para gerar o apk 

## TODO

- Species suggestion - DONE
- Midia storage management - DONE
- Improve error logs for api
- Add photos while creating a plant - DONE
- Virtual styling for future vision - DONE
- Lack of recurrence on the events
- Register multiple tasks - DONE
- Onboarding questions for especification - DONE/precisa melhorar
- Fotos em lote: no fim do lote, oferecer "registrar cuidado nas plantas tocadas" (via CareContext) para as plantas que receberam fotos