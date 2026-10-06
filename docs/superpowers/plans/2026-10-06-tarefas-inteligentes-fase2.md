# Tarefas inteligentes — Fase 2 (rotinas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tarefas recorrentes ("rotinas" rolantes): criar a partir do Agendar ou dos próximos passos, gerar a próxima ao concluir (pela tarefa ou por registro reconciliado), pular esta vez, pausar/retomar, editar e apagar, com ↻ nos cards, ações na TarefaPage e seção Rotinas na página da planta.

**Architecture:** Modelo `Rotina` (1 por planta+atividade) e `Agenda.rotinaId`/`pulada`. Regras de data são funções puras em `server/src/modules/agenda/dominio/rotina.ts`. Concluir/registrar avançam rotinas via `planejarRotinas` (repositório `estadoRotinas`), e a próxima da rotina conta como "próxima pendente" para não gerar Revisão geral desnecessária. CRUD em módulo novo `server/src/modules/rotina/` + `POST /api/agendas/:id/pular`. Frontend lê todas as rotinas do usuário num só cache (`useRotinas`) e calcula a sugestão de intervalo (mediana) no cliente, como na fase 1.

**Tech Stack:** Express + Zod + Prisma 5 (Postgres) + Jest (server/), React 19 + TanStack Query + Tailwind v4 + lucide-react (web/).

**Spec:** `docs/superpowers/specs/2026-10-05-tarefas-inteligentes-design.md` — fase 2 = regras 1, 2 (sem estações), 4, 5, 9; seções API (módulo `rotina/`, `/agendas/:id/pular`), Interface (Agendar, Próximos passos, Tarefa, Planta → Rotinas), Migração item 1.

## Global Constraints

- Idioma de código, comentários, UI e commits: **português**.
- Recorrência **rolante**: próxima = data em que foi feito + `intervaloDias`; **1 pendente por rotina**; no máximo **uma rotina por (planta, atividade)**.
- Pular: pendente → `CANCELADO` + `pulada = true`; próxima a partir de **hoje**. Pausar cancela a pendente; retomar gera a partir de hoje. Passada `dataFim`, não gera mais.
- Intervalo: inteiro de **1 a 3650** dias. Sugestão de intervalo = mediana do histórico (≥ 2 execuções), sem histórico → sem sugestão.
- Estações e Revisão-como-rotina são da **fase 3**: as colunas `estacoes` e `revisao` entram na migração, mas nenhuma regra as usa agora.
- Backend: Clean Architecture (controller → schema → use case → repository); regras em use cases / funções puras; testes AAA com repositório mockado. `server/src/test/setup.ts` mocka `@prisma/client` — **não** importar valores (enums) de `@prisma/client` em código coberto por teste; só tipos.
- O container `bonsai_api` **não recarrega** código: após mudar `server/`, `docker restart bonsai_api` antes de testar no navegador.
- Produção: a Vercel roda `prisma migrate deploy` no build — a migração precisa estar commitada.
- `docs/problemas_encontrados.md` tem edições do usuário: nunca commitar.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; branch `develop`.

## Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `server/prisma/schema.prisma` + `server/prisma/migrations/<ts>_rotinas/` | Modificar/Criar | Modelo `Rotina`, `Agenda.rotinaId`, `Agenda.pulada` |
| `server/src/modules/agenda/dominio/rotina.ts` (+ `.test.ts`) | Criar | `proximaDataRotina`, `planejarProximas` |
| `server/src/modules/agenda/use-cases/planejar-rotinas.ts` (+ `.test.ts`) | Criar | Busca estado das rotinas e planeja as próximas |
| `server/src/modules/agenda/use-cases/planejar-seguimento.ts` (+ teste) | Modificar | `jaAgendadas` e `criarRotinas` (repetir) |
| `server/src/modules/agenda/use-cases/concluir-agendas.use-case.ts`, `registrar-cuidados.use-case.ts` (+ testes) | Modificar | Avançar rotinas |
| `server/src/modules/agenda/agenda.types.ts`, `agenda.schema.ts`, `dominio/reconciliar.ts` (+ teste) | Modificar | Tipos com `rotinaId`, `repetir` |
| `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts` | Modificar | `estadoRotinas`, `rotinaId` nas pendentes, criar rotina de próximo passo |
| `server/src/modules/agenda/repositories/prisma-agenda.repository.ts` | Modificar | `rotina` no include de `GET /agendas` |
| `server/src/modules/rotina/**` | Criar | Módulo: CRUD, pausa, pular |
| `server/src/app.ts`, `server/src/modules/agenda/agenda.router.ts` | Modificar | Rotas |
| `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/lib/cuidados.ts` | Modificar | Tipos, API, cache, mediana/texto |
| `web/src/components/care/RepetirCampo.tsx` | Criar | Seletor Uma vez / Repetir |
| `web/src/components/care/ProximosPassos.tsx`, `web/src/pages/ConcluirPage.tsx`, `web/src/pages/RegistrarPage.tsx` | Modificar | Repetir nos próximos passos |
| `web/src/components/care/ScheduleCareSheet.tsx`, `web/src/components/TaskCard.tsx`, `web/src/components/BenchTaskCard.tsx` | Modificar | Criar rotina; ↻ nos cards |
| `web/src/components/care/RotinaSheet.tsx` | Criar | Editar / pausar / retomar / agendar próxima / apagar |
| `web/src/pages/TarefaPage.tsx`, `web/src/pages/PlantDetailPage.tsx` | Modificar | Pular, editar rotina; seção Rotinas |

---

### Task 1: Migração `Rotina`

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_rotinas/migration.sql` (gerado pelo Prisma)

**Interfaces:**
- Produces: tabela `Rotina` (`id`, `intervaloDias`, `estacoes Estacao[]`, `pausada`, `dataFim`, `revisao`, `createdAt`, `updatedAt`, `plantaId`, `atividadeId`, unique `(plantaId, atividadeId)`); `Agenda.rotinaId String?` (FK `onDelete: SetNull`), `Agenda.pulada Boolean @default(false)`; relações `Planta.rotinas`, `Atividade.rotinas`, `Rotina.agendas`.

- [ ] **Step 1: Editar o schema**

Em `model Agenda`, logo depois de `observacaoFutura`, adicionar:
```prisma
  /** Cancelada por "pular esta vez" (rotina) — distingue de cancelamento comum. */
  pulada           Boolean      @default(false)
```
e, depois do bloco `atividade Atividade @relation(...)`, adicionar:
```prisma

  rotinaId         String?
  rotina           Rotina?      @relation(fields: [rotinaId], references: [id], onDelete: SetNull)
```
Em `model Planta`, no bloco `// Relacionamentos`, adicionar `rotinas     Rotina[]`.
Em `model Atividade`, no bloco `// Relacionamentos`, adicionar `rotinas                Rotina[]`.
Logo depois de `model Agenda { ... }`, adicionar:
```prisma
/// Tarefa recorrente rolante: a próxima nasce de "quando foi feito + intervalo". Uma por planta+atividade.
model Rotina {
  id            String    @id @default(uuid())
  intervaloDias Int
  estacoes      Estacao[] @default([]) // vazio = ano todo (regras na fase 3)
  pausada       Boolean   @default(false)
  dataFim       DateTime?
  revisao       Boolean   @default(false) // Revisão geral da planta (fase 3)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  plantaId      String
  planta        Planta    @relation(fields: [plantaId], references: [id], onDelete: Cascade)
  atividadeId   String
  atividade     Atividade @relation(fields: [atividadeId], references: [id])

  agendas       Agenda[]

  @@unique([plantaId, atividadeId])
}
```

- [ ] **Step 2: Gerar e aplicar a migração no banco local**

Run (raiz do repo): `docker compose exec api npx prisma migrate dev --name rotinas`
Expected: cria `server/prisma/migrations/<timestamp>_rotinas/migration.sql` (volume montado) e aplica. O SQL deve conter `CREATE TABLE "Rotina"`, `ALTER TABLE "Agenda" ADD COLUMN "pulada" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "rotinaId" TEXT`, o índice único `Rotina_plantaId_atividadeId_key` e as FKs (`ON DELETE SET NULL` para `Agenda_rotinaId_fkey`, `ON DELETE CASCADE` para `Rotina_plantaId_fkey`). Se o Prisma pedir para resetar o banco (drift), **pare e reporte BLOCKED** — não resete.

- [ ] **Step 3: Cliente no host + reiniciar a API**

Run: `cd server && npx prisma generate && npm run build && docker restart bonsai_api`
Expected: build sem erros; container sobe (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/docs/` → 200 após alguns segundos).

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "feat(db): modelo Rotina e vínculo da agenda com a rotina

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Regras puras de rotina

**Files:**
- Create: `server/src/modules/agenda/dominio/rotina.ts`
- Test: `server/src/modules/agenda/dominio/rotina.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const DIA_MS = 86_400_000;
  export interface RegraRotina { intervaloDias: number; dataFim: Date | null }
  export interface RotinaBase extends RegraRotina { id: string; plantaId: string; atividadeId: string; pausada: boolean }
  export interface RotinaEstado extends RotinaBase { temPendente: boolean }
  export interface ProximaDeRotina { rotinaId: string; plantaId: string; atividadeId: string; dataAgendada: Date }
  export function proximaDataRotina(regra: RegraRotina, base: Date): Date | null;
  export function planejarProximas(rotinas: RotinaEstado[], feitas: { rotinaId: string; data: Date }[]): ProximaDeRotina[];
  ```

- [ ] **Step 1: Teste que falha** — `server/src/modules/agenda/dominio/rotina.test.ts`:
```ts
import { planejarProximas, proximaDataRotina, RotinaEstado } from './rotina';

const BASE = new Date('2026-10-05T12:00:00.000Z');
const dias = (n: number) => new Date(BASE.getTime() + n * 86_400_000);

const rotina = (over: Partial<RotinaEstado> = {}): RotinaEstado => ({
  id: 'r1',
  plantaId: 'p1',
  atividadeId: 'adubo',
  intervaloDias: 14,
  dataFim: null,
  pausada: false,
  temPendente: false,
  ...over,
});

describe('proximaDataRotina', () => {
  it('soma o intervalo à data base', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null }, BASE)).toEqual(dias(14));
  });

  it('aceita a próxima exatamente na data final', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: dias(14) }, BASE)).toEqual(dias(14));
  });

  it('não gera depois da data final', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: dias(13) }, BASE)).toBeNull();
  });
});

describe('planejarProximas', () => {
  it('gera a próxima a partir da última vez feita', () => {
    expect(planejarProximas([rotina()], [{ rotinaId: 'r1', data: BASE }])).toEqual([
      { rotinaId: 'r1', plantaId: 'p1', atividadeId: 'adubo', dataAgendada: dias(14) },
    ]);
  });

  it('com várias conclusões da mesma rotina, usa a mais recente', () => {
    const r = planejarProximas([rotina()], [
      { rotinaId: 'r1', data: dias(-3) },
      { rotinaId: 'r1', data: BASE },
    ]);
    expect(r).toEqual([{ rotinaId: 'r1', plantaId: 'p1', atividadeId: 'adubo', dataAgendada: dias(14) }]);
  });

  it('não gera para rotina pausada, que já tem pendente, sem conclusão ou após a data final', () => {
    const r = planejarProximas(
      [
        rotina({ id: 'pausada', pausada: true }),
        rotina({ id: 'com-pendente', temPendente: true }),
        rotina({ id: 'sem-feita' }),
        rotina({ id: 'acabou', dataFim: dias(5) }),
      ],
      [
        { rotinaId: 'pausada', data: BASE },
        { rotinaId: 'com-pendente', data: BASE },
        { rotinaId: 'acabou', data: BASE },
      ],
    );
    expect(r).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `cd server && npm test -- dominio/rotina` → FAIL (`Cannot find module './rotina'`).

- [ ] **Step 3: Implementar** — `server/src/modules/agenda/dominio/rotina.ts`:
```ts
export const DIA_MS = 86_400_000;

export interface RegraRotina {
  intervaloDias: number;
  dataFim: Date | null;
}

export interface RotinaBase extends RegraRotina {
  id: string;
  plantaId: string;
  atividadeId: string;
  pausada: boolean;
}

export interface RotinaEstado extends RotinaBase {
  /** Já existe uma pendente (fora as que estão sendo concluídas agora). */
  temPendente: boolean;
}

export interface ProximaDeRotina {
  rotinaId: string;
  plantaId: string;
  atividadeId: string;
  dataAgendada: Date;
}

/** Rolante: a próxima é `base + intervalo`; depois da data final não há próxima. */
export function proximaDataRotina(regra: RegraRotina, base: Date): Date | null {
  const data = new Date(base.getTime() + regra.intervaloDias * DIA_MS);
  return regra.dataFim && data > regra.dataFim ? null : data;
}

/** Próximas pendentes das rotinas que acabaram de ser feitas (mantém 1 pendente por rotina). */
export function planejarProximas(
  rotinas: RotinaEstado[],
  feitas: { rotinaId: string; data: Date }[],
): ProximaDeRotina[] {
  const ultima = new Map<string, Date>();
  for (const f of feitas) {
    const atual = ultima.get(f.rotinaId);
    if (!atual || f.data > atual) ultima.set(f.rotinaId, f.data);
  }

  return rotinas.flatMap((r) => {
    const base = ultima.get(r.id);
    if (!base || r.pausada || r.temPendente) return [];
    const dataAgendada = proximaDataRotina(r, base);
    return dataAgendada ? [{ rotinaId: r.id, plantaId: r.plantaId, atividadeId: r.atividadeId, dataAgendada }] : [];
  });
}
```

- [ ] **Step 4: Rodar e ver passar** — `cd server && npm test -- dominio/rotina` → PASS (6 testes).

- [ ] **Step 5: Commit**
```bash
git add server/src/modules/agenda/dominio/rotina.ts server/src/modules/agenda/dominio/rotina.test.ts
git commit -m "feat(api): regras puras da rotina rolante

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Concluir e registrar avançam a rotina

**Files:**
- Create: `server/src/modules/agenda/use-cases/planejar-rotinas.ts`, `server/src/modules/agenda/use-cases/planejar-rotinas.test.ts`
- Modify: `server/src/modules/agenda/agenda.types.ts`, `server/src/modules/agenda/dominio/reconciliar.ts`, `server/src/modules/agenda/dominio/reconciliar.test.ts`, `server/src/modules/agenda/use-cases/planejar-seguimento.ts`, `server/src/modules/agenda/use-cases/planejar-seguimento.test.ts`, `server/src/modules/agenda/use-cases/concluir-agendas.use-case.ts`, `server/src/modules/agenda/use-cases/concluir-agendas.use-case.test.ts`, `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.ts`, `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.test.ts`, `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts`

**Interfaces:**
- Consumes: `RotinaEstado`, `planejarProximas`, `ProximaDeRotina` (Task 2); tabela/colunas da Task 1.
- Produces:
  - `NovaPendente = { plantaId: string; atividadeId: string; dataAgendada: Date; rotinaId?: string }` (exportado de `agenda.types.ts`); `PlanoConclusao.criarPendentes` e `PlanoRegistro.criarPendentes` passam a ser `NovaPendente[]`.
  - `ConclusaoRepository.findPendentesDoUsuario` → `{ id: string; plantaId: string; rotinaId: string | null }[]`.
  - `PendenteReconciliavel.rotinaId: string | null`.
  - `ConclusaoRepository.estadoRotinas(rotinaIds: string[], excluirAgendaIds: string[]): Promise<RotinaEstado[]>`.
  - `planejarRotinas(repo, feitas: { rotinaId: string | null; data: Date }[], excluir: string[]): Promise<ProximaDeRotina[]>`.
  - `planejarSeguimento(..., { ..., jaAgendadas?: { plantaId: string; dataAgendada: Date }[] })`.

- [ ] **Step 1: Testes que falham**

a) `server/src/modules/agenda/use-cases/planejar-rotinas.test.ts`:
```ts
import { planejarRotinas } from './planejar-rotinas';

const DATA = new Date('2026-10-05T12:00:00.000Z');

describe('planejarRotinas', () => {
  const repo = { estadoRotinas: jest.fn() };
  beforeEach(() => repo.estadoRotinas.mockReset());

  it('sem tarefas de rotina, não consulta o banco', async () => {
    expect(await planejarRotinas(repo, [{ rotinaId: null, data: DATA }], ['ag-1'])).toEqual([]);
    expect(repo.estadoRotinas).not.toHaveBeenCalled();
  });

  it('busca o estado das rotinas (sem contar as concluídas agora) e planeja a próxima', async () => {
    repo.estadoRotinas.mockResolvedValue([
      { id: 'r1', plantaId: 'p1', atividadeId: 'at', intervaloDias: 7, dataFim: null, pausada: false, temPendente: false },
    ]);

    const r = await planejarRotinas(repo, [{ rotinaId: 'r1', data: DATA }, { rotinaId: 'r1', data: DATA }], ['ag-1']);

    expect(repo.estadoRotinas).toHaveBeenCalledWith(['r1'], ['ag-1']);
    expect(r).toEqual([
      { rotinaId: 'r1', plantaId: 'p1', atividadeId: 'at', dataAgendada: new Date('2026-10-12T12:00:00.000Z') },
    ]);
  });
});
```

b) Em `planejar-seguimento.test.ts`, adicionar ao `describe`:
```ts
  it('uma pendente recém-planejada (rotina) dentro da margem evita a revisão', async () => {
    const r = await planejarSeguimento(repo, {
      usuarioId: 'u',
      plantas: ['p1', 'p2'],
      proximos: [],
      excluir: [],
      jaAgendadas: [{ plantaId: 'p1', dataAgendada: new Date(AGORA.getTime() + 14 * DIA) }],
    });

    expect(r.revisoes).toEqual([{ plantaId: 'p2', dataAgendada: new Date(AGORA.getTime() + 30 * DIA) }]);
  });
```

c) Em `reconciliar.test.ts`, no helper `pendente(...)`, incluir `rotinaId: null` no objeto retornado.

d) Em `concluir-agendas.use-case.test.ts`:
- no `beforeEach`, `findPendentesDoUsuario` passa a resolver `[{ id: 'ag-1', plantaId: 'pl-1', rotinaId: null }]` e o objeto `repo` ganha `estadoRotinas: jest.fn().mockResolvedValue([]),`;
- em qualquer outro `findPendentesDoUsuario.mockResolvedValue([...])` do arquivo, acrescentar `rotinaId: null` a cada item;
- adicionar no fim do `describe`:
```ts
  describe('rotinas', () => {
    it('concluir tarefa de rotina agenda a próxima a partir da data feita e dispensa a revisão', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', rotinaId: 'r1' }]);
      repo.estadoRotinas.mockResolvedValue([
        { id: 'r1', plantaId: 'pl-1', atividadeId: 'at-1', intervaloDias: 14, dataFim: null, pausada: false, temPendente: false },
      ]);

      await useCase.execute(base, 'user-1');

      expect(repo.estadoRotinas).toHaveBeenCalledWith(['r1'], ['ag-1']);
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'r1', plantaId: 'pl-1', atividadeId: 'at-1', dataAgendada: emDias(14) },
      ]);
      expect(plano().revisoes).toEqual([]);
    });

    it('tarefa avulsa não consulta rotinas', async () => {
      await useCase.execute(base, 'user-1');
      expect(repo.estadoRotinas).not.toHaveBeenCalled();
    });
  });
```

e) Em `registrar-cuidados.use-case.test.ts`:
- o objeto `repo` ganha `estadoRotinas: jest.fn().mockResolvedValue([]),`;
- o objeto `pendente` do `describe('concluir tarefas pendentes pelo registro')` ganha `rotinaId: null`;
- adicionar dentro desse `describe`:
```ts
    it('tarefa de rotina concluída pelo registro agenda a próxima', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([{ ...pendente, rotinaId: 'r1' }]);
      repo.estadoRotinas.mockResolvedValue([
        { id: 'r1', plantaId: 'p1', atividadeId: 'at-1', intervaloDias: 10, dataFim: null, pausada: false, temPendente: false },
      ]);

      await useCase.execute({ ...base, concluirAgendaIds: ['ag-1'] }, 'user-1');

      expect(repo.estadoRotinas).toHaveBeenCalledWith(['r1'], ['ag-1']);
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'r1', plantaId: 'p1', atividadeId: 'at-1', dataAgendada: new Date(AGORA.getTime() + 10 * DIA) },
      ]);
      expect(plano().revisoes).toEqual([]);
    });
```

- [ ] **Step 2: Rodar e ver falhar** — `cd server && npm test -- planejar-rotinas planejar-seguimento concluir-agendas registrar-cuidados reconciliar` → FAIL (módulo/propriedades inexistentes).

- [ ] **Step 3: Tipos** (`agenda.types.ts`)
- adicionar `import { RotinaEstado } from './dominio/rotina';`
- adicionar, antes de `PlanoConclusao`:
  ```ts
  /** Pendente a criar; com `rotinaId` quando é a próxima de uma rotina. */
  export interface NovaPendente {
    plantaId: string;
    atividadeId: string;
    dataAgendada: Date;
    rotinaId?: string;
  }
  ```
- em `PlanoConclusao` e `PlanoRegistro`: `criarPendentes: NovaPendente[];`
- em `ConclusaoRepository`:
  - `findPendentesDoUsuario(ids: string[], usuarioId: string): Promise<{ id: string; plantaId: string; rotinaId: string | null }[]>;`
  - adicionar:
    ```ts
    /** Estado das rotinas; `temPendente` ignora as agendas em `excluirAgendaIds` (as que estão sendo concluídas). */
    estadoRotinas(rotinaIds: string[], excluirAgendaIds: string[]): Promise<RotinaEstado[]>;
    ```
- Em `dominio/reconciliar.ts`, `PendenteReconciliavel` ganha `rotinaId: string | null;`.

- [ ] **Step 4: `planejar-rotinas.ts`**
```ts
import { ConclusaoRepository } from '../agenda.types';
import { planejarProximas, ProximaDeRotina } from '../dominio/rotina';

/** Próximas das rotinas cujas tarefas acabaram de ser feitas (`excluir` = agendas sendo concluídas agora). */
export async function planejarRotinas(
  repo: Pick<ConclusaoRepository, 'estadoRotinas'>,
  feitas: { rotinaId: string | null; data: Date }[],
  excluir: string[],
): Promise<ProximaDeRotina[]> {
  const comRotina = feitas.filter((f): f is { rotinaId: string; data: Date } => !!f.rotinaId);
  if (!comRotina.length) return [];
  const estados = await repo.estadoRotinas([...new Set(comRotina.map((f) => f.rotinaId))], excluir);
  return planejarProximas(estados, comRotina);
}
```

- [ ] **Step 5: `planejar-seguimento.ts`**
- importar `NovaPendente` de `../agenda.types` e trocar o tipo de `Seguimento.criarPendentes` para `NovaPendente[]`;
- no objeto de parâmetros, adicionar `jaAgendadas = []` à desestruturação e `jaAgendadas?: { plantaId: string; dataAgendada: Date }[]` ao tipo, com o comentário `/** Pendentes que serão criadas junto (ex.: próxima da rotina): contam como próxima tarefa. */`;
- logo depois de `const proximas = await repo.proximasPendentes(plantas, agora, excluir);`, adicionar:
  ```ts
      for (const j of jaAgendadas) {
        if (j.dataAgendada < agora) continue;
        const atual = proximas.get(j.plantaId);
        if (!atual || j.dataAgendada < atual) proximas.set(j.plantaId, j.dataAgendada);
      }
  ```

- [ ] **Step 6: Use cases**

`concluir-agendas.use-case.ts`: importar `planejarRotinas` de `./planejar-rotinas`; substituir
```ts
    const seguimento = await planejarSeguimento(this.repo, { usuarioId, plantas, proximos, excluir: ids });
```
por
```ts
    const rotinas = await planejarRotinas(
      this.repo,
      pendentes.map((p) => ({ rotinaId: p.rotinaId, data: dataConcluida })),
      ids,
    );
    const seguimento = await planejarSeguimento(this.repo, { usuarioId, plantas, proximos, excluir: ids, jaAgendadas: rotinas });
```
e, no objeto `plano`, trocar `...seguimento,` por:
```ts
      ...seguimento,
      criarPendentes: [...seguimento.criarPendentes, ...rotinas],
```

`registrar-cuidados.use-case.ts`: importar `planejarRotinas`; substituir a linha do `planejarSeguimento` (e o comentário acima dela) por:
```ts
    // Pendentes concluídas/canceladas aqui avançam a rotina e não "seguram" a Revisão geral
    const rotinas = await planejarRotinas(this.repo, pendentes.map((p) => ({ rotinaId: p.rotinaId, data })), concluirIds);
    const seguimento = await planejarSeguimento(this.repo, {
      usuarioId,
      plantas,
      proximos,
      excluir: concluirIds,
      jaAgendadas: rotinas,
    });

    return this.repo.registrar({
      usuarioId,
      data,
      cuidados,
      absorver,
      cancelar,
      ...seguimento,
      criarPendentes: [...seguimento.criarPendentes, ...rotinas],
    });
```
(removendo o `return` antigo).

- [ ] **Step 7: Repositório** (`prisma-conclusao.repository.ts`)
- `findPendentesDoUsuario`: `select: { id: true, plantaId: true, rotinaId: true }`.
- `findPendentesParaReconciliar`: acrescentar `rotinaId: true` ao `select`.
- adicionar:
```ts
  async estadoRotinas(rotinaIds: string[], excluirAgendaIds: string[]) {
    const rotinas = await prisma.rotina.findMany({
      where: { id: { in: rotinaIds } },
      select: {
        id: true,
        plantaId: true,
        atividadeId: true,
        intervaloDias: true,
        dataFim: true,
        pausada: true,
        _count: { select: { agendas: { where: { status: 'PENDENTE', id: { notIn: excluirAgendaIds } } } } },
      },
    });
    return rotinas.map(({ _count, ...r }) => ({ ...r, temPendente: _count.agendas > 0 }));
  }
```
(`criarPendentes` já é repassado inteiro a `tx.agenda.create`/`createManyAndReturn`, então `rotinaId` é gravado sem outra mudança.)

- [ ] **Step 8: Rodar** — `cd server && npm test && npm run build` → tudo PASS, build limpo.

- [ ] **Step 9: Commit**
```bash
git add server/src/modules/agenda
git commit -m "feat(api): concluir e registrar avançam a rotina

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: "Repetir" nos próximos passos

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts`, `server/src/modules/agenda/agenda.schema.ts`, `server/src/modules/agenda/use-cases/planejar-seguimento.ts`, `server/src/modules/agenda/use-cases/planejar-seguimento.test.ts`, `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts`

**Interfaces:**
- Consumes: Task 3 (`Seguimento`, `NovaPendente`).
- Produces:
  - `Proximo = { atividadeId: string; dataAgendada: string; repetir?: { intervaloDias: number; dataFim?: string } }` (exportado de `agenda.types.ts`), usado em `ConcluirAgendasDTO.proximos` e `RegistrarCuidadosDTO.proximos`.
  - `NovaRotinaDePasso = { plantaId: string; atividadeId: string; intervaloDias: number; dataFim: Date | null; dataAgendada: Date }`; `Seguimento.criarRotinas`, `PlanoConclusao.criarRotinas`, `PlanoRegistro.criarRotinas`: `NovaRotinaDePasso[]`.
  - Body da API: `proximos[].repetir?: { intervaloDias: int 1..3650, dataFim?: datetime }`.

- [ ] **Step 1: Teste que falha** — em `planejar-seguimento.test.ts`, adicionar:
```ts
  it('próximo com repetir vira rotina (e não pendente avulsa)', async () => {
    const r = await planejarSeguimento(repo, {
      usuarioId: 'u',
      plantas: ['p1'],
      proximos: [
        { atividadeId: 'at', dataAgendada: '2026-11-01T12:00:00.000Z', repetir: { intervaloDias: 14, dataFim: '2027-03-01T12:00:00.000Z' } },
        { atividadeId: 'at2', dataAgendada: '2026-11-02T12:00:00.000Z', repetir: { intervaloDias: 7 } },
      ],
      excluir: [],
    });

    expect(r.criarPendentes).toEqual([]);
    expect(r.criarRotinas).toEqual([
      { plantaId: 'p1', atividadeId: 'at', intervaloDias: 14, dataFim: new Date('2027-03-01T12:00:00.000Z'), dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
      { plantaId: 'p1', atividadeId: 'at2', intervaloDias: 7, dataFim: null, dataAgendada: new Date('2026-11-02T12:00:00.000Z') },
    ]);
    expect(r.revisoes).toEqual([]);
  });
```
Run: `cd server && npm test -- planejar-seguimento` → FAIL.

- [ ] **Step 2: Tipos** (`agenda.types.ts`)
```ts
/** Próximo passo; com `repetir`, vira (ou usa) a rotina da planta+atividade. */
export interface Proximo {
  atividadeId: string;
  dataAgendada: string;
  repetir?: { intervaloDias: number; dataFim?: string };
}

export interface NovaRotinaDePasso {
  plantaId: string;
  atividadeId: string;
  intervaloDias: number;
  dataFim: Date | null;
  dataAgendada: Date;
}
```
Trocar `proximos?: { atividadeId: string; dataAgendada: string }[];` por `proximos?: Proximo[];` em `ConcluirAgendasDTO` e `RegistrarCuidadosDTO`. Adicionar `criarRotinas: NovaRotinaDePasso[];` em `PlanoConclusao` e `PlanoRegistro` (depois de `criarPendentes`).

- [ ] **Step 3: `planejar-seguimento.ts`**
- importar `NovaRotinaDePasso, Proximo` de `../agenda.types`; `Seguimento` ganha `criarRotinas: NovaRotinaDePasso[];`; o parâmetro `proximos` passa a ser `Proximo[]`.
- substituir o cálculo de `criarPendentes` por:
```ts
  const criarPendentes = plantas.flatMap((plantaId) =>
    proximos
      .filter((p) => !p.repetir)
      .map((p) => ({ plantaId, atividadeId: p.atividadeId, dataAgendada: new Date(p.dataAgendada) })),
  );
  const criarRotinas = plantas.flatMap((plantaId) =>
    proximos.flatMap((p) =>
      p.repetir
        ? [
            {
              plantaId,
              atividadeId: p.atividadeId,
              intervaloDias: p.repetir.intervaloDias,
              dataFim: p.repetir.dataFim ? new Date(p.repetir.dataFim) : null,
              dataAgendada: new Date(p.dataAgendada),
            },
          ]
        : [],
    ),
  );
```
- o `return` passa a ser `return { criarPendentes, criarRotinas, revisoes };`.

- [ ] **Step 4: Schema** (`agenda.schema.ts`) — antes de `concluirAgendasSchema`, adicionar:
```ts
const proximoSchema = z.object({
  atividadeId: z.string().uuid(),
  dataAgendada: z.string().datetime(),
  repetir: z
    .object({
      intervaloDias: z
        .number()
        .int({ message: 'O intervalo deve ser em dias inteiros.' })
        .min(1, { message: 'O intervalo mínimo é 1 dia.' })
        .max(3650, { message: 'O intervalo máximo é 3650 dias.' }),
      dataFim: z.string().datetime().optional(),
    })
    .optional(),
});
```
e trocar o `z.object({ atividadeId: z.string().uuid(), dataAgendada: z.string().datetime() })` dentro de `proximos` (nos dois schemas) por `proximoSchema`.

- [ ] **Step 5: Repositório** (`prisma-conclusao.repository.ts`) — adicionar o helper privado:
```ts
  /** Próximo passo com repetição: cria a rotina (ou usa a existente) e a pendente, mantendo 1 pendente por rotina. */
  private async criarComRotinas(tx: Prisma.TransactionClient, itens: NovaRotinaDePasso[]) {
    const criadas = [];
    for (const r of itens) {
      const existente = await tx.rotina.findUnique({
        where: { plantaId_atividadeId: { plantaId: r.plantaId, atividadeId: r.atividadeId } },
        select: { id: true, _count: { select: { agendas: { where: { status: 'PENDENTE' } } } } },
      });
      // Rotina existente com pendente: a nova tarefa fica avulsa (a rotina já tem a sua)
      const rotinaId = existente
        ? existente._count.agendas
          ? undefined
          : existente.id
        : (
            await tx.rotina.create({
              data: { plantaId: r.plantaId, atividadeId: r.atividadeId, intervaloDias: r.intervaloDias, dataFim: r.dataFim },
            })
          ).id;
      criadas.push(
        await tx.agenda.create({
          data: { plantaId: r.plantaId, atividadeId: r.atividadeId, dataAgendada: r.dataAgendada, rotinaId },
        }),
      );
    }
    return criadas;
  }
```
(importar `NovaRotinaDePasso` de `../agenda.types`). Em `registrar`, trocar a linha `const criadas = plano.criarPendentes.length ? ... : [];` por:
```ts
        const criadas = [
          ...(plano.criarPendentes.length ? await tx.agenda.createManyAndReturn({ data: plano.criarPendentes }) : []),
          ...(await this.criarComRotinas(tx, plano.criarRotinas)),
        ];
```
Em `executar`, logo depois do `for (const p of plano.criarPendentes) { ... }`, adicionar:
```ts
        criadas.push(...(await this.criarComRotinas(tx, plano.criarRotinas)));
```

- [ ] **Step 6: Rodar** — `cd server && npm test && npm run build` → PASS, build limpo.

- [ ] **Step 7: Commit**
```bash
git add server/src/modules/agenda
git commit -m "feat(api): próximos passos podem repetir (viram rotina)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Módulo `rotina` — criar, listar, editar, pausar/retomar, apagar

**Files:**
- Create: `server/src/modules/rotina/rotina.types.ts`, `rotina.schema.ts`, `rotina.controller.ts`, `rotina.router.ts`, `repositories/prisma-rotina.repository.ts`, `use-cases/criar-rotinas.use-case.ts`, `use-cases/listar-rotinas.use-case.ts`, `use-cases/atualizar-rotina.use-case.ts`, `use-cases/alternar-pausa-rotina.use-case.ts`, `use-cases/apagar-rotina.use-case.ts`, `use-cases/rotina.use-cases.test.ts`, `use-cases/index.ts`
- Modify: `server/src/app.ts`

**Interfaces:**
- Consumes: `proximaDataRotina`, `RotinaBase`, `DIA_MS` (Task 2).
- Produces (HTTP, todas autenticadas):
  - `POST /api/rotinas` body `{ plantaIds: uuid[1..200], atividadeIds: uuid[1..20], intervaloDias: 1..3650, dataFim?, primeiraData?, detalhes? }` → 201 `{ criadas: Rotina[], conflitos: { plantaId, atividadeId }[] }`
  - `GET /api/rotinas?plantaId=` → `Rotina[]` com `atividade {id,nome}`, `planta {id,nome,identificador}`, `proxima {id,dataAgendada} | null`
  - `PUT /api/rotinas/:id` body `{ intervaloDias?, dataFim?: datetime | null }`; `DELETE /api/rotinas/:id` → 204; `POST /api/rotinas/:id/pausar`, `POST /api/rotinas/:id/retomar`
  - Erros: 404 `'Rotina não encontrada.'`; 403 `'Acesso negado. A planta não pertence a si.'`; 400 `'Atividade não encontrada.'`, `'Máximo de 200 rotinas por vez.'`, `'A data final é antes da primeira tarefa.'`, ZodError.
  - Interface `RotinaRepository` e tipos abaixo (Task 6 adiciona métodos).

- [ ] **Step 1: Tipos** — `server/src/modules/rotina/rotina.types.ts`:
```ts
import { RotinaBase } from '../agenda/dominio/rotina';

export interface CriarRotinasDTO {
  plantaIds: string[];
  atividadeIds: string[];
  intervaloDias: number;
  dataFim?: string;
  /** Data da 1ª tarefa; padrão = hoje + intervalo. */
  primeiraData?: string;
  detalhes?: string;
}

export interface AtualizarRotinaDTO {
  intervaloDias?: number;
  dataFim?: string | null;
}

export interface RotinaInfo extends RotinaBase {
  pendenteId: string | null;
  ultimaConclusao: Date | null;
}

export interface NovaRotina {
  plantaId: string;
  atividadeId: string;
  intervaloDias: number;
  dataFim: Date | null;
  primeiraData: Date;
  detalhes?: string;
}

/** O que fazer com a pendente da rotina ao mudar a rotina. */
export type AjustePendente =
  | { tipo: 'manter' }
  | { tipo: 'mover'; agendaId: string; data: Date }
  | { tipo: 'cancelar'; agendaId: string }
  | { tipo: 'criar'; data: Date };

export interface RotinaRepository {
  contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>;
  atividadesExistem(ids: string[]): Promise<boolean>;
  /** Pares (planta, atividade) que já têm rotina. */
  existentes(plantaIds: string[], atividadeIds: string[]): Promise<{ plantaId: string; atividadeId: string }[]>;
  /** Cria as rotinas e a 1ª pendente de cada (tudo ou nada). */
  criar(itens: NovaRotina[]): Promise<any[]>;
  listar(usuarioId: string, plantaId?: string): Promise<any[]>;
  findDoUsuario(id: string, usuarioId: string): Promise<RotinaInfo | null>;
  /** Atualiza a rotina e ajusta a pendente numa transação. */
  atualizar(
    id: string,
    dados: { intervaloDias?: number; dataFim?: Date | null; pausada?: boolean },
    ajuste: AjustePendente,
  ): Promise<any>;
  /** Cancela a pendente e apaga a rotina (o histórico fica, sem vínculo). */
  apagar(id: string): Promise<void>;
}
```

- [ ] **Step 2: Testes que falham** — `server/src/modules/rotina/use-cases/rotina.use-cases.test.ts`:
```ts
import { AlternarPausaRotinaUseCase, ApagarRotinaUseCase, AtualizarRotinaUseCase, CriarRotinasUseCase } from '.';
import { RotinaInfo, RotinaRepository } from '../rotina.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');
const emDias = (n: number) => new Date(AGORA.getTime() + n * DIA);

const info = (over: Partial<RotinaInfo> = {}): RotinaInfo => ({
  id: 'r1',
  plantaId: 'p1',
  atividadeId: 'adubo',
  intervaloDias: 14,
  dataFim: null,
  pausada: false,
  pendenteId: 'ag-1',
  ultimaConclusao: null,
  ...over,
});

describe('use cases de rotina', () => {
  let repo: jest.Mocked<RotinaRepository>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      contarPlantasDoUsuario: jest.fn().mockResolvedValue(2),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      existentes: jest.fn().mockResolvedValue([]),
      criar: jest.fn().mockImplementation(async (itens) => itens),
      listar: jest.fn().mockResolvedValue([]),
      findDoUsuario: jest.fn().mockResolvedValue(info()),
      atualizar: jest.fn().mockResolvedValue({}),
      apagar: jest.fn().mockResolvedValue(undefined),
    };
  });
  afterEach(() => jest.useRealTimers());

  describe('CriarRotinasUseCase', () => {
    const useCase = () => new CriarRotinasUseCase(repo);

    it('cria uma rotina por planta+atividade, com 1ª tarefa em hoje + intervalo, e devolve os conflitos', async () => {
      repo.existentes.mockResolvedValue([{ plantaId: 'p2', atividadeId: 'adubo' }]);

      const r = await useCase().execute(
        { plantaIds: ['p1', 'p2', 'p1'], atividadeIds: ['adubo'], intervaloDias: 14, detalhes: ' bioplant ' },
        'u',
      );

      expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1', 'p2'], 'u');
      expect(repo.existentes).toHaveBeenCalledWith(['p1', 'p2'], ['adubo']);
      expect(repo.criar).toHaveBeenCalledWith([
        { plantaId: 'p1', atividadeId: 'adubo', intervaloDias: 14, dataFim: null, primeiraData: emDias(14), detalhes: 'bioplant' },
      ]);
      expect(r.conflitos).toEqual([{ plantaId: 'p2', atividadeId: 'adubo' }]);
    });

    it('usa a primeira data e a data final informadas', async () => {
      repo.contarPlantasDoUsuario.mockResolvedValue(1);
      await useCase().execute(
        { plantaIds: ['p1'], atividadeIds: ['adubo'], intervaloDias: 7, primeiraData: emDias(2).toISOString(), dataFim: emDias(60).toISOString() },
        'u',
      );
      expect(repo.criar).toHaveBeenCalledWith([
        { plantaId: 'p1', atividadeId: 'adubo', intervaloDias: 7, dataFim: emDias(60), primeiraData: emDias(2), detalhes: undefined },
      ]);
    });

    it('recusa data final antes da primeira tarefa', async () => {
      repo.contarPlantasDoUsuario.mockResolvedValue(1);
      await expect(
        useCase().execute({ plantaIds: ['p1'], atividadeIds: ['adubo'], intervaloDias: 7, dataFim: emDias(3).toISOString() }, 'u'),
      ).rejects.toThrow('A data final é antes da primeira tarefa.');
    });

    it('recusa planta de outro usuário e atividade inexistente', async () => {
      repo.contarPlantasDoUsuario.mockResolvedValue(1);
      await expect(useCase().execute({ plantaIds: ['p1', 'p2'], atividadeIds: ['adubo'], intervaloDias: 7 }, 'u')).rejects.toThrow(
        'Acesso negado. A planta não pertence a si.',
      );
      repo.contarPlantasDoUsuario.mockResolvedValue(2);
      repo.atividadesExistem.mockResolvedValue(false);
      await expect(useCase().execute({ plantaIds: ['p1', 'p2'], atividadeIds: ['x'], intervaloDias: 7 }, 'u')).rejects.toThrow(
        'Atividade não encontrada.',
      );
      expect(repo.criar).not.toHaveBeenCalled();
    });

    it('recusa mais de 200 rotinas de uma vez', async () => {
      const plantaIds = Array.from({ length: 101 }, (_, i) => `p${i}`);
      repo.contarPlantasDoUsuario.mockResolvedValue(101);
      await expect(useCase().execute({ plantaIds, atividadeIds: ['a', 'b'], intervaloDias: 7 }, 'u')).rejects.toThrow(
        'Máximo de 200 rotinas por vez.',
      );
    });
  });

  describe('AtualizarRotinaUseCase', () => {
    const useCase = () => new AtualizarRotinaUseCase(repo);

    it('move a pendente para a última conclusão + novo intervalo', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ ultimaConclusao: emDias(-2) }));
      await useCase().execute('r1', { intervaloDias: 10 }, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 10, dataFim: null }, { tipo: 'mover', agendaId: 'ag-1', data: emDias(8) });
    });

    it('sem conclusão, conta a partir de hoje; sem pendente, cria', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pendenteId: null }));
      await useCase().execute('r1', {}, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 14, dataFim: null }, { tipo: 'criar', data: emDias(14) });
    });

    it('data final antes da próxima cancela a pendente', async () => {
      await useCase().execute('r1', { dataFim: emDias(5).toISOString() }, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 14, dataFim: emDias(5) }, { tipo: 'cancelar', agendaId: 'ag-1' });
    });

    it('rotina pausada só muda a regra', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pausada: true, pendenteId: null }));
      await useCase().execute('r1', { intervaloDias: 30, dataFim: null }, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 30, dataFim: null }, { tipo: 'manter' });
    });

    it('rotina de outro usuário ou inexistente', async () => {
      repo.findDoUsuario.mockResolvedValue(null);
      await expect(useCase().execute('r1', {}, 'u')).rejects.toThrow('Rotina não encontrada.');
    });
  });

  describe('AlternarPausaRotinaUseCase', () => {
    const useCase = () => new AlternarPausaRotinaUseCase(repo);

    it('pausar cancela a pendente', async () => {
      await useCase().execute('r1', true, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: true }, { tipo: 'cancelar', agendaId: 'ag-1' });
    });

    it('retomar gera a próxima a partir de hoje', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pausada: true, pendenteId: null, ultimaConclusao: emDias(-40) }));
      await useCase().execute('r1', false, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: false }, { tipo: 'criar', data: emDias(14) });
    });

    it('retomar com pendente existente mantém a pendente', async () => {
      await useCase().execute('r1', false, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: false }, { tipo: 'manter' });
    });

    it('retomar depois da data final não gera tarefa', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pausada: true, pendenteId: null, dataFim: emDias(3) }));
      await useCase().execute('r1', false, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: false }, { tipo: 'manter' });
    });
  });

  describe('ApagarRotinaUseCase', () => {
    it('apaga a rotina do usuário', async () => {
      await new ApagarRotinaUseCase(repo).execute('r1', 'u');
      expect(repo.findDoUsuario).toHaveBeenCalledWith('r1', 'u');
      expect(repo.apagar).toHaveBeenCalledWith('r1');
    });

    it('rotina inexistente', async () => {
      repo.findDoUsuario.mockResolvedValue(null);
      await expect(new ApagarRotinaUseCase(repo).execute('r1', 'u')).rejects.toThrow('Rotina não encontrada.');
      expect(repo.apagar).not.toHaveBeenCalled();
    });
  });
});
```
Run: `cd server && npm test -- rotina.use-cases` → FAIL (módulo inexistente).

- [ ] **Step 3: Use cases**

`use-cases/criar-rotinas.use-case.ts`:
```ts
import { DIA_MS } from '../../agenda/dominio/rotina';
import { CriarRotinasDTO, RotinaRepository } from '../rotina.types';

export const MAX_ROTINAS_LOTE = 200;

/** Cria a mesma rotina em várias plantas (uma por planta+atividade); pares que já têm rotina voltam em `conflitos`. */
export class CriarRotinasUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(dto: CriarRotinasDTO, usuarioId: string) {
    const plantaIds = [...new Set(dto.plantaIds)];
    const atividadeIds = [...new Set(dto.atividadeIds)];
    if (plantaIds.length * atividadeIds.length > MAX_ROTINAS_LOTE) throw new Error('Máximo de 200 rotinas por vez.');

    if ((await this.repo.contarPlantasDoUsuario(plantaIds, usuarioId)) !== plantaIds.length) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }
    if (!(await this.repo.atividadesExistem(atividadeIds))) throw new Error('Atividade não encontrada.');

    const primeiraData = dto.primeiraData ? new Date(dto.primeiraData) : new Date(Date.now() + dto.intervaloDias * DIA_MS);
    const dataFim = dto.dataFim ? new Date(dto.dataFim) : null;
    if (dataFim && dataFim < primeiraData) throw new Error('A data final é antes da primeira tarefa.');

    const conflitos = await this.repo.existentes(plantaIds, atividadeIds);
    const ocupado = new Set(conflitos.map((c) => `${c.plantaId}|${c.atividadeId}`));
    const detalhes = dto.detalhes?.trim() || undefined;

    const novas = plantaIds.flatMap((plantaId) =>
      atividadeIds
        .filter((atividadeId) => !ocupado.has(`${plantaId}|${atividadeId}`))
        .map((atividadeId) => ({ plantaId, atividadeId, intervaloDias: dto.intervaloDias, dataFim, primeiraData, detalhes })),
    );
    const criadas = novas.length ? await this.repo.criar(novas) : [];
    return { criadas, conflitos };
  }
}
```

`use-cases/listar-rotinas.use-case.ts`:
```ts
import { RotinaRepository } from '../rotina.types';

export class ListarRotinasUseCase {
  constructor(private repo: RotinaRepository) {}

  execute(usuarioId: string, plantaId?: string) {
    return this.repo.listar(usuarioId, plantaId);
  }
}
```

`use-cases/atualizar-rotina.use-case.ts`:
```ts
import { proximaDataRotina } from '../../agenda/dominio/rotina';
import { AjustePendente, AtualizarRotinaDTO, RotinaRepository } from '../rotina.types';

/** Muda intervalo/data final e recalcula a pendente a partir da última vez feita (ou de hoje). */
export class AtualizarRotinaUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(id: string, dto: AtualizarRotinaDTO, usuarioId: string) {
    const rotina = await this.repo.findDoUsuario(id, usuarioId);
    if (!rotina) throw new Error('Rotina não encontrada.');

    const regra = {
      intervaloDias: dto.intervaloDias ?? rotina.intervaloDias,
      dataFim: dto.dataFim === undefined ? rotina.dataFim : dto.dataFim ? new Date(dto.dataFim) : null,
    };

    let ajuste: AjustePendente = { tipo: 'manter' };
    if (!rotina.pausada) {
      const data = proximaDataRotina(regra, rotina.ultimaConclusao ?? new Date());
      if (data) ajuste = rotina.pendenteId ? { tipo: 'mover', agendaId: rotina.pendenteId, data } : { tipo: 'criar', data };
      else if (rotina.pendenteId) ajuste = { tipo: 'cancelar', agendaId: rotina.pendenteId };
    }
    return this.repo.atualizar(id, regra, ajuste);
  }
}
```

`use-cases/alternar-pausa-rotina.use-case.ts`:
```ts
import { proximaDataRotina } from '../../agenda/dominio/rotina';
import { AjustePendente, RotinaRepository } from '../rotina.types';

/** Pausar cancela a pendente; retomar (ou "agendar próxima" de rotina sem pendente) gera a partir de hoje. */
export class AlternarPausaRotinaUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(id: string, pausada: boolean, usuarioId: string) {
    const rotina = await this.repo.findDoUsuario(id, usuarioId);
    if (!rotina) throw new Error('Rotina não encontrada.');

    let ajuste: AjustePendente = { tipo: 'manter' };
    if (pausada) {
      if (rotina.pendenteId) ajuste = { tipo: 'cancelar', agendaId: rotina.pendenteId };
    } else if (!rotina.pendenteId) {
      const data = proximaDataRotina(rotina, new Date());
      if (data) ajuste = { tipo: 'criar', data };
    }
    return this.repo.atualizar(id, { pausada }, ajuste);
  }
}
```

`use-cases/apagar-rotina.use-case.ts`:
```ts
import { RotinaRepository } from '../rotina.types';

export class ApagarRotinaUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(id: string, usuarioId: string) {
    if (!(await this.repo.findDoUsuario(id, usuarioId))) throw new Error('Rotina não encontrada.');
    await this.repo.apagar(id);
  }
}
```

`use-cases/index.ts`:
```ts
export { CriarRotinasUseCase } from './criar-rotinas.use-case';
export { ListarRotinasUseCase } from './listar-rotinas.use-case';
export { AtualizarRotinaUseCase } from './atualizar-rotina.use-case';
export { AlternarPausaRotinaUseCase } from './alternar-pausa-rotina.use-case';
export { ApagarRotinaUseCase } from './apagar-rotina.use-case';
```

- [ ] **Step 4: Rodar** — `cd server && npm test -- rotina.use-cases` → PASS.

- [ ] **Step 5: Repositório** — `server/src/modules/rotina/repositories/prisma-rotina.repository.ts`:
```ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { AjustePendente, NovaRotina, RotinaRepository } from '../rotina.types';

const INCLUDE_LISTA = {
  atividade: { select: { id: true, nome: true } },
  planta: { select: { id: true, nome: true, identificador: true } },
  agendas: {
    where: { status: 'PENDENTE' as const },
    select: { id: true, dataAgendada: true },
    orderBy: { dataAgendada: 'asc' as const },
    take: 1,
  },
};

export class PrismaRotinaRepository implements RotinaRepository {
  async contarPlantasDoUsuario(plantaIds: string[], usuarioId: string) {
    return prisma.planta.count({ where: { id: { in: plantaIds }, usuarioId } });
  }

  async atividadesExistem(ids: string[]) {
    return (await prisma.atividade.count({ where: { id: { in: ids } } })) === ids.length;
  }

  async existentes(plantaIds: string[], atividadeIds: string[]) {
    return prisma.rotina.findMany({
      where: { plantaId: { in: plantaIds }, atividadeId: { in: atividadeIds } },
      select: { plantaId: true, atividadeId: true },
    });
  }

  async criar(itens: NovaRotina[]) {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const criadas = [];
        for (const n of itens) {
          const rotina = await tx.rotina.create({
            data: { plantaId: n.plantaId, atividadeId: n.atividadeId, intervaloDias: n.intervaloDias, dataFim: n.dataFim },
          });
          await tx.agenda.create({
            data: {
              plantaId: n.plantaId,
              atividadeId: n.atividadeId,
              dataAgendada: n.primeiraData,
              rotinaId: rotina.id,
              ...(n.detalhes ? { detalhes: n.detalhes } : {}),
            },
          });
          criadas.push(rotina);
        }
        return criadas;
      },
      { timeout: 20_000 },
    );
  }

  async listar(usuarioId: string, plantaId?: string) {
    const rotinas = await prisma.rotina.findMany({
      where: { planta: { usuarioId }, ...(plantaId ? { plantaId } : {}) },
      include: INCLUDE_LISTA,
      orderBy: { createdAt: 'asc' },
    });
    return rotinas.map(({ agendas, ...r }) => ({ ...r, proxima: agendas[0] ?? null }));
  }

  async findDoUsuario(id: string, usuarioId: string) {
    const r = await prisma.rotina.findFirst({
      where: { id, planta: { usuarioId } },
      include: {
        agendas: {
          where: { status: { in: ['PENDENTE', 'CONCLUIDO'] } },
          select: { id: true, status: true, dataAgendada: true, dataConcluida: true },
        },
      },
    });
    if (!r) return null;
    const { agendas, ...rotina } = r;
    const conclusoes = agendas
      .filter((a) => a.status === 'CONCLUIDO')
      .map((a) => (a.dataConcluida ?? a.dataAgendada).getTime());
    return {
      id: rotina.id,
      plantaId: rotina.plantaId,
      atividadeId: rotina.atividadeId,
      intervaloDias: rotina.intervaloDias,
      dataFim: rotina.dataFim,
      pausada: rotina.pausada,
      pendenteId: agendas.find((a) => a.status === 'PENDENTE')?.id ?? null,
      ultimaConclusao: conclusoes.length ? new Date(Math.max(...conclusoes)) : null,
    };
  }

  async atualizar(
    id: string,
    dados: { intervaloDias?: number; dataFim?: Date | null; pausada?: boolean },
    ajuste: AjustePendente,
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const rotina = await tx.rotina.update({ where: { id }, data: dados });
      if (ajuste.tipo === 'mover') {
        await tx.agenda.update({ where: { id: ajuste.agendaId }, data: { dataAgendada: ajuste.data } });
      } else if (ajuste.tipo === 'cancelar') {
        await tx.agenda.update({ where: { id: ajuste.agendaId }, data: { status: 'CANCELADO' } });
      } else if (ajuste.tipo === 'criar') {
        await tx.agenda.create({
          data: { plantaId: rotina.plantaId, atividadeId: rotina.atividadeId, dataAgendada: ajuste.data, rotinaId: id },
        });
      }
      const { agendas, ...r } = await tx.rotina.findUniqueOrThrow({ where: { id }, include: INCLUDE_LISTA });
      return { ...r, proxima: agendas[0] ?? null };
    });
  }

  async apagar(id: string) {
    await prisma.$transaction([
      prisma.agenda.updateMany({ where: { rotinaId: id, status: 'PENDENTE' }, data: { status: 'CANCELADO' } }),
      prisma.rotina.delete({ where: { id } }),
    ]);
  }
}
```

- [ ] **Step 6: Schema, controller, router, app**

`rotina.schema.ts`:
```ts
import { z } from 'zod';

const uuid = (msg: string) => z.string().uuid({ message: msg });
export const intervaloDiasSchema = z
  .number({ invalid_type_error: 'Intervalo inválido.' })
  .int({ message: 'O intervalo deve ser em dias inteiros.' })
  .min(1, { message: 'O intervalo mínimo é 1 dia.' })
  .max(3650, { message: 'O intervalo máximo é 3650 dias.' });

export const criarRotinasSchema = z.object({
  body: z.object({
    plantaIds: z.array(uuid('ID de planta inválido.')).min(1, { message: 'Informe ao menos uma planta.' }).max(200),
    atividadeIds: z.array(uuid('ID de atividade inválido.')).min(1, { message: 'Informe ao menos um cuidado.' }).max(20),
    intervaloDias: intervaloDiasSchema,
    dataFim: z.string().datetime().optional(),
    primeiraData: z.string().datetime().optional(),
    detalhes: z.string().max(2000, { message: 'Observação muito longa.' }).optional(),
  }),
});

export const rotinaIdSchema = z.object({ params: z.object({ id: uuid('ID da rotina inválido.') }) });

export const atualizarRotinaSchema = z.object({
  params: z.object({ id: uuid('ID da rotina inválido.') }),
  body: z.object({
    intervaloDias: intervaloDiasSchema.optional(),
    dataFim: z.string().datetime().nullable().optional(),
  }),
});

export const listarRotinasSchema = z.object({
  query: z.object({ plantaId: uuid('ID de planta inválido.').optional() }),
});
```

`rotina.controller.ts`:
```ts
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { PrismaRotinaRepository } from './repositories/prisma-rotina.repository';
import { atualizarRotinaSchema, criarRotinasSchema, listarRotinasSchema, rotinaIdSchema } from './rotina.schema';
import {
  AlternarPausaRotinaUseCase,
  ApagarRotinaUseCase,
  AtualizarRotinaUseCase,
  CriarRotinasUseCase,
  ListarRotinasUseCase,
} from './use-cases';

const repo = new PrismaRotinaRepository();
const criar = new CriarRotinasUseCase(repo);
const listar = new ListarRotinasUseCase(repo);
const atualizar = new AtualizarRotinaUseCase(repo);
const alternarPausa = new AlternarPausaRotinaUseCase(repo);
const apagar = new ApagarRotinaUseCase(repo);

const MENSAGENS_400 = ['Atividade não encontrada.', 'Máximo de 200 rotinas por vez.', 'A data final é antes da primeira tarefa.'];

/** Traduz erros de domínio/validação em status HTTP. */
export function responderErroRotina(res: Response, error: unknown, contexto: string) {
  if (error instanceof ZodError) return res.status(400).json({ error: error.errors[0]?.message ?? 'Dados inválidos' });
  if (error instanceof Error) {
    if (['Rotina não encontrada.', 'Acesso negado ou agendamento não encontrado.'].includes(error.message)) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Acesso negado. A planta não pertence a si.') return res.status(403).json({ error: error.message });
    if ([...MENSAGENS_400, 'Só tarefas de rotina podem ser puladas.'].includes(error.message)) {
      return res.status(400).json({ error: error.message });
    }
  }
  console.error(`Erro ao ${contexto}:`, error);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}

export const rotinaController = {
  criar: async (req: Request, res: Response) => {
    try {
      const { body } = criarRotinasSchema.parse({ body: req.body });
      res.status(201).json(await criar.execute(body, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'criar rotinas');
    }
  },

  listar: async (req: Request, res: Response) => {
    try {
      const { query } = listarRotinasSchema.parse({ query: req.query });
      res.json(await listar.execute(req.user!.userId, query.plantaId));
    } catch (error) {
      responderErroRotina(res, error, 'listar rotinas');
    }
  },

  atualizar: async (req: Request, res: Response) => {
    try {
      const { params, body } = atualizarRotinaSchema.parse({ params: req.params, body: req.body });
      res.json(await atualizar.execute(params.id, body, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'atualizar rotina');
    }
  },

  pausar: async (req: Request, res: Response) => {
    try {
      const { params } = rotinaIdSchema.parse({ params: req.params });
      res.json(await alternarPausa.execute(params.id, true, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'pausar rotina');
    }
  },

  retomar: async (req: Request, res: Response) => {
    try {
      const { params } = rotinaIdSchema.parse({ params: req.params });
      res.json(await alternarPausa.execute(params.id, false, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'retomar rotina');
    }
  },

  apagar: async (req: Request, res: Response) => {
    try {
      const { params } = rotinaIdSchema.parse({ params: req.params });
      await apagar.execute(params.id, req.user!.userId);
      res.status(204).send();
    } catch (error) {
      responderErroRotina(res, error, 'apagar rotina');
    }
  },
};
```

`rotina.router.ts`:
```ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rotinaController } from './rotina.controller';

const rotinaRouter = Router();
rotinaRouter.use(authMiddleware);

rotinaRouter.get('/', rotinaController.listar);
rotinaRouter.post('/', rotinaController.criar);
rotinaRouter.put('/:id', rotinaController.atualizar);
rotinaRouter.delete('/:id', rotinaController.apagar);
rotinaRouter.post('/:id/pausar', rotinaController.pausar);
rotinaRouter.post('/:id/retomar', rotinaController.retomar);

export default rotinaRouter;
```

`app.ts`: importar `import rotinaRouter from './modules/rotina/rotina.router';` junto aos outros e registrar `app.use('/api/rotinas', rotinaRouter);` logo depois de `app.use('/api/agendas', agendaRouter);`.

- [ ] **Step 7: Rodar** — `cd server && npm test && npm run build` → PASS, build limpo.

- [ ] **Step 8: Commit**
```bash
git add server/src/modules/rotina server/src/app.ts
git commit -m "feat(api): módulo de rotinas (criar, listar, editar, pausar, apagar)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Pular esta vez + rotina nas agendas

**Files:**
- Create: `server/src/modules/rotina/use-cases/pular-tarefa.use-case.ts`, `server/src/modules/rotina/use-cases/pular-tarefa.use-case.test.ts`
- Modify: `server/src/modules/rotina/rotina.types.ts`, `server/src/modules/rotina/use-cases/index.ts`, `server/src/modules/rotina/use-cases/rotina.use-cases.test.ts` (mock), `server/src/modules/rotina/repositories/prisma-rotina.repository.ts`, `server/src/modules/rotina/rotina.controller.ts`, `server/src/modules/agenda/agenda.router.ts`, `server/src/modules/agenda/repositories/prisma-agenda.repository.ts`

**Interfaces:**
- Consumes: Task 5 (`RotinaRepository`, `responderErroRotina`, controller), Task 2 (`proximaDataRotina`, `RotinaBase`, `ProximaDeRotina`).
- Produces:
  - `RotinaRepository.findPendenteComRotina(agendaId: string, usuarioId: string): Promise<{ id: string; rotina: RotinaBase | null } | null>` e `RotinaRepository.pular(agendaId: string, proxima: ProximaDeRotina | null): Promise<void>`.
  - `POST /api/agendas/:id/pular` → 204; 404 `'Acesso negado ou agendamento não encontrado.'`; 400 `'Só tarefas de rotina podem ser puladas.'`.
  - `GET /api/agendas` e `GET /api/agendas/:id` passam a incluir `rotina: { id, intervaloDias, pausada } | null`.

- [ ] **Step 1: Teste que falha** — `pular-tarefa.use-case.test.ts`:
```ts
import { PularTarefaUseCase } from './pular-tarefa.use-case';
import { RotinaRepository } from '../rotina.types';

const AGORA = new Date('2026-10-05T12:00:00.000Z');
const rotina = { id: 'r1', plantaId: 'p1', atividadeId: 'rega', intervaloDias: 3, dataFim: null, pausada: false };

describe('PularTarefaUseCase', () => {
  let repo: jest.Mocked<Pick<RotinaRepository, 'findPendenteComRotina' | 'pular'>>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      findPendenteComRotina: jest.fn().mockResolvedValue({ id: 'ag-1', rotina }),
      pular: jest.fn().mockResolvedValue(undefined),
    };
  });
  afterEach(() => jest.useRealTimers());

  it('marca como pulada e agenda a próxima a partir de hoje', async () => {
    await new PularTarefaUseCase(repo).execute('ag-1', 'u');

    expect(repo.findPendenteComRotina).toHaveBeenCalledWith('ag-1', 'u');
    expect(repo.pular).toHaveBeenCalledWith('ag-1', {
      rotinaId: 'r1',
      plantaId: 'p1',
      atividadeId: 'rega',
      dataAgendada: new Date('2026-10-08T12:00:00.000Z'),
    });
  });

  it('depois da data final, só pula', async () => {
    repo.findPendenteComRotina.mockResolvedValue({ id: 'ag-1', rotina: { ...rotina, dataFim: new Date('2026-10-06T00:00:00.000Z') } });
    await new PularTarefaUseCase(repo).execute('ag-1', 'u');
    expect(repo.pular).toHaveBeenCalledWith('ag-1', null);
  });

  it('tarefa avulsa não pode ser pulada', async () => {
    repo.findPendenteComRotina.mockResolvedValue({ id: 'ag-1', rotina: null });
    await expect(new PularTarefaUseCase(repo).execute('ag-1', 'u')).rejects.toThrow('Só tarefas de rotina podem ser puladas.');
    expect(repo.pular).not.toHaveBeenCalled();
  });

  it('tarefa inexistente, de outro usuário ou já resolvida', async () => {
    repo.findPendenteComRotina.mockResolvedValue(null);
    await expect(new PularTarefaUseCase(repo).execute('ag-1', 'u')).rejects.toThrow(
      'Acesso negado ou agendamento não encontrado.',
    );
  });
});
```
Run: `cd server && npm test -- pular-tarefa` → FAIL.

- [ ] **Step 2: Tipos e use case**

Em `rotina.types.ts`: importar também `ProximaDeRotina` de `../agenda/dominio/rotina` e adicionar à interface `RotinaRepository`:
```ts
  /** Pendente do usuário e sua rotina (null se não existe, é de outro usuário ou não está pendente). */
  findPendenteComRotina(agendaId: string, usuarioId: string): Promise<{ id: string; rotina: RotinaBase | null } | null>;
  /** Marca a pendente como pulada (cancelada) e cria a próxima, se houver. */
  pular(agendaId: string, proxima: ProximaDeRotina | null): Promise<void>;
```
No `beforeEach` de `rotina.use-cases.test.ts`, acrescentar ao objeto `repo`: `findPendenteComRotina: jest.fn(), pular: jest.fn(),`.

`use-cases/pular-tarefa.use-case.ts`:
```ts
import { proximaDataRotina } from '../../agenda/dominio/rotina';
import { RotinaRepository } from '../rotina.types';

/** "Pular esta vez": cancela a pendente (pulada) e agenda a próxima a partir de hoje. */
export class PularTarefaUseCase {
  constructor(private repo: Pick<RotinaRepository, 'findPendenteComRotina' | 'pular'>) {}

  async execute(agendaId: string, usuarioId: string) {
    const pendente = await this.repo.findPendenteComRotina(agendaId, usuarioId);
    if (!pendente) throw new Error('Acesso negado ou agendamento não encontrado.');
    const { rotina } = pendente;
    if (!rotina) throw new Error('Só tarefas de rotina podem ser puladas.');

    const data = rotina.pausada ? null : proximaDataRotina(rotina, new Date());
    await this.repo.pular(
      agendaId,
      data ? { rotinaId: rotina.id, plantaId: rotina.plantaId, atividadeId: rotina.atividadeId, dataAgendada: data } : null,
    );
  }
}
```
Em `use-cases/index.ts`: `export { PularTarefaUseCase } from './pular-tarefa.use-case';`

- [ ] **Step 3: Rodar** — `cd server && npm test -- rotina` → PASS.

- [ ] **Step 4: Repositório** — em `prisma-rotina.repository.ts` importar `ProximaDeRotina` de `../../agenda/dominio/rotina` e adicionar:
```ts
  async findPendenteComRotina(agendaId: string, usuarioId: string) {
    return prisma.agenda.findFirst({
      where: { id: agendaId, status: 'PENDENTE', planta: { usuarioId } },
      select: {
        id: true,
        rotina: { select: { id: true, plantaId: true, atividadeId: true, intervaloDias: true, dataFim: true, pausada: true } },
      },
    });
  }

  async pular(agendaId: string, proxima: ProximaDeRotina | null) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Revalida PENDENTE: dois toques em "pular" não geram duas próximas
      const { count } = await tx.agenda.updateMany({
        where: { id: agendaId, status: 'PENDENTE' },
        data: { status: 'CANCELADO', pulada: true },
      });
      if (count === 0) throw new Error('Acesso negado ou agendamento não encontrado.');
      if (proxima) await tx.agenda.create({ data: proxima });
    });
  }
```

- [ ] **Step 5: Controller e rota**

Em `rotina.controller.ts`: importar `PularTarefaUseCase` de `./use-cases` e `agendaIdSchema` de `../agenda/agenda.schema`; instanciar `const pular = new PularTarefaUseCase(repo);` e adicionar ao objeto `rotinaController`:
```ts
  pular: async (req: Request, res: Response) => {
    try {
      const { params } = agendaIdSchema.parse({ params: req.params });
      await pular.execute(params.id, req.user!.userId);
      res.status(204).send();
    } catch (error) {
      responderErroRotina(res, error, 'pular tarefa');
    }
  },
```
Em `agenda.router.ts`: `import { rotinaController } from '../rotina/rotina.controller';` e, depois da linha do `/registrar`, `agendaRouter.post('/:id/pular', rotinaController.pular);`.

- [ ] **Step 6: Rotina nas agendas** — em `prisma-agenda.repository.ts`, nos `include` de `findManyByUser` e `findByIdAndUser`, adicionar:
```ts
        rotina: { select: { id: true, intervaloDias: true, pausada: true } },
```

- [ ] **Step 7: Rodar** — `cd server && npm test && npm run build && docker restart bonsai_api` → PASS, build limpo, API no ar.

- [ ] **Step 8: Commit**
```bash
git add server/src/modules/rotina server/src/modules/agenda/agenda.router.ts server/src/modules/agenda/repositories/prisma-agenda.repository.ts
git commit -m "feat(api): pular esta vez e rotina nas agendas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Base do frontend + "Repetir" nos próximos passos

**Files:**
- Create: `web/src/components/care/RepetirCampo.tsx`
- Modify: `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/lib/cuidados.ts`, `web/src/components/care/ProximosPassos.tsx`, `web/src/pages/ConcluirPage.tsx`, `web/src/pages/RegistrarPage.tsx`

**Interfaces:**
- Consumes: API das Tasks 4–6.
- Produces:
  - `Rotina` (types), `Agenda.rotinaId`, `Agenda.rotina`, `Agenda.pulada`.
  - `rotinasApi.{list, create, update, remove, pausar, retomar}`, `agendasApi.pular(id)`, `ProximoInput`, `Repetir`.
  - `keys.rotinas`, `useRotinas()` (todas as rotinas do usuário).
  - `medianaIntervaloDias(agendas, plantaId, atividadeId): number | null`, `textoIntervalo(dias): string`.
  - `RepetirValor`, `RepetirCampo`, `repetirParaApi`, `repetirValido`; `Proximo.repetir?`, `proximosParaApi`.

- [ ] **Step 1: Tipos** (`web/src/types.ts`) — antes de `export interface Agenda`, adicionar:
```ts
export interface Rotina {
  id: string;
  intervaloDias: number;
  pausada: boolean;
  dataFim?: string | null;
  plantaId: string;
  atividadeId: string;
  atividade?: Pick<Atividade, 'id' | 'nome'>;
  planta?: Pick<Planta, 'id' | 'nome' | 'identificador'>;
  /** Pendente atual da rotina (null = pausada, encerrada ou sem próxima). */
  proxima?: { id: string; dataAgendada: string } | null;
}
```
e em `Agenda`, depois de `atividadeId: string;`:
```ts
  rotinaId?: string | null;
  rotina?: Pick<Rotina, 'id' | 'intervaloDias' | 'pausada'> | null;
  pulada?: boolean;
```

- [ ] **Step 2: Endpoints** (`web/src/lib/endpoints.ts`)
- adicionar `Rotina` ao import de tipos;
- antes de `ConcluirInput`:
```ts
export interface Repetir {
  intervaloDias: number;
  dataFim?: string;
}

export interface ProximoInput {
  atividadeId: string;
  dataAgendada: string;
  /** Com repetição, vira (ou usa) a rotina da planta+atividade. */
  repetir?: Repetir;
}
```
- em `ConcluirInput` e `RegistrarInput`: `proximos?: ProximoInput[];`
- em `agendasApi`: `/** "Pular esta vez" (só tarefa de rotina): a próxima conta a partir de hoje. */ pular: (id: string) => api.post(\`/agendas/${id}/pular\`),`
- depois de `agendasApi`:
```ts
export const rotinasApi = {
  list: () => data<Rotina[]>(api.get('/rotinas')),
  /** Uma rotina por planta+atividade; as que já existiam voltam em `conflitos` (mantidas). */
  create: (body: {
    plantaIds: string[];
    atividadeIds: string[];
    intervaloDias: number;
    dataFim?: string;
    primeiraData?: string;
    detalhes?: string;
  }) => data<{ criadas: Rotina[]; conflitos: { plantaId: string; atividadeId: string }[] }>(api.post('/rotinas', body)),
  update: (id: string, body: { intervaloDias?: number; dataFim?: string | null }) =>
    data<Rotina>(api.put(`/rotinas/${id}`, body)),
  remove: (id: string) => api.delete(`/rotinas/${id}`),
  pausar: (id: string) => data<Rotina>(api.post(`/rotinas/${id}/pausar`)),
  /** Retoma a rotina; sem pendente, agenda a próxima a partir de hoje. */
  retomar: (id: string) => data<Rotina>(api.post(`/rotinas/${id}/retomar`)),
};
```

- [ ] **Step 3: Queries** (`web/src/lib/queries.ts`) — importar `rotinasApi`; em `keys` adicionar `rotinas: ['rotinas'] as const,`; e:
```ts
/** Todas as rotinas do usuário (um cache só; filtre por planta no componente). */
export const useRotinas = () => useQuery({ queryKey: keys.rotinas, queryFn: rotinasApi.list });
```

- [ ] **Step 4: Helpers** (`web/src/lib/cuidados.ts`) — adicionar:
```ts
/** Mediana (em dias) dos intervalos entre execuções do cuidado na planta; null com menos de 2 execuções. */
export function medianaIntervaloDias(agendas: Agenda[], plantaId: string, atividadeId: string): number | null {
  const datas = agendas
    .filter((a) => a.status === 'CONCLUIDO' && a.plantaId === plantaId && a.atividadeId === atividadeId)
    .map((a) => new Date(a.dataConcluida ?? a.dataAgendada).getTime())
    .sort((x, y) => x - y);
  const intervalos = datas
    .slice(1)
    .map((d, i) => Math.round((d - datas[i]) / 86_400_000))
    .filter((d) => d > 0)
    .sort((x, y) => x - y);
  if (!intervalos.length) return null;
  const meio = Math.floor(intervalos.length / 2);
  return intervalos.length % 2 ? intervalos[meio] : Math.round((intervalos[meio - 1] + intervalos[meio]) / 2);
}

/** "todo dia", "a cada 14 dias". */
export const textoIntervalo = (dias: number) => (dias === 1 ? 'todo dia' : `a cada ${dias} dias`);
```

- [ ] **Step 5: `RepetirCampo`** — `web/src/components/care/RepetirCampo.tsx`:
```tsx
import { Repeat } from 'lucide-react';
import { fromDateInput, toDateInput } from '@/lib/format';

export interface RepetirValor {
  intervaloDias: number;
  /** AAAA-MM-DD ou '' (sem fim) */
  dataFim: string;
}

export const repetirValido = (v: RepetirValor | null | undefined) =>
  !v || (Number.isInteger(v.intervaloDias) && v.intervaloDias >= 1 && v.intervaloDias <= 3650);

export const repetirParaApi = (v: RepetirValor) => ({
  intervaloDias: v.intervaloDias,
  ...(v.dataFim ? { dataFim: fromDateInput(v.dataFim) } : {}),
});

/** Uma vez / Repetir a cada N dias (até uma data opcional), com sugestão vinda do histórico. */
export function RepetirCampo({
  value,
  onChange,
  sugestao,
}: {
  value: RepetirValor | null;
  onChange: (v: RepetirValor | null) => void;
  sugestao?: number | null;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <button type="button" className={`chip ${!value ? 'chip-active' : ''}`} aria-pressed={!value} onClick={() => onChange(null)}>
          Uma vez
        </button>
        <button
          type="button"
          className={`chip ${value ? 'chip-active' : ''}`}
          aria-pressed={!!value}
          onClick={() => onChange(value ?? { intervaloDias: sugestao ?? 14, dataFim: '' })}
        >
          <Repeat size={14} /> Repetir
        </button>
      </div>
      {value && (
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            a cada
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              className="input w-20"
              value={value.intervaloDias || ''}
              onChange={(e) => onChange({ ...value, intervaloDias: Number(e.target.value) })}
            />
            dias
          </label>
          {!!sugestao && sugestao !== value.intervaloDias && (
            <button type="button" className="text-xs font-medium text-primary" onClick={() => onChange({ ...value, intervaloDias: sugestao })}>
              Você costuma fazer a cada ~{sugestao} dias — usar
            </button>
          )}
          <label className="flex items-center gap-2 text-sm">
            até (opcional)
            <input
              type="date"
              className="input w-auto"
              value={value.dataFim}
              min={toDateInput()}
              onChange={(e) => onChange({ ...value, dataFim: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: `ProximosPassos`**
- imports: `import { daquiADias, fromDateInput, toDateInput } from '@/lib/format';` e `import { RepetirCampo, repetirParaApi, type RepetirValor } from './RepetirCampo';`
- `Proximo` ganha `repetir?: RepetirValor | null;`
- depois de `ATALHOS`, adicionar:
```ts
/** Próximos passos no formato da API (undefined quando vazio). */
export const proximosParaApi = (proximos: Proximo[]) =>
  proximos.length
    ? proximos.map((p) => ({
        atividadeId: p.atividadeId,
        dataAgendada: fromDateInput(p.data),
        ...(p.repetir ? { repetir: repetirParaApi(p.repetir) } : {}),
      }))
    : undefined;
```
- dentro do card de cada item, depois do `<div className="flex flex-wrap items-center gap-2">…</div>` das datas, adicionar:
```tsx
            <RepetirCampo
              value={p.repetir ?? null}
              onChange={(repetir) => onChange(value.map((x, j) => (j === i ? { ...x, repetir } : x)))}
            />
```

- [ ] **Step 7: Páginas que enviam próximos passos**

`ConcluirPage.tsx`:
- import: `import { ProximosPassos, proximosParaApi, type Proximo } from '@/components/care/ProximosPassos';` e `import { repetirValido } from '@/components/care/RepetirCampo';`
- validação: `if (proximos.some((p) => !p.atividadeId || !p.data)) return toast('Complete os próximos passos.', 'error');` → `if (proximos.some((p) => !p.atividadeId || !p.data || !repetirValido(p.repetir))) return toast('Complete os próximos passos.', 'error');`
- no `agendasApi.concluir({...})`, trocar o bloco `proximos: proximos.length ? proximos.map(...) : undefined,` por `proximos: proximosParaApi(proximos),`
- depois de `queryClient.invalidateQueries({ queryKey: keys.agendas });` adicionar `queryClient.invalidateQueries({ queryKey: keys.rotinas });`

`RegistrarPage.tsx`:
- mesmos imports (`proximosParaApi`, `repetirValido`);
- em `validar()`, trocar `proximos.some((p) => !p.atividadeId || !p.data)` por `proximos.some((p) => !p.atividadeId || !p.data || !repetirValido(p.repetir))`;
- no `agendasApi.registrar({...})`, trocar o bloco `proximos: proximos.length ? ... : undefined,` por `proximos: proximosParaApi(proximos),`;
- depois de `queryClient.invalidateQueries({ queryKey: keys.agendas });` (no sucesso) adicionar `queryClient.invalidateQueries({ queryKey: keys.rotinas });`.

- [ ] **Step 8: Build + lint** — `cd web && npm run build && npm run lint` → sem erros; sem warnings novos.

- [ ] **Step 9: Commit**
```bash
git add web/src/types.ts web/src/lib web/src/components/care/RepetirCampo.tsx web/src/components/care/ProximosPassos.tsx web/src/pages/ConcluirPage.tsx web/src/pages/RegistrarPage.tsx
git commit -m "feat(web): base de rotinas e repetir nos próximos passos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Agendar com "Repetir" + ↻ nos cards

**Files:**
- Modify: `web/src/components/care/ScheduleCareSheet.tsx`, `web/src/components/TaskCard.tsx`, `web/src/components/BenchTaskCard.tsx`

**Interfaces:**
- Consumes: `RepetirCampo`, `repetirParaApi`, `repetirValido`, `RepetirValor` (Task 7); `rotinasApi.create`, `useRotinas`, `keys.rotinas`, `medianaIntervaloDias`, `textoIntervalo` (Task 7).

- [ ] **Step 1: `ScheduleCareSheet`**
- imports: `import { RepetirCampo, repetirParaApi, repetirValido, type RepetirValor } from './RepetirCampo';`; `rotinasApi` junto de `agendasApi`; `useRotinas` junto de `useAgendas`; `medianaIntervaloDias, textoIntervalo` junto de `rotuloUltima, ultimasPorPlanta`.
- estado/derivados, depois de `const dica = ...`:
```tsx
  const rotinas = useRotinas();
  const [repetir, setRepetir] = useState<RepetirValor | null>(null);
  const sugestao =
    plantaIds.length === 1 && atividadeIds.length === 1
      ? medianaIntervaloDias(agendas.data ?? [], plantaIds[0], atividadeIds[0])
      : null;
  const jaTem = (rotinas.data ?? []).filter((r) => plantaIds.includes(r.plantaId) && atividadeIds.includes(r.atividadeId));
```
- em `submit`, substituir o bloco `if (agenda) { ... } else { await agendasApi.createLote(...) }` e as linhas de `invalidateQueries`/`toast` seguintes por:
```tsx
      let mensagem: string;
      if (agenda) {
        await agendasApi.update(agenda.id, { dataAgendada: fromDateInput(data) });
        mensagem = 'Tarefa reagendada';
      } else if (repetir) {
        if (!repetirValido(repetir)) {
          setSalvando(false);
          return toast('Informe o intervalo em dias (1 a 3650).', 'error');
        }
        const r = await rotinasApi.create({
          plantaIds,
          atividadeIds,
          ...repetirParaApi(repetir),
          primeiraData: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        const n = r.criadas.length;
        const k = r.conflitos.length;
        mensagem = [
          n ? (n === 1 ? 'Rotina criada' : `${n} rotinas criadas`) : '',
          k ? (k === 1 ? '1 rotina já existia e foi mantida' : `${k} rotinas já existiam e foram mantidas`) : '',
        ]
          .filter(Boolean)
          .join(' · ');
      } else {
        await agendasApi.createLote({
          plantaIds,
          atividadeIds,
          dataAgendada: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        mensagem = total > 1 ? `${total} cuidados agendados` : 'Cuidado agendado';
      }
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast(mensagem);
      onClose();
```
- JSX (modo criação), logo depois de `<AtividadeChips ... />`:
```tsx
            <RepetirCampo value={repetir} onChange={setRepetir} sugestao={sugestao} />
            {repetir && jaTem.length > 0 && (
              <p className="text-xs text-danger">
                {jaTem.length === 1
                  ? `Já existe rotina de ${jaTem[0].atividade?.nome ?? 'cuidado'} (${textoIntervalo(jaTem[0].intervaloDias)}) — ela será mantida.`
                  : `${jaTem.length} rotinas já existem e serão mantidas.`}
              </p>
            )}
```
- o `<Field label="Data">` passa a `<Field label={repetir && !agenda ? 'Primeira vez' : 'Data'}>`;
- o texto do botão: `{agenda ? 'Salvar nova data' : repetir ? (total > 1 ? \`Criar ${total} rotinas\` : 'Criar rotina') : total > 1 ? \`Agendar ${total} cuidados\` : 'Agendar'}`.

- [ ] **Step 2: ↻ nos cards**

`TaskCard.tsx`: importar `Repeat` de `lucide-react` e `textoIntervalo` de `@/lib/cuidados`; trocar `<p className="truncate font-semibold">{agenda.atividade?.nome ?? 'Cuidado'}</p>` por:
```tsx
          <p className="flex items-center gap-1 truncate font-semibold">
            <span className="truncate">{agenda.atividade?.nome ?? 'Cuidado'}</span>
            {agenda.rotina && (
              <Repeat size={14} className="shrink-0 text-muted" aria-label={textoIntervalo(agenda.rotina.intervaloDias)} />
            )}
          </p>
```
`BenchTaskCard.tsx`: mesmos imports; dentro do `<p>` da data, depois de `{dataRelativa(agenda.dataAgendada)}`, adicionar:
```tsx
            {agenda.rotina && (
              <>
                {' · '}
                <Repeat size={11} className="inline align-[-1px]" /> {textoIntervalo(agenda.rotina.intervaloDias)}
              </>
            )}
```

- [ ] **Step 3: Build + lint** — `cd web && npm run build && npm run lint` → sem erros/warnings novos.

- [ ] **Step 4: Commit**
```bash
git add web/src/components/care/ScheduleCareSheet.tsx web/src/components/TaskCard.tsx web/src/components/BenchTaskCard.tsx
git commit -m "feat(web): agendar com repetição e ícone de rotina nos cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Gerenciar rotina — `RotinaSheet`, TarefaPage e seção Rotinas

**Files:**
- Create: `web/src/components/care/RotinaSheet.tsx`
- Modify: `web/src/pages/TarefaPage.tsx`, `web/src/pages/PlantDetailPage.tsx`

**Interfaces:**
- Consumes: `useRotinas`, `keys.rotinas`, `rotinasApi`, `agendasApi.pular`, `textoIntervalo` (Task 7); `Sheet`, `ConfirmSheet` (`@/components/Sheet`); `Button`, `Field` (`@/components/ui`).
- Produces: `RotinaSheet({ rotinaId, onClose })`.

- [ ] **Step 1: `RotinaSheet`** — `web/src/components/care/RotinaSheet.tsx`:
```tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Pause, Play, Trash2 } from 'lucide-react';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { textoIntervalo } from '@/lib/cuidados';
import { rotinasApi } from '@/lib/endpoints';
import { dataRelativa, fromDateInput, toDateInput } from '@/lib/format';
import { keys, useRotinas } from '@/lib/queries';
import type { Rotina } from '@/types';

/** Editar, pausar/retomar, agendar a próxima ou apagar uma rotina. */
export function RotinaSheet({ rotinaId, onClose }: { rotinaId: string | null; onClose: () => void }) {
  const rotinas = useRotinas();
  const rotina = rotinas.data?.find((r) => r.id === rotinaId);
  return (
    <>{rotina && <RotinaForm key={rotina.id} rotina={rotina} onClose={onClose} />}</>
  );
}

function RotinaForm({ rotina, onClose }: { rotina: Rotina; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [intervalo, setIntervalo] = useState(String(rotina.intervaloDias));
  const [dataFim, setDataFim] = useState(rotina.dataFim ? toDateInput(rotina.dataFim) : '');
  const [salvando, setSalvando] = useState<'salvar' | 'pausa' | 'proxima' | 'apagar' | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  async function executar(tipo: NonNullable<typeof salvando>, fn: () => Promise<unknown>, mensagem: string) {
    setSalvando(tipo);
    try {
      await fn();
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast(mensagem);
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(null);
    }
  }

  function salvar() {
    const dias = Number(intervalo);
    if (!Number.isInteger(dias) || dias < 1 || dias > 3650) return toast('Informe o intervalo em dias (1 a 3650).', 'error');
    executar(
      'salvar',
      () => rotinasApi.update(rotina.id, { intervaloDias: dias, dataFim: dataFim ? fromDateInput(dataFim) : null }),
      'Rotina atualizada',
    );
  }

  const status = rotina.pausada
    ? 'Pausada'
    : rotina.proxima
      ? `Próxima: ${dataRelativa(rotina.proxima.dataAgendada)}`
      : 'Sem próxima tarefa';

  return (
    <>
      <Sheet open={!confirmar} onClose={onClose} title={`Rotina · ${rotina.atividade?.nome ?? 'Cuidado'}`}>
        <div className="space-y-5 pb-safe">
          <p className="text-sm text-muted">
            {rotina.planta?.identificador || rotina.planta?.nome || 'Planta'} · {textoIntervalo(rotina.intervaloDias)} · {status}
          </p>
          <Field label="A cada quantos dias">
            <input type="number" inputMode="numeric" min={1} max={3650} className="input w-28" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} />
          </Field>
          <Field label="Até (opcional)">
            <input type="date" className="input w-auto" value={dataFim} min={toDateInput()} onChange={(e) => setDataFim(e.target.value)} />
          </Field>
          <Button block onClick={salvar} loading={salvando === 'salvar'}>
            Salvar
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {rotina.pausada ? (
              <Button variant="secondary" size="sm" loading={salvando === 'pausa'} onClick={() => executar('pausa', () => rotinasApi.retomar(rotina.id), 'Rotina retomada')}>
                <Play size={16} /> Retomar
              </Button>
            ) : (
              <Button variant="secondary" size="sm" loading={salvando === 'pausa'} onClick={() => executar('pausa', () => rotinasApi.pausar(rotina.id), 'Rotina pausada')}>
                <Pause size={16} /> Pausar
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setConfirmar(true)}>
              <Trash2 size={16} /> Apagar
            </Button>
          </div>
          {!rotina.pausada && !rotina.proxima && (
            <Button block variant="secondary" size="sm" loading={salvando === 'proxima'} onClick={() => executar('proxima', () => rotinasApi.retomar(rotina.id), 'Próxima agendada')}>
              <CalendarPlus size={16} /> Agendar próxima
            </Button>
          )}
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={() => executar('apagar', () => rotinasApi.remove(rotina.id), 'Rotina apagada')}
        loading={salvando === 'apagar'}
        title="Apagar rotina?"
        text="A próxima tarefa é cancelada. O histórico continua."
        confirmLabel="Apagar"
      />
    </>
  );
}
```

- [ ] **Step 2: `TarefaPage`**
- imports: `Repeat, SkipForward, Settings2` (lucide) junto aos ícones; `RotinaSheet` de `@/components/care/RotinaSheet`; `textoIntervalo` de `@/lib/cuidados`;
- estado: `salvando` passa a `useState<'cancelar' | 'excluir' | 'pular' | null>(null)`; adicionar `const [rotinaAberta, setRotinaAberta] = useState<string | null>(null);`
- função, depois de `acao`:
```tsx
  async function pular() {
    if (!agenda) return;
    setSalvando('pular');
    try {
      await agendasApi.pular(agenda.id);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast('Pulada · próxima agendada');
      if (window.history.state?.idx > 0) navigate(-1);
      else navigate('/', { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(null);
    }
  }
```
- logo depois do `<p>` de status (`{rotuloStatus} · ...`), adicionar:
```tsx
        {agenda.rotina && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Repeat size={14} /> Rotina {textoIntervalo(agenda.rotina.intervaloDias)}
            {agenda.rotina.pausada && ' · pausada'}
          </p>
        )}
        {agenda.pulada && <p className="mt-1 text-sm text-muted">Pulada</p>}
```
- dentro do bloco `{pendente && (...)}`, depois da `grid grid-cols-3` de Reagendar/Cancelar/Excluir, adicionar:
```tsx
            {agenda.rotinaId && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={pular} loading={salvando === 'pular'}>
                  <SkipForward size={16} /> Pular esta vez
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setRotinaAberta(agenda.rotinaId!)}>
                  <Settings2 size={16} /> Editar rotina
                </Button>
              </div>
            )}
```
- antes do `<ConfirmSheet` existente: `<RotinaSheet rotinaId={rotinaAberta} onClose={() => setRotinaAberta(null)} />`
- importar `keys` já existe; garantir `keys.rotinas` disponível (Task 7).

- [ ] **Step 3: Seção Rotinas no `PlantDetailPage`**
- imports: `Repeat` (lucide); `RotinaSheet`; `textoIntervalo` junto de `rotuloUltima, ultimasPorPlanta`; `useRotinas` junto de `useAgendas, useFotos, usePlanta`;
- hooks, junto aos demais (antes dos `return` antecipados):
```tsx
  const rotinas = useRotinas();
  const [rotinaAberta, setRotinaAberta] = useState<string | null>(null);
  const daPlantaRotinas = useMemo(() => (rotinas.data ?? []).filter((r) => r.plantaId === id), [rotinas.data, id]);
```
- logo depois da seção "Últimos cuidados" (`{ultimos.length > 0 && (...)}`), adicionar:
```tsx
        <Secao titulo="Rotinas">
          {daPlantaRotinas.length > 0 && (
            <div className="card mb-2 divide-y divide-line">
              {daPlantaRotinas.map((r) => (
                <button key={r.id} onClick={() => setRotinaAberta(r.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium">
                    <Repeat size={14} className="shrink-0 text-primary" />
                    <span className="truncate">{r.atividade?.nome ?? 'Cuidado'}</span>
                  </span>
                  <span className="shrink-0 text-muted">
                    {textoIntervalo(r.intervaloDias)} ·{' '}
                    {r.pausada ? 'pausada' : r.proxima ? dataRelativa(r.proxima.dataAgendada).toLowerCase() : 'sem próxima'}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => agendarCuidado(p.id)} className="text-sm font-semibold text-primary">
            + Nova rotina
          </button>
        </Secao>
```
- antes do `<Sheet open={acoes} ...>`: `<RotinaSheet rotinaId={rotinaAberta} onClose={() => setRotinaAberta(null)} />`

- [ ] **Step 4: Build + lint** — `cd web && npm run build && npm run lint` → sem erros/warnings novos.

- [ ] **Step 5: Commit**
```bash
git add web/src/components/care/RotinaSheet.tsx web/src/pages/TarefaPage.tsx web/src/pages/PlantDetailPage.tsx
git commit -m "feat(web): gerenciar rotinas na tarefa e na página da planta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Verificação no navegador + docs

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-05-tarefas-inteligentes-design.md`

- [ ] **Step 1:** `docker restart bonsai_api`; Vite em `localhost:5173` (conta local `teste.web@bonsai.test`, iframe 390px — memória `local-browser-testing`).
- [ ] **Step 2: Cenários** (criar dados via API com `localStorage.bonsai_token`, anotar ids):
  1. Agendar → planta de teste → Adubação → Repetir a cada 14 dias, primeira vez amanhã → toast "Rotina criada"; card com ↻; seção Rotinas da planta mostra "a cada 14 dias · amanhã".
  2. Concluir essa tarefa → nova pendente em hoje + 14 dias com ↻; sem Revisão geral criada para a planta.
  3. Na nova pendente: Pular esta vez → some; nova pendente em hoje + 14.
  4. Editar rotina → 7 dias → pendente move para hoje + 7 (última conclusão = hoje).
  5. Pausar → pendente some, seção mostra "pausada"; Retomar → pendente em hoje + 7.
  6. Registrar Adubação na planta com a tarefa da rotina marcada → próxima gerada a partir da data do registro.
  7. Concluir com próximo passo Rega + Repetir 3 dias → rotina de Rega criada.
  8. Agendar Repetir de novo para Adubação na mesma planta → aviso "Já existe rotina…" e toast "1 rotina já existia e foi mantida".
  9. Apagar rotina → pendente cancelada; histórico mantém as concluídas.
- [ ] **Step 3:** Apagar plantas de teste (cascata) e conferir que não sobrou nada.
- [ ] **Step 4: Docs** — `CLAUDE.md`: no parágrafo de estrutura do web, acrescentar `` `src/components/care/RotinaSheet.tsx` + `RepetirCampo.tsx` (rotinas rolantes: `/api/rotinas`, `POST /api/agendas/:id/pular`; regras em `server/src/modules/agenda/dominio/rotina.ts`) ``; na seção Commands do backend, a nota `# após mudar server/: docker restart bonsai_api (sem hot reload no Windows)`. No spec, abaixo da nota da fase 1: `> **Fase 2 (implementada):** \`POST /rotinas\` aceita \`atividadeIds[]\` (uma rotina por planta+atividade); sugestão de intervalo (mediana) calculada no cliente; Repetir em próximo passo com rotina já existente e pendente cria a tarefa avulsa.`
- [ ] **Step 5: Commit**
```bash
git add CLAUDE.md docs/superpowers/specs/2026-10-05-tarefas-inteligentes-design.md
git commit -m "docs: fase 2 das tarefas inteligentes (rotinas)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
