# Página do cuidado feito — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A página `/tarefas/:id` de um cuidado feito mostra o card do dia (título, data, notas, fotos), desliza entre os cuidados da planta e permite editar (data, textos, tirar tarefa) e excluir, reavaliando o grupo Recém transplantada em todos os caminhos que gravam tarefas.

**Architecture:** Backend ganha o campo `Planta.transplanteAgendaId`, uma regra pura `reavaliarRecemTransplantada` e um serviço `ReavaliarGruposUseCase` injetado em todos os use cases de agenda que escrevem; dois endpoints novos (`PUT /agendas/cuidado`, `POST /agendas/cuidado/excluir`) fazem a edição/exclusão do card numa transação. No web, regras puras em `src/lib/cuidadoDoDia.ts` e componentes em `src/components/cuidado/`.

**Tech Stack:** Express + Prisma + Zod + Jest (server), React 19 + TanStack Query + Tailwind v4 + Vitest (web).

**Spec:** `docs/superpowers/specs/2026-10-12-detalhe-do-cuidado-design.md`

## Global Constraints

- Idioma de código, comentários, UI e mensagens: **português**.
- Backend: Clean Architecture — regra de negócio só em use cases/domínio; repositórios por interface (mockáveis); testes AAA com mocks (`server/src/test/setup.ts` mocka o `@prisma/client`, então importe `Prisma` só como **tipo**).
- Erros Zod nos controllers: `res.status(400).json({ error: mensagemDoErro(error) })`.
- Trabalhar direto na `main`; **não dar push** sem o usuário pedir (push = deploy).
- Após mudar `server/`, `docker restart bonsai_api` antes de testar no navegador (o entrypoint roda `prisma migrate deploy`).
- Web: datas de input `AAAA-MM-DD` via `toDateInput`/`fromDateInput` (`src/lib/format.ts`); toasts via `useToast`; gavetas via `Sheet`/`ConfirmSheet` (`src/components/Sheet.tsx`).
- A reavaliação **nunca coloca** uma planta em Recém transplantada; só corrige/desfaz.
- Fotos de tarefas apagadas ficam na galeria (`Foto.agendaId` `onDelete: SetNull`); editar a data não muda a data das fotos; não reagendar a próxima de rotinas.

## Review Focus

- Excluir/editar um cuidado cuja planta está em Recém transplantada por **outro** Transplante (não o do card) → o grupo não muda. Teste em Task 1 (regra) e Task 6 (use case passa só a planta; a regra decide).
- Mudar a data do Transplante para um dia em que o prazo já venceu → a planta volta ao grupo anterior na hora. Teste em Task 1.
- `PUT /agendas/cuidado` com `agendaIds` de plantas diferentes ou com tarefa pendente → 400, nada gravado. Teste em Task 6.
- Tirar a tarefa cujo id está na URL → a página troca para outra tarefa do card em vez de mostrar "não encontrada". Coberto em Task 9 (navegação após salvar) e verificação no navegador (Task 10).
- Textos diferentes por tarefa + tirar uma tarefa → só as que ficam recebem `textos`; nunca envia texto de tarefa removida (o servidor recusaria). Teste em Task 7 (`textosAlterados` recebe só as que ficam) e Task 6 (validação).

---

## File Structure

**Server**
- Modify `server/prisma/schema.prisma` — `Planta.transplanteAgendaId String?`.
- Create `server/prisma/migrations/20261012120000_transplante_agenda_id/migration.sql` — coluna + backfill.
- Modify `server/src/modules/planta/dominio/grupo.ts` (+ `grupo.test.ts`) — `EstadoRecem`, `reavaliarRecemTransplantada`.
- Create `server/src/modules/planta/use-cases/reavaliar-grupos.ts` (+ `.test.ts`) — `ReavaliarGruposUseCase`, `ReavaliacaoRepository`, `ReavaliadorDeGrupos`, `Db`.
- Create `server/src/modules/planta/repositories/prisma-reavaliacao.repository.ts`.
- Modify `server/src/modules/planta/repositories/prisma-planta.repository.ts`, `types/planta.types.ts`, `use-cases/update-planta.use-case.ts` (+ test) — campo no select/update; troca manual e vencimento limpam o campo.
- Modify `server/src/modules/agenda/agenda.types.ts` — `AtualizacaoGrupo.transplanteAtividadeId`, `CuidadoRepository`, DTOs.
- Modify `server/src/modules/agenda/use-cases/planejar-grupos-transplante.ts`, `registrar-cuidados.use-case.ts`, `concluir-agendas.use-case.ts`, `update-agenda.use-case.ts`, `delete-agenda.use-case.ts` (+ tests).
- Modify `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts` — grava `transplanteAgendaId`.
- Create `server/src/modules/agenda/use-cases/cuidado-do-dia.ts`, `editar-cuidado.use-case.ts`, `excluir-cuidado.use-case.ts` (+ tests); `repositories/prisma-cuidado.repository.ts`.
- Modify `agenda.schema.ts` (+ test), `agenda.controller.ts`, `agenda.router.ts`, `use-cases/index.ts`.

**Web**
- Modify `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/components/ui.tsx` (`PageHeader.titleTo`).
- Create `web/src/lib/cuidadoDoDia.ts` (+ `.test.ts`).
- Create `web/src/components/cuidado/PainelCuidado.tsx`, `CuidadosDaPlanta.tsx`, `CuidadoFeito.tsx`, `EditarCuidado.tsx`, `TarefaCancelada.tsx`.
- Modify `web/src/pages/TarefaPage.tsx`; delete `web/src/components/CarrosselDoDia.tsx`, `web/src/components/HistoricoPlanta.tsx`.
- Modify `CLAUDE.md`, `docs/todo.md`.

---

### Task 1: Regra pura `reavaliarRecemTransplantada`

**Files:**
- Modify: `server/src/modules/planta/dominio/grupo.ts`
- Test: `server/src/modules/planta/dominio/grupo.test.ts`

**Interfaces:**
- Produces: `interface EstadoRecem extends EstadoGrupo { transplanteAgendaId: string | null }`;
  `reavaliarRecemTransplantada(estado: EstadoRecem, transplante: { data: Date } | null, dias: number, agora: Date): EstadoRecem | null` (null = nada muda).

- [ ] **Step 1: Write the failing tests** — append to `grupo.test.ts` (add `reavaliarRecemTransplantada` and `type EstadoRecem` to the import list at the top):

```ts
describe('reavaliarRecemTransplantada', () => {
  const AGORA = new Date('2026-10-12T12:00:00.000Z');
  const recem = (extra: Partial<EstadoRecem> = {}): EstadoRecem => ({
    grupo: 'RECEM_TRANSPLANTADA',
    grupoAnterior: 'EM_CRESCIMENTO',
    grupoExpiraEm: new Date('2026-10-20T12:00:00.000Z'),
    transplanteAgendaId: 'ag-t',
    ...extra,
  });
  const voltou = { grupo: 'EM_CRESCIMENTO', grupoAnterior: null, grupoExpiraEm: null, transplanteAgendaId: null };

  it('fora de Recém transplantada não muda', () => {
    expect(reavaliarRecemTransplantada(recem({ grupo: 'REFINAMENTO' }), null, 15, AGORA)).toBeNull();
  });

  it('sem o Transplante de origem guardado não muda', () => {
    expect(reavaliarRecemTransplantada(recem({ transplanteAgendaId: null }), null, 15, AGORA)).toBeNull();
  });

  it('Transplante apagado: volta ao grupo anterior', () => {
    expect(reavaliarRecemTransplantada(recem(), null, 15, AGORA)).toEqual(voltou);
  });

  it('sem grupo anterior: fica sem grupo', () => {
    expect(reavaliarRecemTransplantada(recem({ grupoAnterior: null }), null, 15, AGORA)).toEqual({ ...voltou, grupo: null });
  });

  it('data do Transplante mudou: recalcula o fim do prazo', () => {
    const data = new Date('2026-10-08T12:00:00.000Z');
    expect(reavaliarRecemTransplantada(recem(), { data }, 15, AGORA)).toEqual(
      recem({ grupoExpiraEm: new Date(data.getTime() + 15 * DIA) }),
    );
  });

  it('nova data já com o prazo vencido: volta ao grupo anterior', () => {
    expect(reavaliarRecemTransplantada(recem(), { data: new Date('2026-09-01T12:00:00.000Z') }, 15, AGORA)).toEqual(voltou);
  });

  it('mesmo prazo: não muda', () => {
    const data = new Date('2026-10-05T12:00:00.000Z');
    expect(reavaliarRecemTransplantada(recem(), { data }, 15, AGORA)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && npm test -- grupo.test`
Expected: FAIL — `reavaliarRecemTransplantada is not a function` / import error.

- [ ] **Step 3: Implement** — in `grupo.ts`, after `trocaManual`:

```ts
/** Estado do grupo + o Transplante concluído que pôs a planta em Recém transplantada. */
export interface EstadoRecem extends EstadoGrupo {
  transplanteAgendaId: string | null;
}

const voltarAoAnterior = (e: EstadoRecem): EstadoRecem => ({
  grupo: e.grupoAnterior,
  grupoAnterior: null,
  grupoExpiraEm: null,
  transplanteAgendaId: null,
});

/**
 * Recém transplantada depois que o Transplante que a colocou lá mudou. `transplante` null = apagado ou não
 * está mais concluído. Devolve o estado novo, ou null se nada muda. Nunca coloca uma planta no grupo.
 */
export function reavaliarRecemTransplantada(
  estado: EstadoRecem,
  transplante: { data: Date } | null,
  dias: number,
  agora: Date,
): EstadoRecem | null {
  if (estado.grupo !== RECEM_TRANSPLANTADA || !estado.transplanteAgendaId) return null;
  if (!transplante) return voltarAoAnterior(estado);
  const expira = new Date(transplante.data.getTime() + dias * DIA_MS);
  if (expira <= agora) return voltarAoAnterior(estado);
  if (estado.grupoExpiraEm?.getTime() === expira.getTime()) return null;
  return { ...estado, grupoExpiraEm: expira };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd server && npm test -- grupo.test`
Expected: PASS (all, including the existing ones).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/planta/dominio/grupo.ts server/src/modules/planta/dominio/grupo.test.ts
git commit -m "feat(server): regra de reavaliação da Recém transplantada"
```

---

### Task 2: Campo `transplanteAgendaId` (migration, leitura, troca manual, vencimento)

**Files:**
- Modify: `server/prisma/schema.prisma` (model `Planta`, após `preTransplanteAgendaId`)
- Create: `server/prisma/migrations/20261012120000_transplante_agenda_id/migration.sql`
- Modify: `server/src/modules/planta/repositories/prisma-planta.repository.ts` (`SELECT_PLANTA`, `update`, `resolverGruposVencidos`)
- Modify: `server/src/modules/planta/types/planta.types.ts` (`UpdatePlantaDTO`, `PlantaWithEspecie`)
- Modify: `server/src/modules/planta/use-cases/update-planta.use-case.ts`
- Test: `server/src/modules/planta/use-cases/update-planta.use-case.test.ts`

**Interfaces:**
- Produces: coluna `Planta.transplanteAgendaId` (nullable, sem FK, como `preTransplanteAgendaId`); `GET /plantas` e `/plantas/:id` devolvem o campo; `UpdatePlantaDTO.transplanteAgendaId?: string | null`.

- [ ] **Step 1: Write the failing test** — in `update-planta.use-case.test.ts`, test "troca manual de grupo cancela o retorno automático" (line ~37): change the expectation to

```ts
        expect.objectContaining({ grupo: 'EM_CRESCIMENTO', grupoAnterior: null, grupoExpiraEm: null, transplanteAgendaId: null }),
```

and in "sem o campo grupo, não mexe no grupo" add:

```ts
      expect(dados).not.toHaveProperty('transplanteAgendaId');
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && npm test -- update-planta`
Expected: FAIL on the first test (`transplanteAgendaId` missing).

- [ ] **Step 3: Implement**

`schema.prisma`, in `model Planta` after `preTransplanteAgendaId String?`:

```prisma
  /// Transplante concluído que colocou a planta em RECEM_TRANSPLANTADA (para desfazer se ele mudar ou sumir).
  transplanteAgendaId    String?
```

`migration.sql`:

```sql
-- Transplante que colocou a planta em Recém transplantada
ALTER TABLE "Planta" ADD COLUMN "transplanteAgendaId" TEXT;

-- Plantas já em Recém transplantada: o Transplante concluído mais recente delas
UPDATE "Planta" p
SET "transplanteAgendaId" = (
  SELECT a."id"
  FROM "Agenda" a
  JOIN "Atividade" t ON t."id" = a."atividadeId"
  WHERE a."plantaId" = p."id" AND t."nome" = 'Transplante' AND a."status" = 'CONCLUIDO'
  ORDER BY COALESCE(a."dataConcluida", a."dataAgendada") DESC
  LIMIT 1
)
WHERE p."grupo" = 'RECEM_TRANSPLANTADA' AND p."grupoExpiraEm" IS NOT NULL;
```

`planta.types.ts`: add `transplanteAgendaId?: string | null;` to `UpdatePlantaDTO` (after `grupoExpiraEm`) and to `PlantaWithEspecie` (after `preTransplanteAgendaId`).

`prisma-planta.repository.ts`:
- `SELECT_PLANTA`: add `transplanteAgendaId: true,` after `preTransplanteAgendaId: true,`.
- `update(...)` data: add `transplanteAgendaId: data.transplanteAgendaId,` after `grupoExpiraEm: data.grupoExpiraEm,`.
- `resolverGruposVencidos` SQL: `SET "grupo" = "grupoAnterior", "grupoAnterior" = NULL, "grupoExpiraEm" = NULL, "transplanteAgendaId" = NULL, "updatedAt" = NOW()`.

`update-planta.use-case.ts`: replace the grupo line with

```ts
      // Grupo escolhido à mão cancela o retorno automático do transplante
      ...(grupo !== undefined ? { ...trocaManual(grupo), transplanteAgendaId: null } : {}),
```

Then regenerate the client: `cd server && npx prisma generate`.

- [ ] **Step 4: Run to verify it passes**

Run: `cd server && npm test -- planta && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, no type errors.

- [ ] **Step 5: Apply migration locally and commit**

```bash
docker restart bonsai_api   # entrypoint roda prisma migrate deploy
docker logs bonsai_api --tail 20   # conferir "Migrations applied"
git add server/prisma server/src/modules/planta
git commit -m "feat(server): Planta.transplanteAgendaId (Transplante que pôs em Recém transplantada)"
```

---

### Task 3: Serviço `ReavaliarGruposUseCase`

**Files:**
- Create: `server/src/modules/planta/use-cases/reavaliar-grupos.ts`
- Create: `server/src/modules/planta/repositories/prisma-reavaliacao.repository.ts`
- Test: `server/src/modules/planta/use-cases/reavaliar-grupos.test.ts`

**Interfaces:**
- Consumes: `reavaliarRecemTransplantada`, `EstadoRecem` (Task 1); coluna `transplanteAgendaId` (Task 2).
- Produces:
  ```ts
  export type Db = Prisma.TransactionClient;
  export interface PlantaReavaliavel extends EstadoRecem { plantaId: string; transplante: { data: Date } | null }
  export interface ReavaliacaoRepository {
    estado(plantaIds: string[], usuarioId: string, db?: Db): Promise<{ dias: number; plantas: PlantaReavaliavel[] }>;
    salvar(mudancas: ({ plantaId: string } & EstadoRecem)[], db?: Db): Promise<void>;
  }
  export interface ReavaliadorDeGrupos { execute(plantaIds: string[], usuarioId: string, db?: Db): Promise<void> }
  export class ReavaliarGruposUseCase implements ReavaliadorDeGrupos
  export class PrismaReavaliacaoRepository implements ReavaliacaoRepository
  ```

- [ ] **Step 1: Write the failing test** — `reavaliar-grupos.test.ts`:

```ts
import { ReavaliarGruposUseCase, ReavaliacaoRepository, PlantaReavaliavel } from './reavaliar-grupos';

const AGORA = new Date('2026-10-12T12:00:00.000Z');
const DIA = 86_400_000;

describe('ReavaliarGruposUseCase', () => {
  let repo: jest.Mocked<ReavaliacaoRepository>;
  let useCase: ReavaliarGruposUseCase;
  const planta = (extra: Partial<PlantaReavaliavel> = {}): PlantaReavaliavel => ({
    plantaId: 'p1',
    grupo: 'RECEM_TRANSPLANTADA',
    grupoAnterior: 'REFINAMENTO',
    grupoExpiraEm: new Date('2026-10-20T12:00:00.000Z'),
    transplanteAgendaId: 'ag-t',
    transplante: null,
    ...extra,
  });

  beforeEach(() => {
    repo = { estado: jest.fn(), salvar: jest.fn() };
    useCase = new ReavaliarGruposUseCase(repo, () => AGORA);
  });

  it('sem plantas não consulta nada', async () => {
    await useCase.execute([], 'u1');
    expect(repo.estado).not.toHaveBeenCalled();
  });

  it('grava só as plantas que mudam, repassando o cliente da transação', async () => {
    const db = {} as never;
    const data = new Date('2026-10-05T12:00:00.000Z');
    repo.estado.mockResolvedValue({
      dias: 15,
      plantas: [planta(), planta({ plantaId: 'p2', transplante: { data }, grupoExpiraEm: new Date(data.getTime() + 15 * DIA) })],
    });

    await useCase.execute(['p1', 'p2', 'p1'], 'u1', db);

    expect(repo.estado).toHaveBeenCalledWith(['p1', 'p2'], 'u1', db);
    expect(repo.salvar).toHaveBeenCalledWith(
      [{ plantaId: 'p1', grupo: 'REFINAMENTO', grupoAnterior: null, grupoExpiraEm: null, transplanteAgendaId: null }],
      db,
    );
  });

  it('nada mudou: não grava', async () => {
    repo.estado.mockResolvedValue({ dias: 15, plantas: [planta({ grupo: 'REFINAMENTO' })] });
    await useCase.execute(['p1'], 'u1');
    expect(repo.salvar).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && npm test -- reavaliar-grupos`
Expected: FAIL — cannot find module `./reavaliar-grupos`.

- [ ] **Step 3: Implement**

`reavaliar-grupos.ts`:

```ts
import type { Prisma } from '@prisma/client';
import { EstadoRecem, reavaliarRecemTransplantada } from '../dominio/grupo';

/** Cliente do Prisma ou da transação em curso. */
export type Db = Prisma.TransactionClient;

export interface PlantaReavaliavel extends EstadoRecem {
  plantaId: string;
  /** O Transplante de `transplanteAgendaId`, se ainda existe e está concluído. */
  transplante: { data: Date } | null;
}

export interface ReavaliacaoRepository {
  /** Plantas (do usuário, dentre as informadas) em Recém transplantada com Transplante de origem, e os dias da preferência. */
  estado(plantaIds: string[], usuarioId: string, db?: Db): Promise<{ dias: number; plantas: PlantaReavaliavel[] }>;
  salvar(mudancas: ({ plantaId: string } & EstadoRecem)[], db?: Db): Promise<void>;
}

/** Quem grava tarefas chama no fim, com as plantas afetadas. */
export interface ReavaliadorDeGrupos {
  execute(plantaIds: string[], usuarioId: string, db?: Db): Promise<void>;
}

/** Corrige/desfaz Recém transplantada quando o Transplante que a colocou lá mudou ou sumiu. */
export class ReavaliarGruposUseCase implements ReavaliadorDeGrupos {
  constructor(
    private repo: ReavaliacaoRepository,
    private agora: () => Date = () => new Date(),
  ) {}

  async execute(plantaIds: string[], usuarioId: string, db?: Db): Promise<void> {
    const ids = [...new Set(plantaIds)];
    if (!ids.length) return;
    const { dias, plantas } = await this.repo.estado(ids, usuarioId, db);
    const agora = this.agora();
    const mudancas = plantas.flatMap(({ plantaId, transplante, ...estado }) => {
      const novo = reavaliarRecemTransplantada(estado, transplante, dias, agora);
      return novo ? [{ plantaId, ...novo }] : [];
    });
    if (mudancas.length) await this.repo.salvar(mudancas, db);
  }
}
```

`prisma-reavaliacao.repository.ts`:

```ts
import { prisma } from '../../../lib/prisma';
import { PREF_TRANSPLANTE_DIAS } from '../../agenda/agenda.types';
import { diasDeTransplante, EstadoRecem, RECEM_TRANSPLANTADA } from '../dominio/grupo';
import { Db, ReavaliacaoRepository } from '../use-cases/reavaliar-grupos';

export class PrismaReavaliacaoRepository implements ReavaliacaoRepository {
  async estado(plantaIds: string[], usuarioId: string, db: Db = prisma) {
    const pref = await db.preferenciaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave: PREF_TRANSPLANTE_DIAS } },
    });
    const plantas = await db.planta.findMany({
      where: { id: { in: plantaIds }, usuarioId, grupo: RECEM_TRANSPLANTADA, transplanteAgendaId: { not: null } },
      select: { id: true, grupo: true, grupoAnterior: true, grupoExpiraEm: true, transplanteAgendaId: true },
    });
    const transplantes = plantas.length
      ? await db.agenda.findMany({
          where: { id: { in: plantas.map((p) => p.transplanteAgendaId!) }, status: 'CONCLUIDO' },
          select: { id: true, dataConcluida: true, dataAgendada: true },
        })
      : [];
    const dataDe = new Map(transplantes.map((t) => [t.id, t.dataConcluida ?? t.dataAgendada]));
    return {
      dias: diasDeTransplante(pref?.valor),
      plantas: plantas.map(({ id, ...estado }) => {
        const data = dataDe.get(estado.transplanteAgendaId!);
        return { plantaId: id, ...estado, transplante: data ? { data } : null };
      }),
    };
  }

  async salvar(mudancas: ({ plantaId: string } & EstadoRecem)[], db: Db = prisma) {
    for (const { plantaId, ...estado } of mudancas) {
      await db.planta.update({ where: { id: plantaId }, data: estado });
    }
  }
}
```

(Queries em sequência, não `Promise.all`, para funcionar dentro de transação interativa.)

- [ ] **Step 4: Run to verify it passes**

Run: `cd server && npm test -- reavaliar-grupos && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/planta/use-cases/reavaliar-grupos.ts server/src/modules/planta/use-cases/reavaliar-grupos.test.ts server/src/modules/planta/repositories/prisma-reavaliacao.repository.ts
git commit -m "feat(server): serviço central de reavaliação do grupo da planta"
```

---

### Task 4: Registrar e concluir gravam o Transplante de origem e reavaliam

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts` (`AtualizacaoGrupo`)
- Modify: `server/src/modules/agenda/use-cases/planejar-grupos-transplante.ts`
- Modify: `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts` (`atualizarGrupos` e as 2 chamadas)
- Modify: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.ts`, `concluir-agendas.use-case.ts`
- Modify: `server/src/modules/agenda/agenda.controller.ts` (construção)
- Test: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.test.ts`, `concluir-agendas.use-case.test.ts`

**Interfaces:**
- Consumes: `ReavaliadorDeGrupos` (Task 3).
- Produces: `AtualizacaoGrupo = { plantaId: string; transplanteAtividadeId?: string } & EstadoGrupo`; construtores `new RegistrarCuidadosUseCase(repo, reavaliar)` e `new ConcluirAgendasUseCase(repo, reavaliar)`.

- [ ] **Step 1: Write the failing tests**

In both test files, in `beforeEach`, create the mock and pass it:

```ts
    reavaliar = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new RegistrarCuidadosUseCase(repo, reavaliar);   // e ConcluirAgendasUseCase(repo, reavaliar)
```

(declare `let reavaliar: { execute: jest.Mock };` beside `repo`).

Update the existing grupo expectations: in `registrar-cuidados.use-case.test.ts` (~line 203) add `transplanteAtividadeId: 'at-transplante'` to the expected object (use the Transplante atividade id the test's `transplanteDasPlantas` mock returns); in `concluir-agendas.use-case.test.ts` add the same key to `esperado`.

Add one test to each file:

```ts
  it('reavalia o grupo das plantas tocadas depois de gravar', async () => {
    await useCase.execute(dto(undefined), 'user-1');               // registrar; no concluir use `base`
    expect(reavaliar.execute).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');   // concluir: ['pl-1']
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd server && npm test -- registrar-cuidados concluir-agendas`
Expected: FAIL (constructor arity is fine in JS but `reavaliar.execute` not called; `transplanteAtividadeId` missing).

- [ ] **Step 3: Implement**

`agenda.types.ts`:

```ts
/** Mudança de grupo; `transplanteAtividadeId` = a planta foi por um Transplante (o repositório acha a tarefa e guarda o id). */
export type AtualizacaoGrupo = { plantaId: string; transplanteAtividadeId?: string } & EstadoGrupo;
```

`planejar-grupos-transplante.ts`, last line of the function:

```ts
    .map((p) => ({ plantaId: p.plantaId, ...aplicarTransplante(p, data, dias), transplanteAtividadeId: atividadeId }));
```

(`transplanteDasPlantas` devolve `plantas` como `AtualizacaoGrupo[]` sem o campo — `aplicarTransplante(p, …)` só lê `grupo/grupoAnterior/grupoExpiraEm`.)

`prisma-conclusao.repository.ts`, replace `atualizarGrupos`:

```ts
  /** Aplica mudanças de grupo (Transplante → Recém transplantada) e guarda qual tarefa de Transplante foi. */
  private async atualizarGrupos(tx: Prisma.TransactionClient, itens: AtualizacaoGrupo[], data: Date) {
    for (const g of itens) {
      const transplante = g.transplanteAtividadeId
        ? await tx.agenda.findFirst({
            where: { plantaId: g.plantaId, atividadeId: g.transplanteAtividadeId, status: 'CONCLUIDO', dataConcluida: data },
            select: { id: true },
          })
        : null;
      await tx.planta.update({
        where: { id: g.plantaId },
        data: {
          grupo: g.grupo,
          grupoAnterior: g.grupoAnterior,
          grupoExpiraEm: g.grupoExpiraEm,
          transplanteAgendaId: transplante?.id ?? null,
        },
      });
    }
  }
```

and the calls: in `registrar` → `await this.atualizarGrupos(tx, plano.atualizarGrupos, plano.data);`, in `executar` → `await this.atualizarGrupos(tx, plano.atualizarGrupos, plano.dataConcluida);`.

`registrar-cuidados.use-case.ts`:

```ts
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';
// ...
  constructor(
    private repo: ConclusaoRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}
// ...no fim de execute:
    const resultado = await this.repo.registrar({ ...mesmo objeto de hoje... });
    await this.reavaliar.execute(plantas, usuarioId);
    return resultado;
```

`concluir-agendas.use-case.ts`: same constructor change; end of `execute`:

```ts
    const resultado = await this.repo.executar(plano);
    await this.reavaliar.execute(plantas, usuarioId);
    return resultado;
```

(`plantas` já existe no use case: as plantas das pendentes.)

`agenda.controller.ts` constructor:

```ts
import { ReavaliarGruposUseCase } from '../planta/use-cases/reavaliar-grupos';
import { PrismaReavaliacaoRepository } from '../planta/repositories/prisma-reavaliacao.repository';
// ...
    const reavaliar = new ReavaliarGruposUseCase(new PrismaReavaliacaoRepository());
    // ...
    this.concluirAgendasUseCase = new ConcluirAgendasUseCase(conclusaoRepository, reavaliar);
    this.registrarCuidadosUseCase = new RegistrarCuidadosUseCase(conclusaoRepository, reavaliar);
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd server && npm test -- agenda && npx tsc --noEmit -p tsconfig.json`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/agenda
git commit -m "feat(server): registrar e concluir guardam o Transplante de origem e reavaliam o grupo"
```

---

### Task 5: `PUT`/`DELETE /agendas/:id` reavaliam o grupo

**Files:**
- Modify: `server/src/modules/agenda/use-cases/update-agenda.use-case.ts`, `delete-agenda.use-case.ts`
- Modify: `server/src/modules/agenda/agenda.controller.ts`
- Test: `server/src/modules/agenda/use-cases/update-agenda.use-case.test.ts`, `delete-agenda.use-case.test.ts`

**Interfaces:**
- Consumes: `ReavaliadorDeGrupos` (Task 3).
- Produces: `new UpdateAgendaUseCase(repo, reavaliar)`, `new DeleteAgendaUseCase(repo, reavaliar)`; ambos usam `findByIdAndUser` (precisam do `plantaId`).

- [ ] **Step 1: Write the failing tests**

`delete-agenda.use-case.test.ts`: in `beforeEach` add `reavaliar = { execute: jest.fn().mockResolvedValue(undefined) };` and `new DeleteAgendaUseCase(mockAgendaRepository, reavaliar)`. Replace the two existing tests' `existsByIdAndUser` mocks/asserts with `findByIdAndUser`:

```ts
  it('apaga e reavalia o grupo da planta', async () => {
    mockAgendaRepository.findByIdAndUser.mockResolvedValue({ id: 'agenda-1', plantaId: 'planta-1' });

    await deleteAgendaUseCase.execute('agenda-1', 'user-1');

    expect(mockAgendaRepository.delete).toHaveBeenCalledWith('agenda-1');
    expect(reavaliar.execute).toHaveBeenCalledWith(['planta-1'], 'user-1');
  });

  it('tarefa de outro usuário: erro e nada apagado', async () => {
    mockAgendaRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(deleteAgendaUseCase.execute('agenda-1', 'user-1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(mockAgendaRepository.delete).not.toHaveBeenCalled();
    expect(reavaliar.execute).not.toHaveBeenCalled();
  });
```

`update-agenda.use-case.test.ts`: same mock/constructor change; every test that mocked `existsByIdAndUser.mockResolvedValue(true)` now mocks `findByIdAndUser.mockResolvedValue({ id: <id>, plantaId: 'planta-1' })` (and `false` → `null`); add:

```ts
  it('reavalia o grupo da planta depois de atualizar', async () => {
    mockAgendaRepository.findByIdAndUser.mockResolvedValue({ id: 'agenda-1', plantaId: 'planta-1' });
    mockAgendaRepository.update.mockResolvedValue({ id: 'agenda-1' });

    await updateAgendaUseCase.execute('agenda-1', { detalhes: 'x' }, 'user-1');

    expect(reavaliar.execute).toHaveBeenCalledWith(['planta-1'], 'user-1');
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd server && npm test -- update-agenda delete-agenda`
Expected: FAIL.

- [ ] **Step 3: Implement**

`delete-agenda.use-case.ts`:

```ts
import { AgendaRepository } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';

export class DeleteAgendaUseCase {
  constructor(
    private agendaRepository: AgendaRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    const agenda = await this.agendaRepository.findByIdAndUser(id, usuarioId);
    if (!agenda) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    await this.agendaRepository.delete(id);
    // Apagar o Transplante que pôs a planta em Recém transplantada a tira de lá
    await this.reavaliar.execute([agenda.plantaId], usuarioId);
  }
}
```

`update-agenda.use-case.ts`:

```ts
import { UpdateAgendaDTO, AgendaRepository } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';

export class UpdateAgendaUseCase {
  constructor(
    private agendaRepository: AgendaRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(id: string, data: UpdateAgendaDTO, usuarioId: string) {
    const agenda = await this.agendaRepository.findByIdAndUser(id, usuarioId);
    if (!agenda) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    // Se há recursos utilizados, usa o método com transação
    const atualizada =
      data.recursosUtilizados && data.recursosUtilizados.length > 0
        ? await this.agendaRepository.updateWithResources(id, data)
        : await this.agendaRepository.update(id, (({ recursosUtilizados, ...resto }) => resto)(data));

    await this.reavaliar.execute([agenda.plantaId], usuarioId);
    return atualizada;
  }
}
```

`agenda.controller.ts`: move the `reavaliar` creation (Task 4) to the top of the constructor and pass it: `new UpdateAgendaUseCase(agendaRepository, reavaliar)`, `new DeleteAgendaUseCase(agendaRepository, reavaliar)`.

- [ ] **Step 4: Run to verify they pass**

Run: `cd server && npm test -- agenda && npx tsc --noEmit -p tsconfig.json`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/agenda
git commit -m "feat(server): editar e apagar tarefa reavaliam o grupo da planta"
```

---

### Task 6: Endpoints `PUT /agendas/cuidado` e `POST /agendas/cuidado/excluir`

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts` (DTOs + `CuidadoRepository`)
- Create: `server/src/modules/agenda/use-cases/cuidado-do-dia.ts`, `editar-cuidado.use-case.ts`, `excluir-cuidado.use-case.ts`
- Create: `server/src/modules/agenda/repositories/prisma-cuidado.repository.ts`
- Modify: `server/src/modules/agenda/use-cases/index.ts`, `agenda.schema.ts`, `agenda.controller.ts`, `agenda.router.ts`
- Test: `server/src/modules/agenda/use-cases/editar-cuidado.use-case.test.ts`, `excluir-cuidado.use-case.test.ts`, `server/src/modules/agenda/agenda.schema.test.ts`

**Interfaces:**
- Consumes: `ReavaliadorDeGrupos`, `Db` (Task 3).
- Produces:
  ```ts
  export interface TextoDoCuidado { agendaId: string; detalhes?: string | null; observacaoFutura?: string | null }
  export interface EditarCuidadoDTO { agendaIds: string[]; dataConcluida?: string; textos?: TextoDoCuidado[]; removerAgendaIds?: string[] }
  export interface PlanoEdicaoCuidado { manter: string[]; remover: string[]; dataConcluida?: Date; textos: TextoDoCuidado[] }
  export interface CuidadoRepository {
    findDoUsuario(ids: string[], usuarioId: string): Promise<{ id: string; plantaId: string; status: AgendaStatus }[]>;
    editar(plano: PlanoEdicaoCuidado, depois: (db: Db) => Promise<void>): Promise<any[]>;
    excluir(ids: string[], depois: (db: Db) => Promise<void>): Promise<void>;
  }
  ```
  HTTP: `PUT /api/agendas/cuidado` body `EditarCuidadoDTO` → 200 com as tarefas que ficaram; `POST /api/agendas/cuidado/excluir` body `{ agendaIds }` → 204. Erros: 404 `'Acesso negado ou agendamento não encontrado.'`; 400 para as demais mensagens.

- [ ] **Step 1: Write the failing tests**

`editar-cuidado.use-case.test.ts`:

```ts
import { EditarCuidadoUseCase } from './editar-cuidado.use-case';
import { CuidadoRepository } from '../agenda.types';

describe('EditarCuidadoUseCase', () => {
  let repo: jest.Mocked<CuidadoRepository>;
  let reavaliar: { execute: jest.Mock };
  let useCase: EditarCuidadoUseCase;
  const concluida = (id: string, plantaId = 'p1') => ({ id, plantaId, status: 'CONCLUIDO' as const });

  beforeEach(() => {
    repo = {
      findDoUsuario: jest.fn().mockResolvedValue([concluida('a1'), concluida('a2')]),
      editar: jest.fn(async (_plano, depois) => {
        await depois('tx' as never);
        return [];
      }),
      excluir: jest.fn(),
    };
    reavaliar = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new EditarCuidadoUseCase(repo, reavaliar);
  });

  it('monta o plano e reavalia a planta dentro da transação', async () => {
    await useCase.execute(
      {
        agendaIds: ['a1', 'a2'],
        dataConcluida: '2026-10-05T15:00:00.000Z',
        textos: [{ agendaId: 'a1', detalhes: 'nova' }],
        removerAgendaIds: ['a2'],
      },
      'u1',
    );

    expect(repo.findDoUsuario).toHaveBeenCalledWith(['a1', 'a2'], 'u1');
    expect(repo.editar).toHaveBeenCalledWith(
      {
        manter: ['a1'],
        remover: ['a2'],
        dataConcluida: new Date('2026-10-05T15:00:00.000Z'),
        textos: [{ agendaId: 'a1', detalhes: 'nova' }],
      },
      expect.any(Function),
    );
    expect(reavaliar.execute).toHaveBeenCalledWith(['p1'], 'u1', 'tx');
  });

  it('tarefa que não é do usuário: 404 e nada gravado', async () => {
    repo.findDoUsuario.mockResolvedValue([concluida('a1')]);
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(repo.editar).not.toHaveBeenCalled();
  });

  it('tarefa pendente no meio: recusa', async () => {
    repo.findDoUsuario.mockResolvedValue([concluida('a1'), { id: 'a2', plantaId: 'p1', status: 'PENDENTE' }]);
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow('O cuidado precisa estar concluído.');
  });

  it('plantas diferentes: recusa', async () => {
    repo.findDoUsuario.mockResolvedValue([concluida('a1'), concluida('a2', 'p2')]);
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow('As tarefas precisam ser da mesma planta.');
  });

  it('tirar todas: recusa (use excluir)', async () => {
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'], removerAgendaIds: ['a1', 'a2'] }, 'u1')).rejects.toThrow(
      'Para tirar todas as tarefas, exclua o cuidado.',
    );
  });

  it('remover ou texto de tarefa fora do card: recusa', async () => {
    await expect(useCase.execute({ agendaIds: ['a1', 'a2'], removerAgendaIds: ['a9'] }, 'u1')).rejects.toThrow(
      'Tarefa fora do cuidado.',
    );
    await expect(
      useCase.execute({ agendaIds: ['a1', 'a2'], removerAgendaIds: ['a2'], textos: [{ agendaId: 'a2', detalhes: 'x' }] }, 'u1'),
    ).rejects.toThrow('Tarefa fora do cuidado.');
  });

  it('data no futuro: recusa', async () => {
    const amanha = new Date(Date.now() + 3 * 86_400_000).toISOString();
    await expect(useCase.execute({ agendaIds: ['a1'], dataConcluida: amanha }, 'u1')).rejects.toThrow('A data não pode ser no futuro.');
  });
});
```

`excluir-cuidado.use-case.test.ts`:

```ts
import { ExcluirCuidadoUseCase } from './excluir-cuidado.use-case';
import { CuidadoRepository } from '../agenda.types';

describe('ExcluirCuidadoUseCase', () => {
  let repo: jest.Mocked<CuidadoRepository>;
  let reavaliar: { execute: jest.Mock };
  let useCase: ExcluirCuidadoUseCase;

  beforeEach(() => {
    repo = {
      findDoUsuario: jest.fn().mockResolvedValue([
        { id: 'a1', plantaId: 'p1', status: 'CONCLUIDO' },
        { id: 'a2', plantaId: 'p1', status: 'CONCLUIDO' },
      ]),
      editar: jest.fn(),
      excluir: jest.fn(async (_ids, depois) => depois('tx' as never)),
    };
    reavaliar = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new ExcluirCuidadoUseCase(repo, reavaliar);
  });

  it('apaga as tarefas e reavalia a planta na transação', async () => {
    await useCase.execute(['a1', 'a2', 'a1'], 'u1');
    expect(repo.excluir).toHaveBeenCalledWith(['a1', 'a2'], expect.any(Function));
    expect(reavaliar.execute).toHaveBeenCalledWith(['p1'], 'u1', 'tx');
  });

  it('tarefa de outro usuário: nada apagado', async () => {
    repo.findDoUsuario.mockResolvedValue([{ id: 'a1', plantaId: 'p1', status: 'CONCLUIDO' }]);
    await expect(useCase.execute(['a1', 'a2'], 'u1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(repo.excluir).not.toHaveBeenCalled();
  });
});
```

Append to `agenda.schema.test.ts` (import `editarCuidadoSchema, excluirCuidadoSchema` from `./agenda.schema`):

```ts
describe('editarCuidadoSchema / excluirCuidadoSchema', () => {
  const id = '11111111-1111-4111-8111-111111111111';

  it('aceita textos nulos (apagar o texto)', () => {
    const r = editarCuidadoSchema.safeParse({ body: { agendaIds: [id], textos: [{ agendaId: id, detalhes: null }] } });
    expect(r.success).toBe(true);
  });

  it('exige ao menos uma tarefa', () => {
    expect(editarCuidadoSchema.safeParse({ body: { agendaIds: [] } }).success).toBe(false);
    expect(excluirCuidadoSchema.safeParse({ body: { agendaIds: [] } }).success).toBe(false);
  });

  it('recusa id inválido', () => {
    expect(excluirCuidadoSchema.safeParse({ body: { agendaIds: ['x'] } }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd server && npm test -- cuidado agenda.schema`
Expected: FAIL — modules/exports missing.

- [ ] **Step 3: Implement**

`agenda.types.ts` (append; add `import type { Db } from '../planta/use-cases/reavaliar-grupos';` at the top):

```ts
export interface TextoDoCuidado {
  agendaId: string;
  /** null apaga o texto. */
  detalhes?: string | null;
  observacaoFutura?: string | null;
}

export interface EditarCuidadoDTO {
  agendaIds: string[];
  dataConcluida?: string;
  textos?: TextoDoCuidado[];
  removerAgendaIds?: string[];
}

export interface PlanoEdicaoCuidado {
  manter: string[];
  remover: string[];
  dataConcluida?: Date;
  textos: TextoDoCuidado[];
}

/** Cuidado do dia (tarefas concluídas da planta num dia) editado/excluído de uma vez. */
export interface CuidadoRepository {
  /** Tarefas do usuário dentre os ids (qualquer status). */
  findDoUsuario(ids: string[], usuarioId: string): Promise<{ id: string; plantaId: string; status: AgendaStatus }[]>;
  /** Aplica o plano numa transação; `depois` roda dentro dela (reavaliação do grupo). Devolve as tarefas que ficaram. */
  editar(plano: PlanoEdicaoCuidado, depois: (db: Db) => Promise<void>): Promise<any[]>;
  excluir(ids: string[], depois: (db: Db) => Promise<void>): Promise<void>;
}
```

`use-cases/cuidado-do-dia.ts`:

```ts
import { CuidadoRepository } from '../agenda.types';

/** Valida que as tarefas são do usuário, concluídas e da mesma planta; devolve a planta. */
export async function plantaDoCuidado(repo: CuidadoRepository, ids: string[], usuarioId: string): Promise<string> {
  const agendas = await repo.findDoUsuario(ids, usuarioId);
  if (agendas.length !== ids.length) throw new Error('Acesso negado ou agendamento não encontrado.');
  if (agendas.some((a) => a.status !== 'CONCLUIDO')) throw new Error('O cuidado precisa estar concluído.');
  if (new Set(agendas.map((a) => a.plantaId)).size !== 1) throw new Error('As tarefas precisam ser da mesma planta.');
  return agendas[0].plantaId;
}
```

`use-cases/editar-cuidado.use-case.ts`:

```ts
import { CuidadoRepository, EditarCuidadoDTO } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';
import { plantaDoCuidado } from './cuidado-do-dia';

/** Folga para o fuso do aparelho (mesma do registrar). */
const FOLGA_FUTURO_MS = 86_400_000;

/** Edita o cuidado do dia: data, textos e tarefas tiradas, numa transação; reavalia o grupo da planta. */
export class EditarCuidadoUseCase {
  constructor(
    private repo: CuidadoRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(dto: EditarCuidadoDTO, usuarioId: string) {
    const ids = [...new Set(dto.agendaIds)];
    const remover = [...new Set(dto.removerAgendaIds ?? [])];
    const textos = dto.textos ?? [];
    if (remover.some((id) => !ids.includes(id))) throw new Error('Tarefa fora do cuidado.');
    if (textos.some((t) => !ids.includes(t.agendaId) || remover.includes(t.agendaId))) throw new Error('Tarefa fora do cuidado.');
    if (remover.length >= ids.length) throw new Error('Para tirar todas as tarefas, exclua o cuidado.');
    if (dto.dataConcluida && new Date(dto.dataConcluida).getTime() > Date.now() + FOLGA_FUTURO_MS) {
      throw new Error('A data não pode ser no futuro.');
    }

    const plantaId = await plantaDoCuidado(this.repo, ids, usuarioId);
    return this.repo.editar(
      {
        manter: ids.filter((id) => !remover.includes(id)),
        remover,
        dataConcluida: dto.dataConcluida ? new Date(dto.dataConcluida) : undefined,
        textos,
      },
      (db) => this.reavaliar.execute([plantaId], usuarioId, db),
    );
  }
}
```

Note: the test "monta o plano" expects the plan object **without** an `undefined` key problem — `toHaveBeenCalledWith` treats `dataConcluida: undefined` as equal to a missing key, so this shape is fine.

`use-cases/excluir-cuidado.use-case.ts`:

```ts
import { CuidadoRepository } from '../agenda.types';
import { ReavaliadorDeGrupos } from '../../planta/use-cases/reavaliar-grupos';
import { plantaDoCuidado } from './cuidado-do-dia';

/** Apaga o cuidado do dia (as tarefas; fotos ficam na galeria) e reavalia o grupo da planta. */
export class ExcluirCuidadoUseCase {
  constructor(
    private repo: CuidadoRepository,
    private reavaliar: ReavaliadorDeGrupos,
  ) {}

  async execute(agendaIds: string[], usuarioId: string): Promise<void> {
    const ids = [...new Set(agendaIds)];
    const plantaId = await plantaDoCuidado(this.repo, ids, usuarioId);
    await this.repo.excluir(ids, (db) => this.reavaliar.execute([plantaId], usuarioId, db));
  }
}
```

`use-cases/index.ts`: add `export * from './editar-cuidado.use-case';` and `export * from './excluir-cuidado.use-case';` (follow the file's existing export style).

`repositories/prisma-cuidado.repository.ts`:

```ts
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { CuidadoRepository, PlanoEdicaoCuidado } from '../agenda.types';
import { Db } from '../../planta/use-cases/reavaliar-grupos';

export class PrismaCuidadoRepository implements CuidadoRepository {
  async findDoUsuario(ids: string[], usuarioId: string) {
    return prisma.agenda.findMany({
      where: { id: { in: ids }, planta: { usuarioId } },
      select: { id: true, plantaId: true, status: true },
    });
  }

  async editar(plano: PlanoEdicaoCuidado, depois: (db: Db) => Promise<void>) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (plano.dataConcluida) {
        await tx.agenda.updateMany({ where: { id: { in: plano.manter } }, data: { dataConcluida: plano.dataConcluida } });
      }
      for (const t of plano.textos) {
        await tx.agenda.update({
          where: { id: t.agendaId },
          data: {
            ...(t.detalhes !== undefined ? { detalhes: t.detalhes } : {}),
            ...(t.observacaoFutura !== undefined ? { observacaoFutura: t.observacaoFutura } : {}),
          },
        });
      }
      // Fotos das tarefas tiradas ficam na galeria (agendaId → null pelo banco)
      if (plano.remover.length) await tx.agenda.deleteMany({ where: { id: { in: plano.remover } } });
      await depois(tx);
      return tx.agenda.findMany({ where: { id: { in: plano.manter } } });
    });
  }

  async excluir(ids: string[], depois: (db: Db) => Promise<void>) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.agenda.deleteMany({ where: { id: { in: ids } } });
      await depois(tx);
    });
  }
}
```

`agenda.schema.ts` (append):

```ts
const idTarefa = z.string().uuid({ message: 'ID da tarefa inválido.' });
const listaDeTarefas = z.array(idTarefa).min(1, { message: 'Informe as tarefas do cuidado.' }).max(50);
const textoDoCuidado = z.string().max(2000, { message: 'Texto muito longo.' }).nullable().optional();

// Cuidado do dia: editar (data, textos, tirar tarefas) e excluir
export const editarCuidadoSchema = z.object({
  body: z.object({
    agendaIds: listaDeTarefas,
    dataConcluida: z.string().datetime({ message: 'Data inválida.' }).optional(),
    textos: z.array(z.object({ agendaId: idTarefa, detalhes: textoDoCuidado, observacaoFutura: textoDoCuidado })).optional(),
    removerAgendaIds: z.array(idTarefa).optional(),
  }),
});

export const excluirCuidadoSchema = z.object({
  body: z.object({ agendaIds: listaDeTarefas }),
});
```

`agenda.controller.ts`: import the schemas, `EditarCuidadoUseCase`, `ExcluirCuidadoUseCase`, `PrismaCuidadoRepository`, `EditarCuidadoDTO`; fields + construction:

```ts
  private editarCuidadoUseCase: EditarCuidadoUseCase;
  private excluirCuidadoUseCase: ExcluirCuidadoUseCase;
  // no constructor:
    const cuidadoRepository = new PrismaCuidadoRepository();
    this.editarCuidadoUseCase = new EditarCuidadoUseCase(cuidadoRepository, reavaliar);
    this.excluirCuidadoUseCase = new ExcluirCuidadoUseCase(cuidadoRepository, reavaliar);
```

Handlers (add after `delete`):

```ts
  /** Mensagens dos use cases de cuidado que viram 400 (as de acesso viram 404). */
  private static readonly ERROS_CUIDADO = [
    'O cuidado precisa estar concluído.',
    'As tarefas precisam ser da mesma planta.',
    'Para tirar todas as tarefas, exclua o cuidado.',
    'Tarefa fora do cuidado.',
    'A data não pode ser no futuro.',
  ];

  private erroDoCuidado(res: Response, error: unknown, acao: string) {
    if (error instanceof ZodError) return res.status(400).json({ error: mensagemDoErro(error) });
    if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof Error && AgendaController.ERROS_CUIDADO.includes(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    console.error(`Erro ao ${acao} cuidado:`, error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }

  async editarCuidado(req: Request, res: Response) {
    try {
      const { body } = editarCuidadoSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;
      if (!usuarioId) return res.status(401).json({ error: 'Usuário não autenticado' });
      res.json(await this.editarCuidadoUseCase.execute(body as EditarCuidadoDTO, usuarioId));
    } catch (error) {
      return this.erroDoCuidado(res, error, 'editar');
    }
  }

  async excluirCuidado(req: Request, res: Response) {
    try {
      const { body } = excluirCuidadoSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;
      if (!usuarioId) return res.status(401).json({ error: 'Usuário não autenticado' });
      await this.excluirCuidadoUseCase.execute(body.agendaIds, usuarioId);
      res.status(204).send();
    } catch (error) {
      return this.erroDoCuidado(res, error, 'excluir');
    }
  }
```

`agenda.router.ts` — before `agendaRouter.post('/:id/pular', ...)`:

```ts
agendaRouter.put('/cuidado', agendaController.editarCuidado.bind(agendaController));
agendaRouter.post('/cuidado/excluir', agendaController.excluirCuidado.bind(agendaController));
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: all suites PASS, no type errors.

- [ ] **Step 5: Smoke test against the local API and commit**

```bash
docker restart bonsai_api
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/agendas/cuidado/excluir -H "Content-Type: application/json" -d '{"agendaIds":[]}'
# Expected: 401 (sem token) — confirma que a rota existe e não caiu em /:id
git add server/src/modules/agenda
git commit -m "feat(server): editar e excluir o cuidado do dia (PUT /agendas/cuidado, POST /agendas/cuidado/excluir)"
```

---

### Task 7: Web — API, tipos e regras puras do cuidado do dia

**Files:**
- Modify: `web/src/types.ts` (`Planta.transplanteAgendaId`)
- Modify: `web/src/lib/endpoints.ts` (`agendasApi.editarCuidado`, `excluirCuidado`, `EditarCuidadoInput`)
- Create: `web/src/lib/cuidadoDoDia.ts`
- Test: `web/src/lib/cuidadoDoDia.test.ts`

**Interfaces:**
- Consumes: `linhaDoTempo`, `ItemLinha` (`src/lib/linhaDoTempo.ts`), `toDateInput`, `grupoLabel` (`src/lib/format.ts`).
- Produces:
  ```ts
  export type Cuidado = Extract<ItemLinha, { tipo: 'cuidado' }>;
  export function cuidadosDaPlanta(agendas: Agenda[], plantaId: string): Cuidado[];
  export function indiceDoCuidado(cuidados: Cuidado[], agendaId: string): number;          // -1 se não achar
  export function vizinhoAposExcluir(cuidados: Cuidado[], indice: number): string | null;  // id da 1ª tarefa do vizinho
  export type CampoTexto = 'detalhes' | 'observacaoFutura';
  export interface FormTexto { unico: boolean; valor: string; porTarefa: Record<string, string> }
  export function formTexto(agendas: Agenda[], campo: CampoTexto): FormTexto;
  export function textosAlterados(ficam: Agenda[], forms: Record<CampoTexto, FormTexto>): TextoDoCuidado[];
  export function cuidadoNoDia(cuidados: Cuidado[], dataInput: string, atual: Cuidado): Cuidado | null;
  export function textoExcluirCuidado(n: number, planta: Pick<Planta, 'grupo' | 'grupoAnterior' | 'transplanteAgendaId'> | undefined, ids: string[]): string;
  // endpoints.ts
  export interface TextoDoCuidado { agendaId: string; detalhes?: string | null; observacaoFutura?: string | null }
  export interface EditarCuidadoInput { agendaIds: string[]; dataConcluida?: string; textos?: TextoDoCuidado[]; removerAgendaIds?: string[] }
  agendasApi.editarCuidado(body: EditarCuidadoInput): Promise<Agenda[]>
  agendasApi.excluirCuidado(agendaIds: string[]): Promise<unknown>
  ```

- [ ] **Step 1: Write the failing test** — `cuidadoDoDia.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cuidadoNoDia,
  cuidadosDaPlanta,
  formTexto,
  indiceDoCuidado,
  textoExcluirCuidado,
  textosAlterados,
  vizinhoAposExcluir,
} from './cuidadoDoDia';
import type { Agenda } from '@/types';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 12, 12));
});
afterEach(() => vi.useRealTimers());

const em = (dia: number) => new Date(2026, 9, dia, 10).toISOString();
const feita = (id: string, dia: number, extra: Partial<Agenda> = {}): Agenda => ({
  id,
  plantaId: 'p1',
  atividadeId: id,
  atividade: { id, nome: id },
  dataAgendada: em(dia),
  dataConcluida: em(dia),
  status: 'CONCLUIDO',
  ...extra,
});

describe('cuidadosDaPlanta', () => {
  it('um cuidado por dia, do mais antigo ao mais novo, só concluídas da planta', () => {
    const agendas = [
      feita('b', 5),
      feita('a', 2),
      feita('c', 5),
      feita('x', 3, { plantaId: 'p2' }),
      feita('pend', 20, { status: 'PENDENTE', dataConcluida: null }),
    ];
    const cuidados = cuidadosDaPlanta(agendas, 'p1');
    expect(cuidados.map((c) => c.agendas.map((a) => a.id))).toEqual([['a'], ['b', 'c']]);
    expect(indiceDoCuidado(cuidados, 'c')).toBe(1);
    expect(indiceDoCuidado(cuidados, 'nada')).toBe(-1);
  });
});

describe('vizinhoAposExcluir', () => {
  const cuidados = cuidadosDaPlanta([feita('a', 1), feita('b', 2), feita('c', 3)], 'p1');
  it('prefere o anterior, senão o seguinte, senão nenhum', () => {
    expect(vizinhoAposExcluir(cuidados, 1)).toBe('a');
    expect(vizinhoAposExcluir(cuidados, 0)).toBe('b');
    expect(vizinhoAposExcluir(cuidados.slice(0, 1), 0)).toBeNull();
  });
});

describe('formTexto / textosAlterados', () => {
  it('textos iguais (ou vazios) → campo único; diferentes → por tarefa', () => {
    const iguais = [feita('a', 1, { detalhes: 'x' }), feita('b', 1, { detalhes: ' x ' })];
    expect(formTexto(iguais, 'detalhes')).toMatchObject({ unico: true, valor: 'x' });
    const vazios = [feita('a', 1), feita('b', 1)];
    expect(formTexto(vazios, 'detalhes')).toMatchObject({ unico: true, valor: '' });
    const diferentes = [feita('a', 1, { detalhes: 'x' }), feita('b', 1)];
    expect(formTexto(diferentes, 'detalhes')).toMatchObject({ unico: false, porTarefa: { a: 'x', b: '' } });
  });

  it('manda só o que mudou, só das tarefas que ficam; vazio vira null', () => {
    const a = feita('a', 1, { detalhes: 'x', observacaoFutura: 'o' });
    const b = feita('b', 1, { detalhes: 'y' });
    const forms = {
      detalhes: { unico: false, valor: '', porTarefa: { a: 'x', b: 'y2' } },
      observacaoFutura: { unico: true, valor: '', porTarefa: {} },
    };
    expect(textosAlterados([a, b], forms)).toEqual([
      { agendaId: 'a', observacaoFutura: null },
      { agendaId: 'b', detalhes: 'y2' },
    ]);
    // b tirada do card: nada dela é enviado
    expect(textosAlterados([a], forms)).toEqual([{ agendaId: 'a', observacaoFutura: null }]);
  });
});

describe('cuidadoNoDia', () => {
  it('acha outro cuidado da planta na data escolhida', () => {
    const cuidados = cuidadosDaPlanta([feita('a', 1), feita('b', 5)], 'p1');
    expect(cuidadoNoDia(cuidados, '2026-10-01', cuidados[1])?.agendas[0].id).toBe('a');
    expect(cuidadoNoDia(cuidados, '2026-10-05', cuidados[1])).toBeNull();
    expect(cuidadoNoDia(cuidados, '2026-10-09', cuidados[1])).toBeNull();
  });
});

describe('textoExcluirCuidado', () => {
  const recem = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: 'EM_CRESCIMENTO' as const, transplanteAgendaId: 't1' };
  it('avisa a volta de grupo só quando o Transplante de origem está no card', () => {
    expect(textoExcluirCuidado(2, recem, ['t1', 'x'])).toBe(
      'As 2 tarefas somem do histórico. As fotos continuam na galeria da planta. A planta volta para Em crescimento.',
    );
    expect(textoExcluirCuidado(1, recem, ['x'])).toBe('A tarefa some do histórico. As fotos continuam na galeria da planta.');
    expect(textoExcluirCuidado(1, { ...recem, grupoAnterior: null }, ['t1'])).toBe(
      'A tarefa some do histórico. As fotos continuam na galeria da planta. A planta sai de Recém transplantada.',
    );
  });
});
```

(If `grupoLabel('EM_CRESCIMENTO')` in `src/lib/format.ts` returns a different label, adjust the expected string to that label — read `grupoLabel` first.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd web && npx vitest run src/lib/cuidadoDoDia.test.ts`
Expected: FAIL — cannot resolve `./cuidadoDoDia`.

- [ ] **Step 3: Implement**

`types.ts` — in `interface Planta`, next to `preTransplanteAgendaId` (or after `grupoExpiraEm` if that field isn't there):

```ts
  /** Transplante concluído que colocou a planta em Recém transplantada. */
  transplanteAgendaId?: string | null;
```

`endpoints.ts` — before `export const agendasApi`:

```ts
export interface TextoDoCuidado {
  agendaId: string;
  /** null apaga o texto. */
  detalhes?: string | null;
  observacaoFutura?: string | null;
}

export interface EditarCuidadoInput {
  agendaIds: string[];
  dataConcluida?: string;
  textos?: TextoDoCuidado[];
  removerAgendaIds?: string[];
}
```

and inside `agendasApi`:

```ts
  /** Cuidado do dia (todas as tarefas do card): data, textos e tarefas tiradas, tudo ou nada. */
  editarCuidado: (body: EditarCuidadoInput) => data<Agenda[]>(api.put('/agendas/cuidado', body)),
  /** Apaga o cuidado do dia; as fotos ficam na galeria. */
  excluirCuidado: (agendaIds: string[]) => api.post('/agendas/cuidado/excluir', { agendaIds }),
```

`cuidadoDoDia.ts`:

```ts
import { grupoLabel, toDateInput } from './format';
import { linhaDoTempo, type ItemLinha } from './linhaDoTempo';
import type { TextoDoCuidado } from './endpoints';
import type { Agenda, Planta } from '@/types';

/** Cuidado do dia: tarefas concluídas da planta num dia (o card do histórico). */
export type Cuidado = Extract<ItemLinha, { tipo: 'cuidado' }>;

/** Cuidados feitos da planta, do mais antigo ao mais novo (só os das tarefas, sem fotos avulsas). */
export function cuidadosDaPlanta(agendas: Agenda[], plantaId: string): Cuidado[] {
  return linhaDoTempo(agendas.filter((a) => a.plantaId === plantaId)).passado.filter(
    (i): i is Cuidado => i.tipo === 'cuidado',
  );
}

export const indiceDoCuidado = (cuidados: Cuidado[], agendaId: string) =>
  cuidados.findIndex((c) => c.agendas.some((a) => a.id === agendaId));

/** Depois de excluir o cuidado `indice`: o anterior, senão o seguinte (id da 1ª tarefa); null se não sobrar nenhum. */
export function vizinhoAposExcluir(cuidados: Cuidado[], indice: number): string | null {
  return (cuidados[indice - 1] ?? cuidados[indice + 1])?.agendas[0].id ?? null;
}

export type CampoTexto = 'detalhes' | 'observacaoFutura';

/** Formulário de um texto do card: um campo para todas (`unico`) ou um por tarefa. */
export interface FormTexto {
  unico: boolean;
  valor: string;
  porTarefa: Record<string, string>;
}

const textoDe = (a: Agenda, campo: CampoTexto) => (a[campo] ?? '').trim();

/** Textos iguais (ou todos vazios) → um campo só; diferentes → um por tarefa. */
export function formTexto(agendas: Agenda[], campo: CampoTexto): FormTexto {
  const textos = agendas.map((a) => textoDe(a, campo));
  return {
    unico: new Set(textos).size <= 1,
    valor: textos[0] ?? '',
    porTarefa: Object.fromEntries(agendas.map((a) => [a.id, textoDe(a, campo)])),
  };
}

/** `textos` do PUT: só tarefas que ficam e só campos que mudaram; texto vazio vira null (apaga). */
export function textosAlterados(ficam: Agenda[], forms: Record<CampoTexto, FormTexto>): TextoDoCuidado[] {
  return ficam.flatMap((a) => {
    const item: TextoDoCuidado = { agendaId: a.id };
    for (const campo of ['detalhes', 'observacaoFutura'] as const) {
      const f = forms[campo];
      const novo = (f.unico ? f.valor : (f.porTarefa[a.id] ?? '')).trim();
      if (novo !== textoDe(a, campo)) item[campo] = novo || null;
    }
    return Object.keys(item).length > 1 ? [item] : [];
  });
}

/** Outro cuidado da planta no dia `dataInput` (AAAA-MM-DD): mudar a data para lá junta os dois. */
export function cuidadoNoDia(cuidados: Cuidado[], dataInput: string, atual: Cuidado): Cuidado | null {
  return cuidados.find((c) => c !== atual && toDateInput(c.data) === dataInput) ?? null;
}

/** Texto da confirmação de excluir; avisa a volta de grupo quando o Transplante de origem está no card. */
export function textoExcluirCuidado(
  n: number,
  planta: Pick<Planta, 'grupo' | 'grupoAnterior' | 'transplanteAgendaId'> | undefined,
  ids: string[],
): string {
  const base = `${n === 1 ? 'A tarefa some' : `As ${n} tarefas somem`} do histórico. As fotos continuam na galeria da planta.`;
  const volta =
    planta?.grupo === 'RECEM_TRANSPLANTADA' && !!planta.transplanteAgendaId && ids.includes(planta.transplanteAgendaId);
  if (!volta) return base;
  return planta.grupoAnterior
    ? `${base} A planta volta para ${grupoLabel(planta.grupoAnterior)}.`
    : `${base} A planta sai de Recém transplantada.`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd web && npx vitest run src/lib/cuidadoDoDia.test.ts && npx tsc -b`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/types.ts web/src/lib/endpoints.ts web/src/lib/cuidadoDoDia.ts web/src/lib/cuidadoDoDia.test.ts
git commit -m "feat(web): API e regras do cuidado do dia (editar, excluir, vizinhos)"
```

---

### Task 8: Web — página do cuidado feito (painéis + deslizar) e tarefa cancelada

**Files:**
- Modify: `web/src/components/ui.tsx` (`PageHeader` ganha `titleTo?: string`)
- Create: `web/src/components/cuidado/PainelCuidado.tsx`, `CuidadosDaPlanta.tsx`, `CuidadoFeito.tsx`, `TarefaCancelada.tsx`
- Modify: `web/src/pages/TarefaPage.tsx`
- Delete: `web/src/components/CarrosselDoDia.tsx`, `web/src/components/HistoricoPlanta.tsx`

**Interfaces:**
- Consumes: Task 7 (`Cuidado`, `cuidadosDaPlanta`, `indiceDoCuidado`); `Roda` (`components/Roda.tsx`); `NotasDoCuidado` (`components/NotasDoCuidado.tsx`); `deveReposicionarCarrossel`, `MANTER_ROLAGEM` (`lib/rolagem.ts`); `tituloCuidado` (`lib/linhaDoTempo.ts`); `distanciaRelativa`, `dataLonga`, `plantaCodigoNome` (`lib/format.ts`); `textoIntervalo` (`lib/cuidados.ts`).
- Produces: `<CuidadoFeito agenda agendas />` (usado pela `TarefaPage`; Task 9 adiciona a edição nele); `<CuidadosDaPlanta cuidados atual onTrocar />`; `<PainelCuidado cuidado />`; `<TarefaCancelada agenda />`.

- [ ] **Step 1: `PageHeader.titleTo`** — in `ui.tsx`, change the signature to `{ title, back, right, titleTo }: { title: string; back?: boolean; right?: ReactNode; titleTo?: string }` and the `<h1>` to:

```tsx
        <h1 className="flex-1 truncate text-xl font-semibold">
          {titleTo ? (
            <Link to={titleTo} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </h1>
```

(import `Link` from `react-router` if not already imported in `ui.tsx`.)

- [ ] **Step 2: `PainelCuidado.tsx`**

```tsx
import { Link } from 'react-router';
import { Repeat } from 'lucide-react';
import { NotasDoCuidado } from '@/components/NotasDoCuidado';
import { Roda } from '@/components/Roda';
import { textoIntervalo } from '@/lib/cuidados';
import type { Cuidado } from '@/lib/cuidadoDoDia';
import { dataLonga, distanciaRelativa } from '@/lib/format';
import { tituloCuidado } from '@/lib/linhaDoTempo';

/** Um cuidado do dia: título, quando, rotina, notas e fotos. */
export function PainelCuidado({ cuidado }: { cuidado: Cuidado }) {
  const deRotina = cuidado.agendas.filter((a) => a.rotina);
  const plantaId = cuidado.agendas[0].plantaId;

  return (
    <section className="px-4">
      <h2 className="font-display text-2xl font-semibold leading-tight">{tituloCuidado(cuidado.agendas)}</h2>
      <p className="mt-1 text-sm text-muted">
        Concluído · {distanciaRelativa(cuidado.data).toLowerCase()} ({dataLonga(cuidado.data)})
      </p>
      {deRotina.map((a) => (
        <p key={a.id} className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Repeat size={14} /> {deRotina.length > 1 ? `${a.atividade?.nome ?? 'Cuidado'}: ` : 'Rotina '}
          {textoIntervalo(a.rotina!.intervaloDias)}
          {a.rotina!.pausada && ' · pausada'}
        </p>
      ))}
      <div className="mt-3">
        <NotasDoCuidado notas={cuidado.notas} />
      </div>
      {cuidado.fotos.length > 0 && (
        <>
          <h3 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">
            Fotos · {cuidado.fotos.length}
          </h3>
          <Roda label="Fotos do cuidado">
            {cuidado.fotos.map((f) => (
              <Link key={f.id} to={`/plantas/${plantaId}/galeria?foto=${f.id}`} className="block">
                <img src={f.caminhoArquivo} alt="" loading="lazy" className="aspect-square w-full rounded-2xl bg-primary-light object-cover" />
              </Link>
            ))}
          </Roda>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: `CuidadosDaPlanta.tsx`** (same scroll mechanics as the old `CarrosselDoDia`, now over cuidados, rendering only neighbours)

```tsx
import { useLayoutEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Cuidado } from '@/lib/cuidadoDoDia';
import { deveReposicionarCarrossel } from '@/lib/rolagem';
import { PainelCuidado } from './PainelCuidado';

/** Cuidados feitos da planta lado a lado; deslizar troca de cuidado. Só o atual e os vizinhos são montados. */
export function CuidadosDaPlanta({ cuidados, atual, onTrocar }: { cuidados: Cuidado[]; atual: number; onTrocar: (indice: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const emitido = useRef<number | null>(null);

  // Abre no cuidado da URL; a troca que veio do próprio deslizar não puxa de volta
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const veioDaRolagem = emitido.current !== null;
    if (emitido.current === atual) emitido.current = null;
    if (deveReposicionarCarrossel({ painelVisivel: Math.round(el.scrollLeft / el.clientWidth), atual, veioDaRolagem })) {
      el.scrollLeft = atual * el.clientWidth;
    }
  }, [atual, cuidados.length]);

  function aoRolar() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (cuidados[i] && i !== atual && emitido.current !== i) {
      emitido.current = i;
      onTrocar(i);
    }
  }

  const irPara = (i: number) => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' });

  return (
    <div>
      <div ref={ref} onScroll={aoRolar} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        {cuidados.map((c, i) => (
          <div key={c.agendas[0].id} className="w-full shrink-0 snap-center snap-always">
            {Math.abs(i - atual) <= 1 && <PainelCuidado cuidado={c} />}
          </div>
        ))}
      </div>
      {cuidados.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-xs text-muted">
          <button onClick={() => irPara(atual - 1)} disabled={atual === 0} className="hidden size-8 items-center justify-center rounded-full hover:bg-primary-light disabled:opacity-30 sm:flex" aria-label="Cuidado anterior">
            <ChevronLeft size={18} />
          </button>
          <span className="tabular-nums">
            {atual + 1} de {cuidados.length}
          </span>
          <button onClick={() => irPara(atual + 1)} disabled={atual === cuidados.length - 1} className="hidden size-8 items-center justify-center rounded-full hover:bg-primary-light disabled:opacity-30 sm:flex" aria-label="Próximo cuidado">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `CuidadoFeito.tsx`**

```tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { cuidadosDaPlanta, indiceDoCuidado } from '@/lib/cuidadoDoDia';
import { plantaCodigoNome } from '@/lib/format';
import { MANTER_ROLAGEM } from '@/lib/rolagem';
import type { Agenda } from '@/types';
import { CuidadosDaPlanta } from './CuidadosDaPlanta';

/** Tarefa concluída: o cuidado do dia dela, deslizando entre os cuidados da planta. */
export function CuidadoFeito({ agenda, agendas }: { agenda: Agenda; agendas: Agenda[] }) {
  const navigate = useNavigate();
  const cuidados = useMemo(() => cuidadosDaPlanta(agendas, agenda.plantaId), [agendas, agenda.plantaId]);
  const atual = Math.max(0, indiceDoCuidado(cuidados, agenda.id));
  const irPara = (id: string) => navigate(`/tarefas/${id}`, { replace: true, state: MANTER_ROLAGEM });

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader
        title={plantaCodigoNome(agenda.planta)}
        titleTo={`/plantas/${agenda.plantaId}`}
        back
        right={
          <button
            className="flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-light"
            aria-label="Editar cuidado"
          >
            <Pencil size={20} />
          </button>
        }
      />
      <div className="mx-auto max-w-2xl pt-5">
        <CuidadosDaPlanta cuidados={cuidados} atual={atual} onTrocar={(i) => irPara(cuidados[i].agendas[0].id)} />
      </div>
    </div>
  );
}
```

(The pencil gets its `onClick` in Task 9.)

- [ ] **Step 5: `TarefaCancelada.tsx`** — legacy `CANCELADO` view with delete

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Repeat, Trash2 } from 'lucide-react';
import { ConfirmSheet } from '@/components/Sheet';
import { PageHeader } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { textoIntervalo } from '@/lib/cuidados';
import { agendasApi } from '@/lib/endpoints';
import { dataLonga, distanciaRelativa, plantaCodigoNome } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda } from '@/types';

/** Tarefa cancelada (status antigo): só leitura + excluir. */
export function TarefaCancelada({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmar, setConfirmar] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    setExcluindo(true);
    try {
      await agendasApi.remove(agenda.id);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast('Tarefa excluída');
      navigate(`/plantas/${agenda.plantaId}`, { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setExcluindo(false);
    }
  }

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader
        title={plantaCodigoNome(agenda.planta)}
        titleTo={`/plantas/${agenda.plantaId}`}
        back
        right={
          <button onClick={() => setConfirmar(true)} className="flex size-10 items-center justify-center rounded-full text-danger hover:bg-danger/10" aria-label="Excluir tarefa">
            <Trash2 size={20} />
          </button>
        }
      />
      <section className="mx-auto max-w-2xl px-4 pt-5">
        <h2 className="font-display text-2xl font-semibold">{agenda.atividade?.nome ?? 'Tarefa'}</h2>
        <p className="mt-1 text-sm text-muted">
          Cancelada · {distanciaRelativa(agenda.dataAgendada).toLowerCase()} ({dataLonga(agenda.dataAgendada)})
        </p>
        {agenda.rotina && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Repeat size={14} /> Rotina {textoIntervalo(agenda.rotina.intervaloDias)}
          </p>
        )}
        {agenda.pulada && <p className="mt-1 text-sm text-muted">Pulada</p>}
        {!!agenda.fotos?.length && (
          <div className="mt-5 grid grid-cols-3 gap-1.5">
            {agenda.fotos.map((f) => (
              <Link key={f.id} to={`/plantas/${agenda.plantaId}/galeria?foto=${f.id}`} className="aspect-square overflow-hidden rounded-xl bg-primary-light">
                <img src={f.caminhoArquivo} alt="" loading="lazy" className="size-full object-cover" />
              </Link>
            ))}
          </div>
        )}
      </section>
      <ConfirmSheet open={confirmar} onClose={() => setConfirmar(false)} onConfirm={excluir} loading={excluindo} title="Excluir tarefa?" text="Ela some do histórico. As fotos continuam na galeria da planta." />
    </div>
  );
}
```

- [ ] **Step 6: `TarefaPage.tsx`** — replace everything after the `PENDENTE` branch:

```tsx
  if (agenda.status === 'PENDENTE') return <PendentesDaPlanta key={agenda.id} agenda={agenda} agendas={agendas.data ?? []} />;
  if (agenda.status === 'CANCELADO') return <TarefaCancelada agenda={agenda} />;
  return <CuidadoFeito agenda={agenda} agendas={agendas.data ?? []} />;
}
```

Update imports (remove `Link`, `Repeat`, `CarrosselDoDia`, `HistoricoPlanta`, `PlantThumb`, `textoIntervalo`, `dataLonga`, `dataRelativa`, `plantaNome`, `plantaRotulo`, `tarefasDoDia`, `MANTER_ROLAGEM`, `useNavigate` if unused; add `CuidadoFeito`, `TarefaCancelada` from `@/components/cuidado/...`). Update the doc comment: `/** Detalhe da tarefa. Pendente: a planta e suas pendentes. Concluída: o cuidado do dia, deslizando entre os da planta. Cancelada: leitura + excluir. */`.

Delete the now-unused components:

```bash
git rm web/src/components/CarrosselDoDia.tsx web/src/components/HistoricoPlanta.tsx
```

Then check for leftovers: `grep -rn "CarrosselDoDia\|HistoricoPlanta\|chaveDoAtual" web/src` — `chaveDoAtual` was only used by `HistoricoPlanta`; if the grep shows it only in `linhaDoTempo.ts`/its test, leave it (tested, harmless) — do not widen scope.

- [ ] **Step 7: Verify build, lint, tests**

Run: `cd web && npx tsc -b && npm run lint && npx vitest run`
Expected: no type errors, no new lint errors (pre-existing `only-export-components` warnings are fine), all tests pass.

- [ ] **Step 8: Commit**

```bash
git add web/src
git commit -m "feat(web): página do cuidado feito desliza entre os cuidados da planta"
```

---

### Task 9: Web — gaveta "Editar cuidado" (salvar e excluir)

**Files:**
- Create: `web/src/components/cuidado/EditarCuidado.tsx`
- Modify: `web/src/components/cuidado/CuidadoFeito.tsx`

**Interfaces:**
- Consumes: Task 7 (`formTexto`, `textosAlterados`, `cuidadoNoDia`, `textoExcluirCuidado`, `vizinhoAposExcluir`, `agendasApi.editarCuidado/excluirCuidado`), Task 8 (`CuidadoFeito`).
- Produces: `<EditarCuidado cuidado cuidados planta onClose onSalvo onExcluido />` where `onSalvo(idQueFica: string)` and `onExcluido(vizinhoId: string | null)`.

- [ ] **Step 1: `EditarCuidado.tsx`**

```tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import {
  cuidadoNoDia,
  formTexto,
  indiceDoCuidado,
  textoExcluirCuidado,
  textosAlterados,
  vizinhoAposExcluir,
  type CampoTexto,
  type Cuidado,
  type FormTexto,
} from '@/lib/cuidadoDoDia';
import { agendasApi } from '@/lib/endpoints';
import { dataCurta, fromDateInput, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda, Planta } from '@/types';

const ROTULO: Record<CampoTexto, string> = { detalhes: 'Descrição', observacaoFutura: 'Obs. para o futuro' };

/** Gaveta de edição do cuidado do dia: data, tarefas, textos; e excluir o cuidado. */
export function EditarCuidado({
  cuidado,
  cuidados,
  planta,
  onClose,
  onSalvo,
  onExcluido,
}: {
  cuidado: Cuidado;
  cuidados: Cuidado[];
  planta?: Planta;
  onClose: () => void;
  onSalvo: (idQueFica: string) => void;
  onExcluido: (vizinhoId: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const ids = cuidado.agendas.map((a) => a.id);
  const [data, setData] = useState(() => toDateInput(cuidado.data));
  const [removidas, setRemovidas] = useState<string[]>([]);
  const [forms, setForms] = useState<Record<CampoTexto, FormTexto>>(() => ({
    detalhes: formTexto(cuidado.agendas, 'detalhes'),
    observacaoFutura: formTexto(cuidado.agendas, 'observacaoFutura'),
  }));
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const ficam = cuidado.agendas.filter((a) => !removidas.includes(a.id));
  const textos = textosAlterados(ficam, forms);
  const mudouData = data !== toDateInput(cuidado.data);
  const mudou = mudouData || removidas.length > 0 || textos.length > 0;
  const juntar = mudouData ? cuidadoNoDia(cuidados, data, cuidado) : null;
  const deRotina = cuidado.agendas.some((a) => a.rotinaId);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: keys.agendas });
    queryClient.invalidateQueries({ queryKey: keys.rotinas });
    queryClient.invalidateQueries({ queryKey: keys.plantas });
    queryClient.invalidateQueries({ queryKey: keys.fotos(cuidado.agendas[0].plantaId) });
  }

  async function salvar() {
    setSalvando(true);
    try {
      await agendasApi.editarCuidado({
        agendaIds: ids,
        ...(mudouData ? { dataConcluida: fromDateInput(data) } : {}),
        ...(textos.length ? { textos } : {}),
        ...(removidas.length ? { removerAgendaIds: removidas } : {}),
      });
      invalidar();
      toast('Cuidado atualizado');
      onSalvo(ficam[0].id);
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await agendasApi.excluirCuidado(ids);
      invalidar();
      toast('Cuidado excluído');
      onExcluido(vizinhoAposExcluir(cuidados, indiceDoCuidado(cuidados, ids[0])));
    } catch (error) {
      toast(errorMessage(error), 'error');
      setExcluindo(false);
    }
  }

  const campoTexto = (campo: CampoTexto) => {
    const f = forms[campo];
    const mudar = (novo: Partial<FormTexto>) => setForms((atual) => ({ ...atual, [campo]: { ...atual[campo], ...novo } }));
    if (f.unico) {
      return (
        <Field key={campo} label={ROTULO[campo]}>
          <textarea className="input min-h-20" value={f.valor} onChange={(e) => mudar({ valor: e.target.value })} />
        </Field>
      );
    }
    return ficam.map((a: Agenda) => (
      <Field key={`${campo}-${a.id}`} label={`${ROTULO[campo]} · ${a.atividade?.nome ?? 'Cuidado'}`}>
        <textarea
          className="input min-h-20"
          value={f.porTarefa[a.id] ?? ''}
          onChange={(e) => mudar({ porTarefa: { ...f.porTarefa, [a.id]: e.target.value } })}
        />
      </Field>
    ));
  };

  return (
    <>
      <Sheet
        open={!confirmar}
        onClose={onClose}
        title="Editar cuidado"
        footer={
          <Button block onClick={salvar} loading={salvando} disabled={!mudou}>
            Salvar
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Data">
            <input type="date" className="input" value={data} max={toDateInput()} onChange={(e) => e.target.value && setData(e.target.value)} />
          </Field>
          {juntar && <p className="-mt-2 text-xs text-muted">Vai juntar com o cuidado de {dataCurta(juntar.data)}.</p>}
          {deRotina && mudouData && <p className="-mt-2 text-xs text-muted">Mudar a data não reagenda a próxima da rotina.</p>}

          <div>
            <span className="label">Tarefas</span>
            <div className="flex flex-wrap gap-2">
              {ficam.map((a) => (
                <span key={a.id} className="chip flex items-center gap-1.5 py-1 pr-1.5">
                  {a.atividade?.nome ?? 'Cuidado'}
                  <button
                    type="button"
                    onClick={() => setRemovidas((r) => [...r, a.id])}
                    disabled={ficam.length === 1}
                    className="flex size-6 items-center justify-center rounded-full hover:bg-danger/10 disabled:opacity-30"
                    aria-label={`Tirar ${a.atividade?.nome ?? 'tarefa'}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            {removidas.length > 0 && (
              <button type="button" onClick={() => setRemovidas([])} className="mt-1.5 text-xs font-semibold text-primary">
                Desfazer ({removidas.length} tirada{removidas.length > 1 ? 's' : ''})
              </button>
            )}
          </div>

          {campoTexto('detalhes')}
          {campoTexto('observacaoFutura')}

          <Button block variant="danger" onClick={() => setConfirmar(true)}>
            <Trash2 size={18} /> Excluir cuidado
          </Button>
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={excluir}
        loading={excluindo}
        title="Excluir este cuidado?"
        text={textoExcluirCuidado(ids.length, planta, ids)}
      />
    </>
  );
}
```

(Check `Field`, `Button` props in `components/ui.tsx` and the `chip`/`label`/`input` classes in `src/index.css` before relying on them — they are used the same way in `EditPlantPage.tsx`.)

- [ ] **Step 2: Wire it into `CuidadoFeito.tsx`**

Add `useState`, `usePlanta`, `EditarCuidado`:

```tsx
import { useMemo, useState } from 'react';
import { usePlanta } from '@/lib/queries';
import { EditarCuidado } from './EditarCuidado';
// ...
  const [editando, setEditando] = useState(false);
  const planta = usePlanta(agenda.plantaId);
  const cuidado = cuidados[atual];
```

Pencil button: `onClick={() => setEditando(true)}` and `disabled={!cuidado}`. After the `<div className="mx-auto max-w-2xl pt-5">…</div>`:

```tsx
      {editando && cuidado && (
        <EditarCuidado
          key={cuidado.agendas[0].id}
          cuidado={cuidado}
          cuidados={cuidados}
          planta={planta.data}
          onClose={() => setEditando(false)}
          onSalvo={(id) => {
            setEditando(false);
            irPara(id);
          }}
          onExcluido={(vizinho) => {
            setEditando(false);
            if (vizinho) irPara(vizinho);
            else navigate(`/plantas/${agenda.plantaId}`, { replace: true });
          }}
        />
      )}
```

- [ ] **Step 3: Verify build, lint, tests**

Run: `cd web && npx tsc -b && npm run lint && npx vitest run`
Expected: clean (pre-existing warnings only), all tests pass.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/cuidado
git commit -m "feat(web): editar e excluir o cuidado do dia"
```

---

### Task 10: Verificação no navegador + docs

**Files:**
- Modify: `CLAUDE.md` (trecho da `TarefaPage`), `docs/todo.md` (item do procedimento feito)

- [ ] **Step 1: Prepare** — `docker restart bonsai_api`; `cd web && npm run dev` (background). Chrome em `http://localhost:5173` logado na conta local de teste; ver no iframe de 390px (memória `local-browser-testing`). Seed via API com `localStorage.bonsai_token`: 1 planta; cuidados concluídos em 3 dias diferentes (via `POST /agendas/registrar`), um deles com 2 atividades e descrições diferentes por tarefa (dois registros no mesmo dia), outro com Transplante registrado com `moverRecemTransplantada: true` (planta deve ficar em Recém transplantada; conferir `GET /plantas/:id` → `transplanteAgendaId` preenchido).

- [ ] **Step 2: Check each behavior**
  - Abrir um cuidado pela roda da página da planta: título do card, "Concluído · …", notas, fotos; header `#N · nome` leva à planta.
  - Deslizar: troca de cuidado, URL acompanha (`replace`), "2 de 3"; voltar do aparelho sai da página.
  - Editar: mudar descrição única → salva; card com textos diferentes mostra um campo por tarefa; tirar uma tarefa → some do card e a página continua (inclusive quando a tirada era a da URL); data para o dia de outro cuidado → aviso "Vai juntar…" e, salvando, viram um card.
  - Excluir o cuidado com Transplante: confirmação diz "A planta volta para …"; depois, `GET /plantas/:id` mostra o grupo anterior e `transplanteAgendaId` nulo; página vai para o cuidado vizinho.
  - Excluir o último cuidado → volta para a planta.
  - `DELETE /agendas/:id` direto numa tarefa de Transplante de origem (via JS) também tira a planta do grupo.
  - Apagar os dados de teste no fim.

- [ ] **Step 3: Docs** — `CLAUDE.md`: replace the `TarefaPage` sentence fragment "tarefa concluída: carrossel `components/CarrosselDoDia.tsx` com as tarefas do dia" with "tarefa concluída: `components/cuidado/CuidadoFeito.tsx` — o cuidado do dia (`src/lib/cuidadoDoDia.ts`), deslizando entre os cuidados da planta, com edição/exclusão (`PUT /api/agendas/cuidado`, `POST /api/agendas/cuidado/excluir`); toda escrita de tarefa reavalia Recém transplantada pelo `Planta.transplanteAgendaId` (`planta/use-cases/reavaliar-grupos.ts`)". `docs/todo.md`: mark the "tela de detalhes de procedimento feito" item `[x]` with a `> Feito em 2026-10-12 (spec em docs/superpowers/specs/2026-10-12-detalhe-do-cuidado-design.md): …` summary line.

- [ ] **Step 4: Final checks and commit**

Run: `cd server && npm test && npm run build` and `cd web && npm run build && npx vitest run`
Expected: all green.

```bash
git add CLAUDE.md docs/todo.md
git commit -m "docs: página do cuidado feito"
```

Do **not** push; tell the user the commits are ready and that the deploy (push) will run the new migration on Neon via `vercel-build` (`prisma migrate deploy`).
