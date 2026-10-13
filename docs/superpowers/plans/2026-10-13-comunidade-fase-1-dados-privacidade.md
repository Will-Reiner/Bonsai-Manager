# Comunidade · Fase 1 (dados + privacidade) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gravar tudo o que a Comunidade vai precisar (configurações de compartilhamento do usuário, planta pública, um `Post` por planta+dia com foto) e dar ao usuário os controles de privacidade — sem nenhuma tela social ainda.

**Architecture:** Novo módulo `server/src/modules/comunidade/` com regras puras em `dominio/post.ts` (dia do post no fuso de São Paulo, decisão de `noFeed`, plano de criar/apagar posts) e um `SincronizarPostsUseCase` idempotente que recalcula os posts de uma planta a partir das fotos. Ele é chamado pelos casos de uso de foto (criar/apagar) e, via `emSequencia`, junto da reavaliação de grupos que toda escrita de tarefa já dispara. No web, uma seção "Comunidade" nas Preferências e um campo "Mostrar na comunidade" nos formulários de planta.

**Tech Stack:** Node/Express + Prisma (Postgres/Neon) + Zod + Jest no `server/`; React + Vite + TanStack Query + Tailwind v4 + Vitest no `web/`.

**Spec:** `docs/superpowers/specs/2026-10-13-comunidade-design.md`

## Global Constraints

- Idioma do código, comentários, UI e commits: **português**.
- Fuso do "dia": `America/Sao_Paulo`.
- `perfilPublico` padrão **`false`**; migração põe `false` em todas as contas existentes.
- `historicoPublico Boolean @default(false)`, `postarAutomatico Boolean @default(true)` no `Usuario`.
- `noFeed = false` só se `perfilPublico && plantaPublica && postarAutomatico && dia ≥ hoje − 7 dias`, decidido uma vez quando o post nasce.
- Foto sem planta e foto `tipo = VISAO_FUTURA` não geram post.
- "Todas / Selecionadas" não é guardado: é derivado das plantas.
- Toggle "Mostrar na comunidade" na criação vem **marcado por padrão** e só aparece com perfil público.
- Backend segue Clean Architecture do projeto: controller → schema Zod → use case (repositórios injetados) → repositório Prisma. Testes de use case com repositórios mockados (AAA), sem banco.
- Trabalhar direto na `main`; **push = deploy** (pedir confirmação antes do push).
- Testar no navegador só com a conta `testeclaude@bonsai.dev`.

## Review Focus

- Foto tirada às 23h30 em São Paulo (02h30 UTC do dia seguinte) → post no **mesmo** dia local, não no seguinte. (Task 2)
- Foto de um cuidado concluído cuja data foi editada → o post muda para o novo dia e o post do dia antigo some (se ficou sem fotos). (Task 2: `planejarPosts`)
- Apagar uma de duas fotos do dia mantém o post; apagar a última apaga. (Task 2 e Task 4)
- Falha ao sincronizar posts depois de subir uma foto **não** pode fazer o upload responder erro (o usuário tentaria de novo e duplicaria a foto). (Task 3)
- `PUT /plantas/publicas` com id de planta de outro usuário não pode mexer na planta dele. (Task 6)

---

## File Structure

**Server — criar**
- `server/prisma/migrations/20261013120000_comunidade_posts/migration.sql` — colunas do `Usuario`, tabela `Post`, posts das fotos existentes.
- `server/src/modules/comunidade/dominio/post.ts` — regras puras: `diaLocal`, `diaDoPost`, `decidirNoFeed`, `planejarPosts`.
- `server/src/modules/comunidade/dominio/post.test.ts`
- `server/src/modules/comunidade/comunidade.types.ts` — `PostsRepository`, `EstadoPostsDaPlanta`, `SincronizadorDePosts`.
- `server/src/modules/comunidade/use-cases/sincronizar-posts.use-case.ts` + `.test.ts`
- `server/src/modules/comunidade/repositories/prisma-posts.repository.ts`
- `server/src/modules/comunidade/sincronizar-posts.ts` — fábrica `criarSincronizadorDePosts()`.
- `server/src/modules/planta/use-cases/definir-plantas-publicas.use-case.ts` + `.test.ts`

**Server — modificar**
- `server/prisma/schema.prisma` — `Usuario` (+2 campos, default), `Planta.posts`, `Post`.
- `server/src/modules/planta/use-cases/reavaliar-grupos.ts` — `emSequencia`.
- `server/src/modules/planta/use-cases/reavaliar-grupos.test.ts` — teste de `emSequencia`.
- `server/src/modules/agenda/agenda.controller.ts` — `reavaliar` = grupos + posts.
- `server/src/modules/foto/use-cases/create-foto.use-case.ts`, `delete-foto.use-case.ts` (+ testes), `foto.controller.ts`.
- `server/src/modules/auth/auth.schema.ts`, `types/auth.types.ts`, `repositories/prisma-auth.repository.ts`, `server/src/docs/swagger.ts`.
- `server/src/modules/planta/types/planta.types.ts`, `repositories/prisma-planta.repository.ts`, `planta.schema.ts`, `planta.controller.ts`, `planta.router.ts`, `use-cases/index.ts`.

**Web — criar**
- `web/src/lib/comunidade.ts` + `comunidade.test.ts` — `modoPlantas`.
- `web/src/components/comunidade/ComunidadePreferencias.tsx` — seção das Preferências.
- `web/src/components/comunidade/SelecionarPlantasSheet.tsx` — gaveta de seleção.
- `web/src/components/planta/MostrarNaComunidade.tsx` — campo dos formulários de planta.

**Web — modificar**
- `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/components/ui.tsx` (componente `Opcao`), `web/src/pages/ProfilePages.tsx`, `web/src/pages/AddPlantPage.tsx`, `web/src/pages/EditPlantPage.tsx`, `CLAUDE.md`.

---

### Task 1: Banco — campos do usuário, tabela `Post` e posts das fotos existentes

**Files:**
- Modify: `server/prisma/schema.prisma` (models `Usuario` ~L97, `Planta` ~L155; novo model `Post` depois de `Foto`)
- Create: `server/prisma/migrations/20261013120000_comunidade_posts/migration.sql`

**Interfaces:**
- Produces: `prisma.post` (`id`, `usuarioId`, `plantaId`, `dia: Date` (`@db.Date`), `publicadoEm`, `noFeed`, `createdAt`), `Usuario.historicoPublico`, `Usuario.postarAutomatico`, relações `Usuario.posts`, `Planta.posts`.

- [ ] **Step 1: Editar o schema**

Em `model Usuario`, trocar `perfilPublico      Boolean   @default(true)` por:
```prisma
  perfilPublico      Boolean   @default(false)
  /// Cuidados aparecem nos posts e na página pública da planta.
  historicoPublico   Boolean   @default(false)
  /// Posts novos entram no feed (só com perfil público).
  postarAutomatico   Boolean   @default(true)
```
e na lista de relacionamentos do `Usuario` acrescentar `posts              Post[]`.

Em `model Planta`, nos relacionamentos (depois de `rotinas     Rotina[]`) acrescentar `posts       Post[]`.

Depois do `model Foto { ... }`, acrescentar:
```prisma
/// Uma planta num dia com foto (Comunidade). Conteúdo lido na hora de Foto/Agenda; nada copiado.
model Post {
  id          String   @id @default(uuid())
  /// Dia local (America/Sao_Paulo).
  dia         DateTime @db.Date
  /// Quando o post nasceu; ordena o feed.
  publicadoEm DateTime @default(now())
  /// true = só na página da planta/perfil, fora do feed.
  noFeed      Boolean
  createdAt   DateTime @default(now())

  usuarioId   String
  usuario     Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  plantaId    String
  planta      Planta   @relation(fields: [plantaId], references: [id], onDelete: Cascade)

  @@unique([plantaId, dia])
  @@index([noFeed, publicadoEm])
  @@index([usuarioId, publicadoEm])
}
```

- [ ] **Step 2: Escrever a migração à mão**

`server/prisma/migrations/20261013120000_comunidade_posts/migration.sql`:
```sql
-- Comunidade: perfil privado por padrão e preferências de compartilhamento
ALTER TABLE "Usuario" ALTER COLUMN "perfilPublico" SET DEFAULT false;
UPDATE "Usuario" SET "perfilPublico" = false;
ALTER TABLE "Usuario" ADD COLUMN "historicoPublico" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Usuario" ADD COLUMN "postarAutomatico" BOOLEAN NOT NULL DEFAULT true;

-- Post: uma planta num dia com foto
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noFeed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Post_plantaId_dia_key" ON "Post"("plantaId", "dia");
CREATE INDEX "Post_noFeed_publicadoEm_idx" ON "Post"("noFeed", "publicadoEm");
CREATE INDEX "Post_usuarioId_publicadoEm_idx" ON "Post"("usuarioId", "publicadoEm");
ALTER TABLE "Post" ADD CONSTRAINT "Post_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Posts das fotos que já existem, todos fora do feed (mesma regra de dia de dominio/post.ts:
-- foto de cuidado concluído usa o dia do cuidado; senão captura ?? upload; visão futura não conta)
INSERT INTO "Post" ("id", "usuarioId", "plantaId", "dia", "noFeed")
SELECT gen_random_uuid()::text, p."usuarioId", d."plantaId", d."dia", true
FROM (
  SELECT DISTINCT f."plantaId",
    ((CASE WHEN a."status" = 'CONCLUIDO' THEN COALESCE(a."dataConcluida", a."dataAgendada")
           ELSE COALESCE(f."dataCaptura", f."createdAt") END)
      AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date AS "dia"
  FROM "Foto" f
  LEFT JOIN "Agenda" a ON a."id" = f."agendaId"
  WHERE f."plantaId" IS NOT NULL AND f."tipo" <> 'VISAO_FUTURA'
) d
JOIN "Planta" p ON p."id" = d."plantaId";
```

- [ ] **Step 3: Aplicar no banco local e conferir que schema e migração batem**

Run (na raiz): `docker compose up -d` e depois `docker restart bonsai_api` (o entrypoint aplica as migrações).
Run: `docker compose exec api npx prisma migrate status`
Expected: `Database schema is up to date!`
Run: `docker compose exec api npx prisma migrate dev --create-only --name conferencia`
Expected: `Already in sync, no schema change or pending migration was found.` (se criar uma pasta nova, o SQL à mão divergiu do schema: comparar, corrigir o `migration.sql` e apagar a pasta gerada).
Run: `docker compose exec db psql -U bonsai_user -d bonsai_db -c 'select count(*), bool_and("noFeed") from "Post";'`
Expected: contagem > 0 se há fotos locais e `bool_and = t`.

- [ ] **Step 4: Gerar o client e rodar os testes**

Run: `cd server && npm run prisma:generate && npm test`
Expected: todos passam (nada usa os campos novos ainda).

- [ ] **Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/20261013120000_comunidade_posts
git commit -m "feat(server): tabela Post e preferências de compartilhamento do usuário"
```

---

### Task 2: Regras puras do post

**Files:**
- Create: `server/src/modules/comunidade/dominio/post.ts`
- Test: `server/src/modules/comunidade/dominio/post.test.ts`

**Interfaces:**
- Produces:
  - `diaLocal(data: Date): string` — `"AAAA-MM-DD"` em São Paulo.
  - `interface FotoParaPost { tipo: string; dataCaptura: Date | null; createdAt: Date; agenda: { status: string; dataConcluida: Date | null; dataAgendada: Date } | null }`
  - `diaDoPost(f: FotoParaPost): string | null`
  - `interface Compartilhamento { perfilPublico: boolean; plantaPublica: boolean; postarAutomatico: boolean }`
  - `DIAS_NO_FEED = 7`
  - `decidirNoFeed(c: Compartilhamento, dia: string, hoje: string): boolean`
  - `interface PlanoPosts { criar: { dia: string; noFeed: boolean }[]; apagar: string[] }`
  - `planejarPosts(fotos: FotoParaPost[], diasComPost: string[], c: Compartilhamento, agora: Date): PlanoPosts`

- [ ] **Step 1: Escrever os testes**

```ts
import { decidirNoFeed, diaDoPost, diaLocal, FotoParaPost, planejarPosts } from './post';

const foto = (over: Partial<FotoParaPost> = {}): FotoParaPost => ({
  tipo: 'FOTO',
  dataCaptura: null,
  createdAt: new Date('2026-10-10T15:00:00Z'),
  agenda: null,
  ...over,
});
const publico = { perfilPublico: true, plantaPublica: true, postarAutomatico: true };

describe('diaLocal', () => {
  it('23h30 em São Paulo continua no mesmo dia (02h30 UTC do seguinte)', () => {
    expect(diaLocal(new Date('2026-10-11T02:30:00Z'))).toBe('2026-10-10');
  });
  it('meio-dia UTC é o mesmo dia', () => {
    expect(diaLocal(new Date('2026-10-10T12:00:00Z'))).toBe('2026-10-10');
  });
});

describe('diaDoPost', () => {
  it('usa a data de captura quando há', () => {
    expect(diaDoPost(foto({ dataCaptura: new Date('2026-09-01T15:00:00Z') }))).toBe('2026-09-01');
  });
  it('sem captura usa a data de upload', () => {
    expect(diaDoPost(foto())).toBe('2026-10-10');
  });
  it('foto de cuidado concluído usa o dia do cuidado, não o da captura', () => {
    const f = foto({
      dataCaptura: new Date('2026-09-01T15:00:00Z'),
      agenda: { status: 'CONCLUIDO', dataConcluida: new Date('2026-10-05T15:00:00Z'), dataAgendada: new Date('2026-10-01T15:00:00Z') },
    });
    expect(diaDoPost(f)).toBe('2026-10-05');
  });
  it('cuidado concluído sem dataConcluida usa a dataAgendada', () => {
    const f = foto({ agenda: { status: 'CONCLUIDO', dataConcluida: null, dataAgendada: new Date('2026-10-01T15:00:00Z') } });
    expect(diaDoPost(f)).toBe('2026-10-01');
  });
  it('foto de tarefa pendente segue a própria data', () => {
    const f = foto({ agenda: { status: 'PENDENTE', dataConcluida: null, dataAgendada: new Date('2026-12-01T15:00:00Z') } });
    expect(diaDoPost(f)).toBe('2026-10-10');
  });
  it('visão futura não gera post', () => {
    expect(diaDoPost(foto({ tipo: 'VISAO_FUTURA' }))).toBeNull();
  });
});

describe('decidirNoFeed', () => {
  it('tudo público e recente → entra no feed', () => {
    expect(decidirNoFeed(publico, '2026-10-13', '2026-10-13')).toBe(false);
  });
  it('7 dias atrás ainda entra; 8 não', () => {
    expect(decidirNoFeed(publico, '2026-10-06', '2026-10-13')).toBe(false);
    expect(decidirNoFeed(publico, '2026-10-05', '2026-10-13')).toBe(true);
  });
  it.each([
    ['perfil privado', { ...publico, perfilPublico: false }],
    ['planta privada', { ...publico, plantaPublica: false }],
    ['sem postar automaticamente', { ...publico, postarAutomatico: false }],
  ])('%s → fora do feed', (_nome, c) => {
    expect(decidirNoFeed(c, '2026-10-13', '2026-10-13')).toBe(true);
  });
});

describe('planejarPosts', () => {
  const agora = new Date('2026-10-13T15:00:00Z');

  it('cria post para dia novo com foto, decidindo o feed', () => {
    const plano = planejarPosts([foto({ createdAt: agora })], [], publico, agora);
    expect(plano).toEqual({ criar: [{ dia: '2026-10-13', noFeed: false }], apagar: [] });
  });
  it('segunda foto no mesmo dia não cria de novo', () => {
    const plano = planejarPosts([foto({ createdAt: agora }), foto({ createdAt: agora })], ['2026-10-13'], publico, agora);
    expect(plano).toEqual({ criar: [], apagar: [] });
  });
  it('dia sem foto perde o post', () => {
    const plano = planejarPosts([foto({ createdAt: agora })], ['2026-10-13', '2026-10-01'], publico, agora);
    expect(plano).toEqual({ criar: [], apagar: ['2026-10-01'] });
  });
  it('cuidado com data editada: post muda de dia', () => {
    const f = foto({ agenda: { status: 'CONCLUIDO', dataConcluida: new Date('2026-10-12T15:00:00Z'), dataAgendada: agora } });
    const plano = planejarPosts([f], ['2026-10-11'], publico, agora);
    expect(plano).toEqual({ criar: [{ dia: '2026-10-12', noFeed: false }], apagar: ['2026-10-11'] });
  });
  it('foto antiga em lote nasce fora do feed', () => {
    const plano = planejarPosts([foto({ dataCaptura: new Date('2026-08-01T15:00:00Z') })], [], publico, agora);
    expect(plano.criar).toEqual([{ dia: '2026-08-01', noFeed: true }]);
  });
  it('só visão futura: nada a criar', () => {
    expect(planejarPosts([foto({ tipo: 'VISAO_FUTURA' })], [], publico, agora)).toEqual({ criar: [], apagar: [] });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npm test -- comunidade/dominio/post`
Expected: FAIL — `Cannot find module './post'`.

- [ ] **Step 3: Implementar**

```ts
// Regras puras dos posts da Comunidade (uma planta num dia com foto).

export const FUSO = 'America/Sao_Paulo';
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' });

/** "AAAA-MM-DD" do instante no fuso de São Paulo. */
export function diaLocal(data: Date): string {
  return formatoDia.format(data);
}

export interface FotoParaPost {
  tipo: string;
  dataCaptura: Date | null;
  createdAt: Date;
  agenda: { status: string; dataConcluida: Date | null; dataAgendada: Date } | null;
}

/**
 * Dia do post de uma foto — mesma regra do histórico (`web/src/lib/linhaDoTempo.ts`): foto de cuidado concluído
 * fica no dia do cuidado; as demais, no dia da captura (ou do upload). Visão futura não gera post (null).
 */
export function diaDoPost(f: FotoParaPost): string | null {
  if (f.tipo === 'VISAO_FUTURA') return null;
  const data = f.agenda?.status === 'CONCLUIDO' ? f.agenda.dataConcluida ?? f.agenda.dataAgendada : f.dataCaptura ?? f.createdAt;
  return diaLocal(data);
}

export interface Compartilhamento {
  perfilPublico: boolean;
  plantaPublica: boolean;
  postarAutomatico: boolean;
}

/** Até quantos dias atrás um post novo ainda entra no feed (lote de fotos antigas não inunda). */
export const DIAS_NO_FEED = 7;

const diasEntre = (de: string, ate: string) => Math.round((Date.parse(ate) - Date.parse(de)) / 86_400_000);

/** Decidido uma vez, quando o post nasce: fora do feed salvo se tudo é público, automático e recente. */
export function decidirNoFeed(c: Compartilhamento, dia: string, hoje: string): boolean {
  const recente = diasEntre(dia, hoje) <= DIAS_NO_FEED;
  return !(c.perfilPublico && c.plantaPublica && c.postarAutomatico && recente);
}

export interface PlanoPosts {
  criar: { dia: string; noFeed: boolean }[];
  apagar: string[];
}

/** Compara os dias com foto da planta com os posts que ela tem: cria os que faltam e apaga os que sobram. */
export function planejarPosts(fotos: FotoParaPost[], diasComPost: string[], c: Compartilhamento, agora: Date): PlanoPosts {
  const dias = new Set(fotos.map(diaDoPost).filter((d): d is string => d !== null));
  const existentes = new Set(diasComPost);
  const hoje = diaLocal(agora);
  return {
    criar: [...dias]
      .filter((d) => !existentes.has(d))
      .sort()
      .map((dia) => ({ dia, noFeed: decidirNoFeed(c, dia, hoje) })),
    apagar: [...existentes].filter((d) => !dias.has(d)).sort(),
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd server && npm test -- comunidade/dominio/post`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/comunidade/dominio
git commit -m "feat(server): regras puras dos posts da Comunidade"
```

---

### Task 3: `SincronizarPostsUseCase` + repositório Prisma

**Files:**
- Create: `server/src/modules/comunidade/comunidade.types.ts`
- Create: `server/src/modules/comunidade/use-cases/sincronizar-posts.use-case.ts`
- Test: `server/src/modules/comunidade/use-cases/sincronizar-posts.use-case.test.ts`
- Create: `server/src/modules/comunidade/repositories/prisma-posts.repository.ts`
- Create: `server/src/modules/comunidade/sincronizar-posts.ts`

**Interfaces:**
- Consumes: `planejarPosts`, `FotoParaPost`, `Compartilhamento`, `PlanoPosts` (Task 2); `Db` de `server/src/modules/planta/use-cases/reavaliar-grupos.ts`.
- Produces:
  - `interface SincronizadorDePosts { execute(tocadas: { plantaIds: string[] }, usuarioId?: string, db?: Db): Promise<void> }` (compatível com `ReavaliadorDeGrupos`).
  - `class SincronizarPostsUseCase implements SincronizadorDePosts` — `constructor(repo: PostsRepository, agora?: () => Date)`.
  - `criarSincronizadorDePosts(): SincronizarPostsUseCase`.

- [ ] **Step 1: Tipos do módulo**

`server/src/modules/comunidade/comunidade.types.ts`:
```ts
import type { Db } from '../planta/use-cases/reavaliar-grupos';
import type { Compartilhamento, FotoParaPost, PlanoPosts } from './dominio/post';

export interface EstadoPostsDaPlanta extends Compartilhamento {
  plantaId: string;
  usuarioId: string;
  fotos: FotoParaPost[];
  /** Dias ("AAAA-MM-DD") que já têm post. */
  diasComPost: string[];
}

export interface PostsRepository {
  estadoDasPlantas(plantaIds: string[], db?: Db): Promise<EstadoPostsDaPlanta[]>;
  aplicar(plantaId: string, usuarioId: string, plano: PlanoPosts, db?: Db): Promise<void>;
}

/** Quem grava fotos ou tarefas chama no fim, com as plantas tocadas. */
export interface SincronizadorDePosts {
  execute(tocadas: { plantaIds: string[] }, usuarioId?: string, db?: Db): Promise<void>;
}
```

- [ ] **Step 2: Escrever os testes do caso de uso**

```ts
import { SincronizarPostsUseCase } from './sincronizar-posts.use-case';
import { EstadoPostsDaPlanta, PostsRepository } from '../comunidade.types';

describe('SincronizarPostsUseCase', () => {
  const agora = new Date('2026-10-13T15:00:00Z');
  let repo: jest.Mocked<PostsRepository>;
  let useCase: SincronizarPostsUseCase;

  const estado = (over: Partial<EstadoPostsDaPlanta> = {}): EstadoPostsDaPlanta => ({
    plantaId: 'p1',
    usuarioId: 'u1',
    perfilPublico: true,
    plantaPublica: true,
    postarAutomatico: true,
    fotos: [{ tipo: 'FOTO', dataCaptura: null, createdAt: agora, agenda: null }],
    diasComPost: [],
    ...over,
  });

  beforeEach(() => {
    repo = { estadoDasPlantas: jest.fn(), aplicar: jest.fn().mockResolvedValue(undefined) };
    useCase = new SincronizarPostsUseCase(repo, () => agora);
  });

  it('cria o post do dia novo', async () => {
    repo.estadoDasPlantas.mockResolvedValue([estado()]);
    await useCase.execute({ plantaIds: ['p1'] });
    expect(repo.estadoDasPlantas).toHaveBeenCalledWith(['p1'], undefined);
    expect(repo.aplicar).toHaveBeenCalledWith('p1', 'u1', { criar: [{ dia: '2026-10-13', noFeed: false }], apagar: [] }, undefined);
  });

  it('nada muda → não escreve', async () => {
    repo.estadoDasPlantas.mockResolvedValue([estado({ diasComPost: ['2026-10-13'] })]);
    await useCase.execute({ plantaIds: ['p1'] });
    expect(repo.aplicar).not.toHaveBeenCalled();
  });

  it('última foto do dia apagada → apaga o post', async () => {
    repo.estadoDasPlantas.mockResolvedValue([estado({ fotos: [], diasComPost: ['2026-10-13'] })]);
    await useCase.execute({ plantaIds: ['p1'] });
    expect(repo.aplicar).toHaveBeenCalledWith('p1', 'u1', { criar: [], apagar: ['2026-10-13'] }, undefined);
  });

  it('ignora ids vazios/repetidos e não consulta sem plantas', async () => {
    await useCase.execute({ plantaIds: ['', ''] });
    expect(repo.estadoDasPlantas).not.toHaveBeenCalled();
    repo.estadoDasPlantas.mockResolvedValue([]);
    await useCase.execute({ plantaIds: ['p1', 'p1', ''] });
    expect(repo.estadoDasPlantas).toHaveBeenCalledWith(['p1'], undefined);
  });

  it('fora de transação, falha só vai para o log (não derruba quem chamou)', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    repo.estadoDasPlantas.mockRejectedValue(new Error('banco caiu'));
    await expect(useCase.execute({ plantaIds: ['p1'] })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('dentro de transação, a falha sobe (desfaz junto)', async () => {
    const db = {} as never;
    repo.estadoDasPlantas.mockRejectedValue(new Error('banco caiu'));
    await expect(useCase.execute({ plantaIds: ['p1'] }, 'u1', db)).rejects.toThrow('banco caiu');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server && npm test -- sincronizar-posts`
Expected: FAIL — `Cannot find module './sincronizar-posts.use-case'`.

- [ ] **Step 4: Implementar o caso de uso**

`server/src/modules/comunidade/use-cases/sincronizar-posts.use-case.ts`:
```ts
import type { Db } from '../../planta/use-cases/reavaliar-grupos';
import { planejarPosts } from '../dominio/post';
import { PostsRepository, SincronizadorDePosts } from '../comunidade.types';

/**
 * Deixa os posts de cada planta iguais aos dias em que ela tem foto (idempotente): cobre foto nova, apagada,
 * movida ou com data mudada — e cuidado com data editada — sem precisar saber o "dia antigo".
 */
export class SincronizarPostsUseCase implements SincronizadorDePosts {
  constructor(
    private repo: PostsRepository,
    private agora: () => Date = () => new Date(),
  ) {}

  async execute({ plantaIds }: { plantaIds: string[] }, _usuarioId?: string, db?: Db): Promise<void> {
    const ids = [...new Set(plantaIds.filter(Boolean))];
    if (!ids.length) return;
    try {
      const agora = this.agora();
      for (const e of await this.repo.estadoDasPlantas(ids, db)) {
        const plano = planejarPosts(e.fotos, e.diasComPost, e, agora);
        if (plano.criar.length || plano.apagar.length) await this.repo.aplicar(e.plantaId, e.usuarioId, plano, db);
      }
    } catch (erro) {
      // Dentro de transação, desfaz junto; fora, a próxima escrita na planta corrige (não derruba o envio da foto)
      if (db) throw erro;
      console.error('[comunidade] falha ao sincronizar posts', erro);
    }
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd server && npm test -- sincronizar-posts`
Expected: PASS.

- [ ] **Step 6: Repositório Prisma e fábrica**

`server/src/modules/comunidade/repositories/prisma-posts.repository.ts`:
```ts
import { prisma } from '../../../lib/prisma';
import type { Db } from '../../planta/use-cases/reavaliar-grupos';
import type { PlanoPosts } from '../dominio/post';
import { EstadoPostsDaPlanta, PostsRepository } from '../comunidade.types';

/** "AAAA-MM-DD" ↔ coluna DATE (meia-noite UTC). */
const paraData = (dia: string) => new Date(`${dia}T00:00:00.000Z`);
const paraDia = (data: Date) => data.toISOString().slice(0, 10);

export class PrismaPostsRepository implements PostsRepository {
  async estadoDasPlantas(plantaIds: string[], db: Db = prisma): Promise<EstadoPostsDaPlanta[]> {
    const plantas = await db.planta.findMany({
      where: { id: { in: plantaIds } },
      select: {
        id: true,
        usuarioId: true,
        plantaPublica: true,
        usuario: { select: { perfilPublico: true, postarAutomatico: true } },
        fotos: {
          select: {
            tipo: true,
            dataCaptura: true,
            createdAt: true,
            agenda: { select: { status: true, dataConcluida: true, dataAgendada: true } },
          },
        },
        posts: { select: { dia: true } },
      },
    });
    return plantas.map((p) => ({
      plantaId: p.id,
      usuarioId: p.usuarioId,
      plantaPublica: p.plantaPublica,
      perfilPublico: p.usuario.perfilPublico,
      postarAutomatico: p.usuario.postarAutomatico,
      fotos: p.fotos,
      diasComPost: p.posts.map((x) => paraDia(x.dia)),
    }));
  }

  // Em sequência (não Promise.all) para funcionar dentro de transação interativa
  async aplicar(plantaId: string, usuarioId: string, plano: PlanoPosts, db: Db = prisma): Promise<void> {
    if (plano.apagar.length) {
      await db.post.deleteMany({ where: { plantaId, dia: { in: plano.apagar.map(paraData) } } });
    }
    if (plano.criar.length) {
      await db.post.createMany({
        data: plano.criar.map((c) => ({ plantaId, usuarioId, dia: paraData(c.dia), noFeed: c.noFeed })),
        skipDuplicates: true,
      });
    }
  }
}
```

`server/src/modules/comunidade/sincronizar-posts.ts`:
```ts
import { PrismaPostsRepository } from './repositories/prisma-posts.repository';
import { SincronizarPostsUseCase } from './use-cases/sincronizar-posts.use-case';

/** Sincronizador de posts pronto para injetar em quem grava fotos ou tarefas. */
export const criarSincronizadorDePosts = () => new SincronizarPostsUseCase(new PrismaPostsRepository());
```

- [ ] **Step 7: Conferir tipos**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add server/src/modules/comunidade
git commit -m "feat(server): sincronizar posts da planta com os dias de foto"
```

---

### Task 4: Ligar a sincronização nas escritas de foto e de tarefa

**Files:**
- Modify: `server/src/modules/planta/use-cases/reavaliar-grupos.ts` (fim do arquivo)
- Test: `server/src/modules/planta/use-cases/reavaliar-grupos.test.ts`
- Modify: `server/src/modules/agenda/agenda.controller.ts:39`
- Modify: `server/src/modules/foto/use-cases/create-foto.use-case.ts`, `delete-foto.use-case.ts`
- Test: `server/src/modules/foto/use-cases/create-foto.use-case.test.ts`, `delete-foto.use-case.test.ts`
- Modify: `server/src/modules/foto/foto.controller.ts:22-26`

**Interfaces:**
- Consumes: `SincronizadorDePosts`, `criarSincronizadorDePosts` (Task 3); `ReavaliadorDeGrupos`, `Tocadas`, `ReavaliarGruposUseCase`.
- Produces: `emSequencia(...passos: ReavaliadorDeGrupos[]): ReavaliadorDeGrupos`; `CreateFotoUseCase(fotoRepository, posts)`; `DeleteFotoUseCase(fotoRepository, limpezaDeMidia, posts)`.

- [ ] **Step 1: Teste de `emSequencia`**

Acrescentar ao fim de `reavaliar-grupos.test.ts`:
```ts
describe('emSequencia', () => {
  it('roda cada passo em ordem com os mesmos argumentos', async () => {
    const ordem: string[] = [];
    const passo = (nome: string) => ({ execute: jest.fn(async () => void ordem.push(nome)) });
    const a = passo('a');
    const b = passo('b');
    const tocadas = { plantaIds: ['p1'], agendaIds: ['t1'] };
    const db = {} as never;

    await emSequencia(a, b).execute(tocadas, 'u1', db);

    expect(ordem).toEqual(['a', 'b']);
    expect(a.execute).toHaveBeenCalledWith(tocadas, 'u1', db);
    expect(b.execute).toHaveBeenCalledWith(tocadas, 'u1', db);
  });
});
```
e incluir `emSequencia` no import do topo do arquivo de teste (`import { ..., emSequencia } from './reavaliar-grupos';`).

- [ ] **Step 2: Testes das fotos**

Em `create-foto.use-case.test.ts`: declarar `let mockPosts: { execute: jest.Mock };`, no `beforeEach` criar `mockPosts = { execute: jest.fn().mockResolvedValue(undefined) };` e trocar a construção para `new CreateFotoUseCase(mockFotoRepository, mockPosts)`. Acrescentar:
```ts
  it('sincroniza os posts da planta da foto', async () => {
    mockFotoRepository.checkPlantaBelongsToUser.mockResolvedValue(true);
    mockFotoRepository.create.mockResolvedValue({ id: 'f1', plantaId: 'planta-1' });

    await createFotoUseCase.execute({ caminhoArquivo: '/x.webp', plantaId: 'planta-1' }, 'user-1');

    expect(mockPosts.execute).toHaveBeenCalledWith({ plantaIds: ['planta-1'] });
  });

  it('foto sem planta não sincroniza', async () => {
    mockFotoRepository.create.mockResolvedValue({ id: 'f1', plantaId: null });

    await createFotoUseCase.execute({ caminhoArquivo: '/x.webp' }, 'user-1');

    expect(mockPosts.execute).not.toHaveBeenCalled();
  });
```

Em `delete-foto.use-case.test.ts`: mesmo `mockPosts`, construção `new DeleteFotoUseCase(mockFotoRepository, mockLimpeza, mockPosts)`. Acrescentar:
```ts
  it('sincroniza os posts da planta depois de apagar', async () => {
    mockFotoRepository.findByIdAndUser.mockResolvedValue(foto);
    mockFotoRepository.findCapaDaPlanta.mockResolvedValue('https://cdn/outra.webp');

    await deleteFotoUseCase.execute(fotoId, usuarioId);

    expect(mockPosts.execute).toHaveBeenCalledWith({ plantaIds: ['planta-1'] });
  });
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server && npm test -- reavaliar-grupos create-foto delete-foto`
Expected: FAIL — `emSequencia` não exportado; `mockPosts.execute` não chamado.

- [ ] **Step 4: Implementar**

Fim de `reavaliar-grupos.ts`:
```ts
/** Junta vários "depois de gravar tarefas" num só (ex.: grupos + posts da Comunidade), em ordem. */
export function emSequencia(...passos: ReavaliadorDeGrupos[]): ReavaliadorDeGrupos {
  return {
    async execute(tocadas, usuarioId, db) {
      for (const passo of passos) await passo.execute(tocadas, usuarioId, db);
    },
  };
}
```

`agenda.controller.ts` — trocar a linha 39 e os imports:
```ts
import { emSequencia, ReavaliarGruposUseCase } from '../planta/use-cases/reavaliar-grupos';
import { criarSincronizadorDePosts } from '../comunidade/sincronizar-posts';
// ...
    // Toda escrita de tarefa reavalia Recém transplantada e os posts da Comunidade (foto de cuidado muda de dia)
    const reavaliar = emSequencia(new ReavaliarGruposUseCase(new PrismaReavaliacaoRepository()), criarSincronizadorDePosts());
```

`create-foto.use-case.ts`:
```ts
import { CreateFotoDTO, FotoRepository } from '../foto.types';
import { SincronizadorDePosts } from '../../comunidade/comunidade.types';

export class CreateFotoUseCase {
  constructor(
    private fotoRepository: FotoRepository,
    private posts: SincronizadorDePosts,
  ) {}

  async execute(data: Omit<CreateFotoDTO, 'usuarioId'>, usuarioId: string) {
    // Se um plantaId for fornecido, verifica se a planta pertence ao usuário
    if (data.plantaId) {
      const plantaBelongsToUser = await this.fotoRepository.checkPlantaBelongsToUser(data.plantaId, usuarioId);

      if (!plantaBelongsToUser) {
        throw new Error('Planta não encontrada ou não pertence a si.');
      }
    }

    const foto = await this.fotoRepository.create({
      ...data,
      usuarioId,
    });
    if (foto.plantaId) await this.posts.execute({ plantaIds: [foto.plantaId] });
    return foto;
  }
}
```

`delete-foto.use-case.ts` — construtor ganha `private posts: SincronizadorDePosts,` (import igual ao acima) e, logo depois do bloco `if (foto.plantaId) { ...capa... }`, acrescentar:
```ts
    if (foto.plantaId) await this.posts.execute({ plantaIds: [foto.plantaId] });
```

`foto.controller.ts`:
```ts
import { criarSincronizadorDePosts } from '../comunidade/sincronizar-posts';
// ...
    const posts = criarSincronizadorDePosts();
    this.createFotoUseCase = new CreateFotoUseCase(fotoRepository, posts);
    // ...
    this.deleteFotoUseCase = new DeleteFotoUseCase(fotoRepository, criarLimpezaDeMidia(), posts);
```

- [ ] **Step 5: Rodar tudo**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, sem erros de tipo.

- [ ] **Step 6: Conferir no banco local**

Run: `docker restart bonsai_api`, subir uma foto numa planta pela UI local (ou `POST /api/fotos`), e:
`docker compose exec db psql -U bonsai_user -d bonsai_db -c 'select "plantaId", dia, "noFeed" from "Post" order by "createdAt" desc limit 3;'`
Expected: uma linha com o dia de hoje e `noFeed = t` (perfil ainda privado). Apagar a foto → a linha some.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/planta/use-cases/reavaliar-grupos.ts server/src/modules/planta/use-cases/reavaliar-grupos.test.ts server/src/modules/agenda/agenda.controller.ts server/src/modules/foto
git commit -m "feat(server): fotos e tarefas mantêm os posts da Comunidade em dia"
```

---

### Task 5: Configurações de compartilhamento no perfil (`/auth/me`)

**Files:**
- Modify: `server/src/modules/auth/auth.schema.ts:24-34`
- Modify: `server/src/modules/auth/types/auth.types.ts` (`UpdateMeDTO`, `UserResponseDTO`)
- Modify: `server/src/modules/auth/repositories/prisma-auth.repository.ts` (3 `select`)
- Modify: `server/src/docs/swagger.ts:32`
- Test: `server/src/modules/auth/auth.schema.test.ts` (criar)

**Interfaces:**
- Produces: `PUT /api/auth/me` aceita `historicoPublico?: boolean`, `postarAutomatico?: boolean`; respostas de `/auth/login`, `/auth/register`, `/auth/me` trazem os dois campos.

- [ ] **Step 1: Teste do schema**

`server/src/modules/auth/auth.schema.test.ts`:
```ts
import { updateUserSchema } from './auth.schema';

describe('updateUserSchema', () => {
  it('aceita as configurações da Comunidade', () => {
    const { body } = updateUserSchema.parse({ body: { perfilPublico: true, historicoPublico: true, postarAutomatico: false } });
    expect(body).toEqual({ perfilPublico: true, historicoPublico: true, postarAutomatico: false });
  });

  it('recusa valor que não é booleano', () => {
    expect(() => updateUserSchema.parse({ body: { postarAutomatico: 'sim' } })).toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npm test -- auth.schema`
Expected: FAIL — o primeiro teste perde `historicoPublico`/`postarAutomatico` (o Zod descarta chaves desconhecidas).

- [ ] **Step 3: Implementar**

`auth.schema.ts`, dentro de `updateUserSchema.body`, depois de `perfilPublico`:
```ts
    historicoPublico: z.boolean().optional(),
    postarAutomatico: z.boolean().optional(),
```

`auth.types.ts`: em `UpdateMeDTO` acrescentar `historicoPublico?: boolean;` e `postarAutomatico?: boolean;`; em `UserResponseDTO` acrescentar `historicoPublico: boolean;` e `postarAutomatico: boolean;`.

`prisma-auth.repository.ts`: no topo, depois dos imports:
```ts
/** Campos do usuário devolvidos ao app (login, cadastro, /me). */
const camposDoUsuario = {
  id: true,
  nome: true,
  email: true,
  nomePublico: true,
  localidade: true,
  fotoPerfilUrl: true,
  bio: true,
  perfilPublico: true,
  historicoPublico: true,
  postarAutomatico: true,
  recursosHabilitado: true,
  createdAt: true,
  role: true,
} as const;
```
e trocar os três `select: { id: true, ... role: true, ... }` por `select: camposDoUsuario` (em `createUser` e `updateUser`) e `select: { ...camposDoUsuario, seguindo: {...}, seguidores: {...}, plantas: {...} }` (em `findUserById`, mantendo as três relações como estão).

`swagger.ts`, depois de `perfilPublico: { type: 'boolean' },`:
```ts
          historicoPublico: { type: 'boolean' },
          postarAutomatico: { type: 'boolean' },
```

- [ ] **Step 4: Rodar**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS (inclusive `update-me.use-case.test.ts`; se algum fixture tipado como `UserResponseDTO` reclamar, acrescentar `historicoPublico: false, postarAutomatico: true` nele).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/auth server/src/docs/swagger.ts
git commit -m "feat(server): perfil guarda histórico público e postar automaticamente"
```

---

### Task 6: `PUT /api/plantas/publicas` — definir quais plantas são públicas

**Files:**
- Create: `server/src/modules/planta/use-cases/definir-plantas-publicas.use-case.ts`
- Test: `server/src/modules/planta/use-cases/definir-plantas-publicas.use-case.test.ts`
- Modify: `server/src/modules/planta/use-cases/index.ts`, `types/planta.types.ts` (`PlantaRepository`), `repositories/prisma-planta.repository.ts`, `planta.schema.ts`, `planta.controller.ts`, `planta.router.ts`

**Interfaces:**
- Produces: `PlantaRepository.definirPublicas(usuarioId: string, plantaIds: string[]): Promise<void>`; `DefinirPlantasPublicasUseCase.execute(usuarioId: string, plantaIds: string[]): Promise<void>`; rota `PUT /api/plantas/publicas` body `{ plantaIds: string[] }` → `204`.

- [ ] **Step 1: Teste**

```ts
import { DefinirPlantasPublicasUseCase } from './definir-plantas-publicas.use-case';
import { PlantaRepository } from '../types/planta.types';

describe('DefinirPlantasPublicasUseCase', () => {
  it('repassa as plantas sem repetição, sempre com o usuário', async () => {
    const repo = { definirPublicas: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PlantaRepository>;
    const useCase = new DefinirPlantasPublicasUseCase(repo);

    await useCase.execute('u1', ['p1', 'p2', 'p1']);

    expect(repo.definirPublicas).toHaveBeenCalledWith('u1', ['p1', 'p2']);
  });

  it('lista vazia torna todas privadas', async () => {
    const repo = { definirPublicas: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PlantaRepository>;
    await new DefinirPlantasPublicasUseCase(repo).execute('u1', []);
    expect(repo.definirPublicas).toHaveBeenCalledWith('u1', []);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npm test -- definir-plantas-publicas`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

`definir-plantas-publicas.use-case.ts`:
```ts
import { PlantaRepository } from '../types/planta.types';

/** "Todas" ou a seleção da gaveta: as plantas informadas ficam públicas e as demais do usuário, privadas. */
export class DefinirPlantasPublicasUseCase {
  constructor(private plantaRepository: PlantaRepository) {}

  async execute(usuarioId: string, plantaIds: string[]): Promise<void> {
    await this.plantaRepository.definirPublicas(usuarioId, [...new Set(plantaIds)]);
  }
}
```
`use-cases/index.ts`: `export { DefinirPlantasPublicasUseCase } from './definir-plantas-publicas.use-case';`

`planta.types.ts`, em `PlantaRepository`:
```ts
  /** As plantas informadas (do usuário) ficam públicas; as demais dele, privadas. Ids de outros usuários são ignorados. */
  definirPublicas(usuarioId: string, plantaIds: string[]): Promise<void>;
```

`prisma-planta.repository.ts`, novo método na classe:
```ts
  async definirPublicas(usuarioId: string, plantaIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.planta.updateMany({ where: { usuarioId, id: { in: plantaIds } }, data: { plantaPublica: true } }),
      this.prisma.planta.updateMany({ where: { usuarioId, id: { notIn: plantaIds } }, data: { plantaPublica: false } }),
    ]);
  }
```

`planta.schema.ts`:
```ts
export const definirPublicasSchema = z.object({
  body: z.object({
    plantaIds: z.array(z.string().uuid('Planta inválida.')).max(2000),
  }),
});
```

`planta.controller.ts`: importar `definirPublicasSchema` e `DefinirPlantasPublicasUseCase`; criar `const definirPlantasPublicasUseCase = new DefinirPlantasPublicasUseCase(plantaRepository);` e no objeto `plantaController`:
```ts
  definirPublicas: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaIds } = definirPublicasSchema.parse(req).body;
      await definirPlantasPublicasUseCase.execute(usuarioId, plantaIds);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: mensagemDoErro(error, 'Erro ao salvar plantas da comunidade') });
    }
  },
```

`planta.router.ts` — **antes** de `plantaRouter.put('/:id', ...)` (senão `/:id` captura "publicas"):
```ts
plantaRouter.put('/publicas', plantaController.definirPublicas);
```

- [ ] **Step 4: Rodar**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS. (Se algum teste existente monta um `jest.Mocked<PlantaRepository>` literal e o TS reclamar, acrescentar `definirPublicas: jest.fn()` nele.)

- [ ] **Step 5: Conferir a rota no Docker**

Run: `docker restart bonsai_api`; com um token local, `curl -X PUT localhost:3000/api/plantas/publicas -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"plantaIds":[]}' -i`
Expected: `HTTP/1.1 204`. Com `{"plantaIds":["x"]}` → `400` com `"Planta inválida."`.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/planta
git commit -m "feat(server): definir de uma vez quais plantas são públicas"
```

---

### Task 7: Web — tipos, chamadas e regra "Todas / Selecionadas"

**Files:**
- Modify: `web/src/types.ts` (`Usuario`)
- Modify: `web/src/lib/endpoints.ts` (`authApi.updateMe`, `PlantaInput`, `plantasApi`)
- Create: `web/src/lib/comunidade.ts`
- Test: `web/src/lib/comunidade.test.ts`

**Interfaces:**
- Produces:
  - `Usuario.historicoPublico: boolean`, `Usuario.postarAutomatico: boolean`
  - `authApi.updateMe` aceita `historicoPublico`, `postarAutomatico`
  - `PlantaInput.plantaPublica?: boolean`
  - `plantasApi.definirPublicas(plantaIds: string[]): Promise<unknown>`
  - `type ModoPlantas = 'todas' | 'selecionadas'`; `modoPlantas(plantas: Pick<Planta, 'plantaPublica'>[]): ModoPlantas`

- [ ] **Step 1: Teste**

`web/src/lib/comunidade.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { modoPlantas } from './comunidade';

describe('modoPlantas', () => {
  it('todas públicas → todas', () => {
    expect(modoPlantas([{ plantaPublica: true }, { plantaPublica: true }])).toBe('todas');
  });
  it('alguma privada → selecionadas', () => {
    expect(modoPlantas([{ plantaPublica: true }, { plantaPublica: false }])).toBe('selecionadas');
  });
  it('nenhuma pública → selecionadas', () => {
    expect(modoPlantas([{ plantaPublica: false }])).toBe('selecionadas');
  });
  it('sem plantas → todas (as próximas já nascem públicas)', () => {
    expect(modoPlantas([])).toBe('todas');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd web && npx vitest run src/lib/comunidade.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

`web/src/lib/comunidade.ts`:
```ts
import type { Planta } from '@/types';

export type ModoPlantas = 'todas' | 'selecionadas';

/** "Todas" não é guardado: é quando toda planta do usuário é pública. */
export function modoPlantas(plantas: Pick<Planta, 'plantaPublica'>[]): ModoPlantas {
  return plantas.every((p) => p.plantaPublica) ? 'todas' : 'selecionadas';
}
```

`web/src/types.ts`, em `Usuario` depois de `perfilPublico: boolean;`:
```ts
  /** Cuidados aparecem nos posts e na página pública da planta. */
  historicoPublico: boolean;
  /** Posts novos entram no feed da Comunidade. */
  postarAutomatico: boolean;
```

`web/src/lib/endpoints.ts`:
- `updateMe`: trocar o `Pick<Usuario, 'nome' | 'nomePublico' | 'localidade' | 'bio' | 'perfilPublico'>` por `Pick<Usuario, 'nome' | 'nomePublico' | 'localidade' | 'bio' | 'perfilPublico' | 'historicoPublico' | 'postarAutomatico'>`.
- `PlantaInput`: acrescentar `plantaPublica?: boolean;`.
- `plantasApi`: acrescentar `definirPublicas: (plantaIds: string[]) => api.put('/plantas/publicas', { plantaIds }),`.

- [ ] **Step 4: Rodar**

Run: `cd web && npx vitest run src/lib/comunidade.test.ts && npx tsc -b`
Expected: PASS e sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add web/src/types.ts web/src/lib/endpoints.ts web/src/lib/comunidade.ts web/src/lib/comunidade.test.ts
git commit -m "feat(web): tipos e chamadas das configurações da Comunidade"
```

---

### Task 8: Web — seção "Comunidade" nas Preferências

**Files:**
- Modify: `web/src/components/ui.tsx` (novo `Opcao`)
- Create: `web/src/components/comunidade/SelecionarPlantasSheet.tsx`
- Create: `web/src/components/comunidade/ComunidadePreferencias.tsx`
- Modify: `web/src/pages/ProfilePages.tsx` (`PreferenciasPage` ~L228 e `AnimacoesSazonaisPreferencia` ~L202)

**Interfaces:**
- Consumes: `modoPlantas`, `authApi.updateMe`, `plantasApi.definirPublicas` (Task 7); `useAuth().setUser`, `usePlantas`, `keys`, `Sheet`, `OpcoesChips`, `PlantThumb`, `plantaCodigoNome`, `useToast`, `errorMessage`.
- Produces: `Opcao({ titulo, descricao?, checked, onChange, disabled? })` em `ui.tsx`; `ComunidadePreferencias()`; `SelecionarPlantasSheet({ open, onClose, plantas, onSalvar })`.

- [ ] **Step 1: `Opcao` em `ui.tsx`** (mesma marcação da caixa de "Animações sazonais", agora reutilizável)

```tsx
/** Caixa de marcar com título e explicação (preferências, formulários). */
export function Opcao({
  titulo,
  descricao,
  checked,
  onChange,
  disabled,
}: {
  titulo: string;
  descricao?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{titulo}</span>
        {descricao && <span className="block text-xs text-muted">{descricao}</span>}
      </span>
    </label>
  );
}
```
(`ReactNode` já deve estar importado em `ui.tsx`; se não, acrescentar ao import de `react`.)

Em `ProfilePages.tsx`, `AnimacoesSazonaisPreferencia` passa a usar `Opcao`:
```tsx
    <section className="card mt-4 p-4">
      <Opcao
        titulo="Animações sazonais"
        descricao={
          menosMovimento
            ? 'O aparelho pediu menos movimento, então as animações ficam paradas.'
            : 'Pétalas, folhas ou neve caindo ao fundo, conforme a estação.'
        }
        checked={valor === 'sim'}
        onChange={(v) => setValor(v ? 'sim' : 'nao')}
      />
    </section>
```
(acrescentar `Opcao` ao import de `@/components/ui`).

- [ ] **Step 2: Gaveta de seleção**

`web/src/components/comunidade/SelecionarPlantasSheet.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { Button, PlantThumb } from '@/components/ui';
import { plantaCodigoNome } from '@/lib/format';
import type { Planta } from '@/types';

/** Gaveta com as plantas do usuário para marcar quais aparecem na Comunidade. */
export function SelecionarPlantasSheet({
  open,
  onClose,
  plantas,
  onSalvar,
}: {
  open: boolean;
  onClose: () => void;
  plantas: Planta[];
  onSalvar: (plantaIds: string[]) => Promise<void>;
}) {
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  // Ao abrir, parte das que já são públicas
  useEffect(() => {
    if (open) setMarcadas(new Set(plantas.filter((p) => p.plantaPublica).map((p) => p.id)));
  }, [open, plantas]);

  function alternar(id: string) {
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      await onSalvar([...marcadas]);
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Plantas na comunidade"
      footer={
        <Button block loading={salvando} onClick={salvar}>
          Salvar · {marcadas.size} de {plantas.length}
        </Button>
      }
    >
      <ul className="divide-y divide-line">
        {plantas.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 py-2.5">
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-primary"
                checked={marcadas.has(p.id)}
                onChange={() => alternar(p.id)}
              />
              <PlantThumb url={p.fotoCapaUrl} id={p.id} className="size-11 rounded-lg" />
              <span className="min-w-0 flex-1 truncate font-medium">{plantaCodigoNome(p)}</span>
            </label>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
```

- [ ] **Step 3: Seção das Preferências**

`web/src/components/comunidade/ComunidadePreferencias.tsx`:
```tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Opcao } from '@/components/ui';
import { OpcoesChips } from '@/components/Preferencias';
import { SelecionarPlantasSheet } from './SelecionarPlantasSheet';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { modoPlantas, type ModoPlantas } from '@/lib/comunidade';
import { authApi, plantasApi } from '@/lib/endpoints';
import { keys, usePlantas } from '@/lib/queries';
import type { Usuario } from '@/types';

type Config = Pick<Usuario, 'perfilPublico' | 'historicoPublico' | 'postarAutomatico'>;

/** Preferências → Comunidade: perfil público, quais plantas, cuidados e postagem automática. Salva a cada toque. */
export function ComunidadePreferencias() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const [salvando, setSalvando] = useState(false);
  const [escolhendo, setEscolhendo] = useState(false);

  const lista = plantas.data ?? [];
  const modo = modoPlantas(lista);
  const publicas = lista.filter((p) => p.plantaPublica).length;

  async function mudar(campo: Partial<Config>) {
    setSalvando(true);
    try {
      setUser(await authApi.updateMe(campo));
      queryClient.invalidateQueries({ queryKey: keys.me });
      toast('Preferência salva');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function definirPublicas(ids: string[]) {
    try {
      await plantasApi.definirPublicas(ids);
      await queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast('Plantas da comunidade salvas');
    } catch (error) {
      toast(errorMessage(error), 'error');
      throw error;
    }
  }

  function escolherModo(m: ModoPlantas) {
    if (m === 'todas') void definirPublicas(lista.map((p) => p.id)).catch(() => undefined);
    else setEscolhendo(true);
  }

  if (!user) return null;

  return (
    <section className="card mt-4 space-y-4 p-4">
      <Opcao
        titulo="Perfil público"
        descricao="Outras pessoas encontram você, seguem e veem as plantas que você mostrar."
        checked={user.perfilPublico}
        disabled={salvando}
        onChange={(v) => mudar({ perfilPublico: v })}
      />

      {user.perfilPublico && (
        <>
          <div>
            <OpcoesChips<ModoPlantas>
              titulo="Quais plantas aparecem"
              opcoes={[
                { value: 'todas', label: 'Todas' },
                { value: 'selecionadas', label: 'Selecionadas' },
              ]}
              value={modo}
              onChange={escolherModo}
            />
            {modo === 'selecionadas' && (
              <button type="button" className="mt-2 text-sm font-medium text-primary" onClick={() => setEscolhendo(true)}>
                {publicas
                  ? `${publicas} de ${lista.length} na comunidade · Escolher`
                  : 'Nenhuma planta aparece ainda · Escolher'}
              </button>
            )}
          </div>
          <Opcao
            titulo="Mostrar meus cuidados"
            descricao="Os cuidados do dia aparecem junto das fotos e na página da planta."
            checked={user.historicoPublico}
            disabled={salvando}
            onChange={(v) => mudar({ historicoPublico: v })}
          />
          <Opcao
            titulo="Postar automaticamente"
            descricao="Cada dia com foto numa planta da comunidade vira um post no feed de quem segue você."
            checked={user.postarAutomatico}
            disabled={salvando}
            onChange={(v) => mudar({ postarAutomatico: v })}
          />
        </>
      )}

      <SelecionarPlantasSheet open={escolhendo} onClose={() => setEscolhendo(false)} plantas={lista} onSalvar={definirPublicas} />
    </section>
  );
}
```
Se `user` vindo do `localStorage` (sessão antiga) não tiver `historicoPublico`/`postarAutomatico`, o `authApi.me()` do `AuthProvider` completa ao abrir o app; até lá, `checked` recebe `undefined` → usar `checked={!!user.historicoPublico}` e `checked={user.postarAutomatico ?? true}` para evitar aviso de input não controlado.

- [ ] **Step 4: Colocar na página**

`ProfilePages.tsx`, em `PreferenciasPage`, entre `<MoverTransplantePreferencia />` e o título "Neste aparelho":
```tsx
        <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted">Comunidade</h2>
        <ComunidadePreferencias />
```
e `import { ComunidadePreferencias } from '@/components/comunidade/ComunidadePreferencias';`.

- [ ] **Step 5: Verificar build e lint**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: build ok, lint sem erros novos, testes passam.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ui.tsx web/src/components/comunidade web/src/pages/ProfilePages.tsx
git commit -m "feat(web): seção Comunidade nas Preferências"
```

---

### Task 9: Web — "Mostrar na comunidade" ao criar e editar planta

**Files:**
- Create: `web/src/components/planta/MostrarNaComunidade.tsx`
- Modify: `web/src/pages/AddPlantPage.tsx` (estado ~L48, `resetar` ~L63, `plantasApi.create` ~L92, JSX depois de `<GrupoChips … />` ~L226)
- Modify: `web/src/pages/EditPlantPage.tsx` (estado ~L40, `plantasApi.update` ~L53, JSX depois do bloco do `GrupoChips` ~L147)

**Interfaces:**
- Consumes: `Opcao` (Task 8), `useAuth().user.perfilPublico`, `PlantaInput.plantaPublica` (Task 7).
- Produces: `MostrarNaComunidade({ checked, onChange })`.

- [ ] **Step 1: Componente**

```tsx
import { Link } from 'react-router';
import { Opcao } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

/** Campo "Mostrar na comunidade" dos formulários de planta; com perfil privado, só a dica para ativar. */
export function MostrarNaComunidade({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { user } = useAuth();
  if (!user?.perfilPublico) {
    return (
      <p className="text-sm text-muted">
        Seu perfil é privado ·{' '}
        <Link to="/perfil/preferencias" className="font-medium text-primary">
          Ativar
        </Link>
      </p>
    );
  }
  return (
    <Opcao
      titulo="Mostrar na comunidade"
      descricao="Fotos (e cuidados, se você mostra) desta planta aparecem no seu perfil público."
      checked={checked}
      onChange={onChange}
    />
  );
}
```

- [ ] **Step 2: Criar planta**

`AddPlantPage.tsx`:
- estado: `const [plantaPublica, setPlantaPublica] = useState(true);`
- `resetar()`: acrescentar `setPlantaPublica(true);`
- importar `import { useAuth } from '@/context/AuthContext';` (ainda não está importado) e declarar `const { user } = useAuth();` no topo do componente.
- em `plantasApi.create({ ... })` acrescentar `plantaPublica: !!user?.perfilPublico && plantaPublica,`
- JSX, logo depois de `<GrupoChips value={grupo} onChange={setGrupo} />`:
```tsx
            <div className="mt-5">
              <MostrarNaComunidade checked={plantaPublica} onChange={setPlantaPublica} />
            </div>
```
- import: `import { MostrarNaComunidade } from '@/components/planta/MostrarNaComunidade';`

- [ ] **Step 3: Editar planta**

`EditPlantPage.tsx`:
- estado: `const [plantaPublica, setPlantaPublica] = useState(p.plantaPublica);`
- em `plantasApi.update(id, { ... })` acrescentar `...(plantaPublica !== p.plantaPublica ? { plantaPublica } : {}),`
- JSX, depois do `</div>` que fecha o bloco do `GrupoChips` e antes de `<Field label="Observações">`:
```tsx
        <MostrarNaComunidade checked={plantaPublica} onChange={setPlantaPublica} />
```
- import igual ao Step 2.

- [ ] **Step 4: Verificar**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo ok.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/planta/MostrarNaComunidade.tsx web/src/pages/AddPlantPage.tsx web/src/pages/EditPlantPage.tsx
git commit -m "feat(web): mostrar na comunidade ao criar e editar planta"
```

---

### Task 10: Verificação ponta a ponta, CLAUDE.md e entrega

**Files:**
- Modify: `CLAUDE.md` (parágrafo do frontend, depois da parte de grupos fixos da planta)

- [ ] **Step 1: Teste no navegador (local)**

Com `docker compose up -d`, `docker restart bonsai_api` e `cd web && npm run dev`, logado na conta local de teste (ver memória `local-browser-testing`), em largura de celular (390px):
1. Perfil → Preferências → Comunidade: "Perfil público" desmarcado; marcar → aparecem "Quais plantas", "Mostrar meus cuidados" e "Postar automaticamente" (este marcado).
2. "Quais plantas" mostra **Selecionadas** e "Nenhuma planta aparece ainda · Escolher". Tocar em **Todas** → toast; recarregar → continua "Todas".
3. Editar uma planta → "Mostrar na comunidade" marcado; desmarcar e salvar → Preferências mostra "Selecionadas · N−1 de N".
4. Escolher → gaveta com a planta desmarcada; marcar de novo e Salvar → volta a "Todas".
5. Nova planta → campo marcado por padrão; desmarcar o perfil público → campo vira "Seu perfil é privado · Ativar".
6. Subir uma foto numa planta pública com perfil público e "Postar automaticamente" → `select dia, "noFeed" from "Post" order by "createdAt" desc limit 1;` mostra hoje com `noFeed = f`. Apagar a foto → a linha some.

- [ ] **Step 2: Atualizar o CLAUDE.md**

Acrescentar ao fim do parágrafo de estrutura do frontend:
```
Comunidade (spec `2026-10-13-comunidade-design.md`; fase 1 = dados + privacidade): `Usuario.perfilPublico` (padrão false), `historicoPublico`, `postarAutomatico`; `Planta.plantaPublica` é a fonte da verdade ("Todas/Selecionadas" é derivado — `modoPlantas` em `src/lib/comunidade.ts`; `PUT /api/plantas/publicas`). Preferências → Comunidade (`components/comunidade/`), campo `components/planta/MostrarNaComunidade.tsx`. `Post` = planta + dia com foto, mantido por `SincronizarPostsUseCase` (`server/src/modules/comunidade/`, regras puras em `dominio/post.ts`: dia em America/Sao_Paulo, `noFeed` decidido ao nascer), chamado nos casos de uso de foto e via `emSequencia` junto do `reavaliar` de toda escrita de tarefa.
```

- [ ] **Step 3: Rodar tudo uma última vez**

Run: `cd server && npm test && npm run build` e `cd web && npm test && npm run build && npm run lint`
Expected: tudo passa.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md com a fase 1 da Comunidade"
```

- [ ] **Step 5: Pedir confirmação e fazer o push**

Perguntar ao usuário antes: o push na `main` faz deploy, e a migração vai pôr **todas as contas como perfil privado** e criar os posts das fotos existentes no Neon. Com o "sim": `git push origin main`, acompanhar o build da Vercel e conferir em https://bonsaimanager.pages.dev com a conta `testeclaude@bonsai.dev` os passos 1–5 do Step 1.
