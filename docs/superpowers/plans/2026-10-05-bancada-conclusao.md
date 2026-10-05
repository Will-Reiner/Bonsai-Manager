# Bancada de trabalho + Tela de conclusão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a aba "Hoje" por uma Bancada de trabalho agrupada por atividade, criar a tela de detalhe da tarefa com histórico horizontal, uma tela de conclusão completa (individual ou em grupo) e a regra de "Revisão geral" automática.

**Architecture:** Backend ganha `POST /api/agendas/concluir`, um use case transacional (`ConcluirAgendasUseCase`) que conclui N tarefas, troca atividade, cria procedimentos extras, próximos passos, fotos vinculadas (`Foto.agendaId`) e aplica a regra da revisão. A web (React + TanStack Query) ganha as páginas `BancadaPage` (`/`), `TarefaPage` (`/tarefas/:id`) e `ConcluirPage` (`/concluir?ids=...`); o `TaskSheet` some.

**Tech Stack:** Node/Express + Prisma + Zod + Jest (server/); React 19 + Vite + TS + Tailwind v4 + TanStack Query + react-router + lucide-react (web/).

**Spec:** `docs/superpowers/specs/2026-10-05-bancada-conclusao-design.md`

## Global Constraints

- Não mexer em `mobile_app/`.
- Código, comentários e UI em **português**.
- Produtos utilizados (inventário) fora do escopo.
- Descrição → `Agenda.detalhes`; Obs. → `Agenda.observacaoFutura`.
- Preferência `revisao_automatica_dias`: string numérica, padrão `"30"`, `"0"` = desligada; inválido → 30; negativo → 0.
- Regra: sem próximos passos, por planta: se próxima PENDENTE (data ≥ agora, excluindo as concluídas agora) ≤ agora + N + 30 dias → nada; senão cria "Revisão geral" em agora + N dias.
- Nome da atividade automática: exatamente `Revisão geral`.
- Janela da bancada: atrasadas (dia < hoje) + "Próximas tarefas" (hoje .. hoje+6).
- Git neste ambiente: usar `"C:\Program Files\Git\cmd\git.exe"` (PowerShell) — o `git` do Bash está quebrado.
- Commits terminam com:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Q4S6bYt82nsNKhLBZLWdzb
  ```

---

## File Structure

**server/**
- Modify `prisma/schema.prisma` — `Foto.agendaId`, `Agenda.fotos`.
- Create `prisma/migrations/20261005120000_add_foto_agenda/migration.sql`.
- Modify `prisma/seed.js` — atividade "Revisão geral".
- Modify `src/modules/agenda/agenda.types.ts` — DTOs/interface da conclusão.
- Create `src/modules/agenda/use-cases/concluir-agendas.use-case.ts` (+ `.test.ts`).
- Modify `src/modules/agenda/use-cases/index.ts` — export.
- Create `src/modules/agenda/repositories/prisma-conclusao.repository.ts`.
- Modify `src/modules/agenda/repositories/prisma-agenda.repository.ts` — `identificador` + `fotos` nos includes.
- Modify `src/modules/agenda/agenda.schema.ts` — `concluirAgendasSchema`.
- Modify `src/modules/agenda/agenda.controller.ts` — `concluir`.
- Modify `src/modules/agenda/agenda.router.ts` — `POST /concluir`.

**web/src/**
- Modify `types.ts` — `Agenda.planta.identificador`, `Agenda.fotos`.
- Modify `lib/endpoints.ts` — `agendasApi.concluir`, `preferenciasApi.set`.
- Modify `lib/queries.ts` — `usePreferencias`, `useRevisaoDias`.
- Modify `lib/format.ts` — `tarefasDaBancada`, `agruparPorAtividade`, `plantaRotulo`, `daquiADias` (Task 4); remove `agruparTarefas` (Task 7).
- Create `pages/ConcluirPage.tsx`.
- Create `pages/TarefaPage.tsx`, `components/HistoricoPlanta.tsx`.
- Create `pages/BancadaPage.tsx`, `components/BenchTaskCard.tsx`; delete `pages/TodayPage.tsx`.
- Modify `context/CareContext.tsx` — `abrirTarefa` navega; `reagendar`; remove TaskSheet.
- Delete `components/care/TaskSheet.tsx`.
- Modify `components/TaskCard.tsx` — ✓ abre conclusão.
- Modify `components/Layout.tsx` — aba "Bancada".
- Modify `App.tsx` — rotas.
- Modify `pages/ProfilePages.tsx` — preferência de revisão.

---

### Task 1: Schema, migration, seed e includes da listagem

**Files:**
- Modify: `server/prisma/schema.prisma` (models `Foto`, `Agenda`)
- Create: `server/prisma/migrations/20261005120000_add_foto_agenda/migration.sql`
- Modify: `server/prisma/seed.js` (array `ATIVIDADES`)
- Modify: `server/src/modules/agenda/repositories/prisma-agenda.repository.ts` (`findManyByUser`, `findByIdAndUser`)

**Interfaces:**
- Produces: `Foto.agendaId: string | null`; agenda list/get JSON passa a ter `planta.identificador` e `fotos: {id, caminhoArquivo}[]`.

- [ ] **Step 1: Schema**

Em `model Foto`, após `usuario ...`:
```prisma
  agendaId       String?
  agenda         Agenda?    @relation(fields: [agendaId], references: [id], onDelete: SetNull)
```
Em `model Agenda`, em `// Relacionamentos`:
```prisma
  fotos              Foto[]
```

- [ ] **Step 2: Migration SQL**

`server/prisma/migrations/20261005120000_add_foto_agenda/migration.sql`:
```sql
-- AlterTable
ALTER TABLE "Foto" ADD COLUMN "agendaId" TEXT;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

- [ ] **Step 3: Seed** — adicionar ao fim do array `ATIVIDADES` em `server/prisma/seed.js`:
```js
  { nome: 'Revisão geral', descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
```

- [ ] **Step 4: Includes** — nos dois métodos de `prisma-agenda.repository.ts`, trocar o include por:
```ts
      include: {
        planta: { select: { id: true, nome: true, identificador: true, fotoCapaUrl: true, especie: true } },
        atividade: { select: { id: true, nome: true } },
        recursosUtilizados: { include: { recurso: { include: { tipoRecurso: true } } } },
        fotos: { select: { id: true, caminhoArquivo: true } },
      },
```

- [ ] **Step 5: Gerar client e compilar**

Run: `cd server && npm run prisma:generate && npm run build`
Expected: sem erros.

- [ ] **Step 6: Commit**
```
feat(server): vincula foto à agenda e adiciona atividade Revisão geral
```

---

### Task 2: `ConcluirAgendasUseCase` (TDD)

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts`
- Create: `server/src/modules/agenda/use-cases/concluir-agendas.use-case.test.ts`
- Create: `server/src/modules/agenda/use-cases/concluir-agendas.use-case.ts`
- Modify: `server/src/modules/agenda/use-cases/index.ts`

**Interfaces:**
- Produces (em `agenda.types.ts`):
```ts
export const ATIVIDADE_REVISAO = 'Revisão geral';
export const PREF_REVISAO_DIAS = 'revisao_automatica_dias';

export interface ConcluirAgendasDTO {
  dataConcluida: string;
  atividadeId?: string;
  detalhes?: string;
  observacaoFutura?: string;
  extras?: string[];
  proximos?: { atividadeId: string; dataAgendada: string }[];
  itens: { agendaId: string; detalhes?: string; observacaoFutura?: string; fotos?: string[] }[];
}

export interface PlanoConclusao {
  usuarioId: string;
  dataConcluida: Date;
  atualizacoes: { agendaId: string; atividadeId?: string; detalhes?: string; observacaoFutura?: string }[];
  fotos: { agendaId: string; plantaId: string; caminhoArquivo: string }[];
  criarConcluidas: { plantaId: string; atividadeId: string; data: Date; detalhes?: string }[];
  criarPendentes: { plantaId: string; atividadeId: string; dataAgendada: Date }[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
}

export interface ResultadoConclusao {
  concluidas: any[];
  criadas: any[];
  revisoes: any[];
}

export interface ConclusaoRepository {
  /** Agendas PENDENTE do usuário dentre os ids informados. */
  findPendentesDoUsuario(ids: string[], usuarioId: string): Promise<{ id: string; plantaId: string }[]>;
  atividadesExistem(ids: string[]): Promise<boolean>;
  /** Valor normalizado da preferência (padrão 30, 0 = desligado). */
  getRevisaoDias(usuarioId: string): Promise<number>;
  /** Data da próxima PENDENTE da planta com dataAgendada >= aPartirDe, ignorando `excluir`. */
  proximaPendente(plantaId: string, aPartirDe: Date, excluir: string[]): Promise<Date | null>;
  executar(plano: PlanoConclusao): Promise<ResultadoConclusao>;
}
```
- Produces: `class ConcluirAgendasUseCase { constructor(repo: ConclusaoRepository); execute(dto: ConcluirAgendasDTO, usuarioId: string): Promise<ResultadoConclusao> }`. Erros: `'Acesso negado ou agendamento não encontrado.'`, `'Atividade não encontrada.'`.

- [ ] **Step 1: Adicionar os tipos acima ao fim de `agenda.types.ts`.**

- [ ] **Step 2: Escrever os testes**

`concluir-agendas.use-case.test.ts`:
```ts
import { ConcluirAgendasUseCase } from './concluir-agendas.use-case';
import { ConclusaoRepository, ConcluirAgendasDTO } from '../agenda.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');
const emDias = (d: number) => new Date(AGORA.getTime() + d * DIA);

describe('ConcluirAgendasUseCase', () => {
  let repo: jest.Mocked<ConclusaoRepository>;
  let useCase: ConcluirAgendasUseCase;

  const base: ConcluirAgendasDTO = {
    dataConcluida: AGORA.toISOString(),
    itens: [{ agendaId: 'ag-1' }],
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      findPendentesDoUsuario: jest.fn().mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1' }]),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      getRevisaoDias: jest.fn().mockResolvedValue(30),
      proximaPendente: jest.fn().mockResolvedValue(null),
      executar: jest.fn().mockResolvedValue({ concluidas: [], criadas: [], revisoes: [] }),
    };
    useCase = new ConcluirAgendasUseCase(repo);
  });

  afterEach(() => jest.useRealTimers());

  const plano = () => repo.executar.mock.calls[0][0];

  it('conclui uma tarefa simples aplicando descrição e obs. comuns', async () => {
    await useCase.execute({ ...base, detalhes: 'ok', observacaoFutura: 'atenção' }, 'user-1');

    expect(repo.findPendentesDoUsuario).toHaveBeenCalledWith(['ag-1'], 'user-1');
    expect(plano().usuarioId).toBe('user-1');
    expect(plano().dataConcluida).toEqual(AGORA);
    expect(plano().atualizacoes).toEqual([
      { agendaId: 'ag-1', atividadeId: undefined, detalhes: 'ok', observacaoFutura: 'atenção' },
    ]);
  });

  it('ajuste por planta sobrescreve os campos comuns e vincula fotos', async () => {
    repo.findPendentesDoUsuario.mockResolvedValue([
      { id: 'ag-1', plantaId: 'pl-1' },
      { id: 'ag-2', plantaId: 'pl-2' },
    ]);
    await useCase.execute(
      {
        ...base,
        detalhes: 'comum',
        itens: [
          { agendaId: 'ag-1', fotos: ['u1'] },
          { agendaId: 'ag-2', detalhes: 'só dela', fotos: ['u1', 'u2'] },
        ],
      },
      'user-1',
    );

    expect(plano().atualizacoes.map((a) => a.detalhes)).toEqual(['comum', 'só dela']);
    expect(plano().fotos).toEqual([
      { agendaId: 'ag-1', plantaId: 'pl-1', caminhoArquivo: 'u1' },
      { agendaId: 'ag-2', plantaId: 'pl-2', caminhoArquivo: 'u1' },
      { agendaId: 'ag-2', plantaId: 'pl-2', caminhoArquivo: 'u2' },
    ]);
  });

  it('troca a atividade e cria extras concluídos em cada planta', async () => {
    await useCase.execute({ ...base, atividadeId: 'at-x', extras: ['at-e1', 'at-e2'], detalhes: 'd' }, 'user-1');

    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-x', 'at-e1', 'at-e2']);
    expect(plano().atualizacoes[0].atividadeId).toBe('at-x');
    expect(plano().criarConcluidas).toEqual([
      { plantaId: 'pl-1', atividadeId: 'at-e1', data: AGORA, detalhes: 'd' },
      { plantaId: 'pl-1', atividadeId: 'at-e2', data: AGORA, detalhes: 'd' },
    ]);
  });

  it('cria próximos passos por planta e não cria revisão', async () => {
    const quando = emDias(14).toISOString();
    await useCase.execute({ ...base, proximos: [{ atividadeId: 'at-p', dataAgendada: quando }] }, 'user-1');

    expect(plano().criarPendentes).toEqual([{ plantaId: 'pl-1', atividadeId: 'at-p', dataAgendada: emDias(14) }]);
    expect(plano().revisoes).toEqual([]);
    expect(repo.getRevisaoDias).not.toHaveBeenCalled();
  });

  it('cria revisão em N dias quando a planta não tem pendente', async () => {
    await useCase.execute(base, 'user-1');

    expect(repo.proximaPendente).toHaveBeenCalledWith('pl-1', AGORA, ['ag-1']);
    expect(plano().revisoes).toEqual([{ plantaId: 'pl-1', dataAgendada: emDias(30) }]);
  });

  it('não cria revisão se a próxima pendente está dentro de N + 30 dias', async () => {
    repo.proximaPendente.mockResolvedValue(emDias(60));
    await useCase.execute(base, 'user-1');
    expect(plano().revisoes).toEqual([]);
  });

  it('cria revisão se a próxima pendente está além de N + 30 dias', async () => {
    repo.getRevisaoDias.mockResolvedValue(15);
    repo.proximaPendente.mockResolvedValue(emDias(46));
    await useCase.execute(base, 'user-1');
    expect(plano().revisoes).toEqual([{ plantaId: 'pl-1', dataAgendada: emDias(15) }]);
  });

  it('não cria revisão quando a preferência está desligada (0)', async () => {
    repo.getRevisaoDias.mockResolvedValue(0);
    await useCase.execute(base, 'user-1');
    expect(repo.proximaPendente).not.toHaveBeenCalled();
    expect(plano().revisoes).toEqual([]);
  });

  it('avalia a revisão uma vez por planta distinta', async () => {
    repo.findPendentesDoUsuario.mockResolvedValue([
      { id: 'ag-1', plantaId: 'pl-1' },
      { id: 'ag-2', plantaId: 'pl-1' },
    ]);
    await useCase.execute({ ...base, itens: [{ agendaId: 'ag-1' }, { agendaId: 'ag-2' }] }, 'user-1');
    expect(repo.proximaPendente).toHaveBeenCalledTimes(1);
    expect(plano().revisoes).toHaveLength(1);
  });

  it('falha se alguma tarefa não é do usuário ou não está pendente', async () => {
    repo.findPendentesDoUsuario.mockResolvedValue([]);
    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(repo.executar).not.toHaveBeenCalled();
  });

  it('falha se alguma atividade não existe', async () => {
    repo.atividadesExistem.mockResolvedValue(false);
    await expect(useCase.execute({ ...base, extras: ['x'] }, 'user-1')).rejects.toThrow('Atividade não encontrada.');
    expect(repo.executar).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server && npm test -- concluir-agendas`
Expected: FAIL — `Cannot find module './concluir-agendas.use-case'`.

- [ ] **Step 4: Implementar**

`concluir-agendas.use-case.ts`:
```ts
import { ConclusaoRepository, ConcluirAgendasDTO, PlanoConclusao } from '../agenda.types';

const DIA = 86_400_000;
/** Folga além do intervalo da revisão: uma pendente até N + 30 dias já "cuida" da planta. */
const MARGEM_REVISAO_DIAS = 30;

/** Conclui uma ou várias tarefas e agenda o que vem depois (próximos passos ou Revisão geral). */
export class ConcluirAgendasUseCase {
  constructor(private repo: ConclusaoRepository) {}

  async execute(dto: ConcluirAgendasDTO, usuarioId: string) {
    const ids = [...new Set(dto.itens.map((i) => i.agendaId))];
    const pendentes = await this.repo.findPendentesDoUsuario(ids, usuarioId);
    if (pendentes.length !== ids.length) {
      throw new Error('Acesso negado ou agendamento não encontrado.');
    }

    const extras = dto.extras ?? [];
    const proximos = dto.proximos ?? [];
    const atividadeIds = [
      ...new Set([dto.atividadeId, ...extras, ...proximos.map((p) => p.atividadeId)].filter((x): x is string => !!x)),
    ];
    if (atividadeIds.length && !(await this.repo.atividadesExistem(atividadeIds))) {
      throw new Error('Atividade não encontrada.');
    }

    const dataConcluida = new Date(dto.dataConcluida);
    const plantaDe = new Map(pendentes.map((p) => [p.id, p.plantaId]));
    const plantas = [...new Set(pendentes.map((p) => p.plantaId))];

    const plano: PlanoConclusao = {
      usuarioId,
      dataConcluida,
      atualizacoes: dto.itens.map((i) => ({
        agendaId: i.agendaId,
        atividadeId: dto.atividadeId,
        detalhes: i.detalhes ?? dto.detalhes,
        observacaoFutura: i.observacaoFutura ?? dto.observacaoFutura,
      })),
      fotos: dto.itens.flatMap((i) =>
        (i.fotos ?? []).map((caminhoArquivo) => ({
          agendaId: i.agendaId,
          plantaId: plantaDe.get(i.agendaId)!,
          caminhoArquivo,
        })),
      ),
      criarConcluidas: plantas.flatMap((plantaId) =>
        extras.map((atividadeId) => ({ plantaId, atividadeId, data: dataConcluida, detalhes: dto.detalhes })),
      ),
      criarPendentes: plantas.flatMap((plantaId) =>
        proximos.map((p) => ({ plantaId, atividadeId: p.atividadeId, dataAgendada: new Date(p.dataAgendada) })),
      ),
      revisoes: [],
    };

    if (proximos.length === 0) {
      const dias = await this.repo.getRevisaoDias(usuarioId);
      if (dias > 0) {
        const agora = new Date();
        const limite = agora.getTime() + (dias + MARGEM_REVISAO_DIAS) * DIA;
        for (const plantaId of plantas) {
          const proxima = await this.repo.proximaPendente(plantaId, agora, ids);
          if (proxima && proxima.getTime() <= limite) continue;
          plano.revisoes.push({ plantaId, dataAgendada: new Date(agora.getTime() + dias * DIA) });
        }
      }
    }

    return this.repo.executar(plano);
  }
}
```

Em `use-cases/index.ts` adicionar:
```ts
export { ConcluirAgendasUseCase } from './concluir-agendas.use-case';
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd server && npm test -- concluir-agendas`
Expected: 11 passed.

- [ ] **Step 6: Commit**
```
feat(server): use case de conclusão em lote com revisão automática
```

---

### Task 3: Repositório Prisma, schema Zod, controller e rota

**Files:**
- Create: `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts`
- Modify: `server/src/modules/agenda/agenda.schema.ts`
- Modify: `server/src/modules/agenda/agenda.controller.ts`
- Modify: `server/src/modules/agenda/agenda.router.ts`

**Interfaces:**
- Consumes: `ConclusaoRepository`, `PlanoConclusao`, `ATIVIDADE_REVISAO`, `PREF_REVISAO_DIAS` (Task 2).
- Produces: `POST /api/agendas/concluir` → 200 `{ concluidas, criadas, revisoes }`; 404 acesso negado; 400 atividade inexistente / validação.

- [ ] **Step 1: Repositório**

`prisma-conclusao.repository.ts`:
```ts
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import {
  ATIVIDADE_REVISAO,
  ConclusaoRepository,
  PlanoConclusao,
  PREF_REVISAO_DIAS,
  ResultadoConclusao,
} from '../agenda.types';

const REVISAO_PADRAO_DIAS = 30;

export class PrismaConclusaoRepository implements ConclusaoRepository {
  async findPendentesDoUsuario(ids: string[], usuarioId: string) {
    return prisma.agenda.findMany({
      where: { id: { in: ids }, status: 'PENDENTE', planta: { usuarioId } },
      select: { id: true, plantaId: true },
    });
  }

  async atividadesExistem(ids: string[]) {
    const total = await prisma.atividade.count({ where: { id: { in: ids } } });
    return total === ids.length;
  }

  async getRevisaoDias(usuarioId: string) {
    const pref = await prisma.preferenciaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave: PREF_REVISAO_DIAS } },
    });
    const dias = pref ? parseInt(pref.valor, 10) : REVISAO_PADRAO_DIAS;
    if (Number.isNaN(dias)) return REVISAO_PADRAO_DIAS;
    return Math.max(0, dias);
  }

  async proximaPendente(plantaId: string, aPartirDe: Date, excluir: string[]) {
    const proxima = await prisma.agenda.findFirst({
      where: { plantaId, status: 'PENDENTE', dataAgendada: { gte: aPartirDe }, id: { notIn: excluir } },
      orderBy: { dataAgendada: 'asc' },
      select: { dataAgendada: true },
    });
    return proxima?.dataAgendada ?? null;
  }

  async executar(plano: PlanoConclusao): Promise<ResultadoConclusao> {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const concluidas = [];
        for (const a of plano.atualizacoes) {
          concluidas.push(
            await tx.agenda.update({
              where: { id: a.agendaId },
              data: {
                status: 'CONCLUIDO',
                dataConcluida: plano.dataConcluida,
                ...(a.atividadeId ? { atividadeId: a.atividadeId } : {}),
                ...(a.detalhes !== undefined ? { detalhes: a.detalhes } : {}),
                ...(a.observacaoFutura !== undefined ? { observacaoFutura: a.observacaoFutura } : {}),
              },
              include: { atividade: { select: { id: true, nome: true } } },
            }),
          );
        }

        for (const f of plano.fotos) {
          await tx.foto.create({
            data: {
              caminhoArquivo: f.caminhoArquivo,
              plantaId: f.plantaId,
              agendaId: f.agendaId,
              usuarioId: plano.usuarioId,
              titulo: concluidas.find((c) => c.id === f.agendaId)?.atividade?.nome,
              dataCaptura: plano.dataConcluida,
            },
          });
        }

        const criadas = [];
        for (const c of plano.criarConcluidas) {
          criadas.push(
            await tx.agenda.create({
              data: {
                plantaId: c.plantaId,
                atividadeId: c.atividadeId,
                dataAgendada: c.data,
                dataConcluida: c.data,
                status: 'CONCLUIDO',
                detalhes: c.detalhes,
              },
            }),
          );
        }
        for (const p of plano.criarPendentes) {
          criadas.push(await tx.agenda.create({ data: p }));
        }

        const revisoes = [];
        if (plano.revisoes.length) {
          // Garante a atividade mesmo se o seed não tiver rodado no ambiente
          const revisao = await tx.atividade.upsert({
            where: { nome: ATIVIDADE_REVISAO },
            update: {},
            create: { nome: ATIVIDADE_REVISAO, descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
          });
          for (const r of plano.revisoes) {
            revisoes.push(
              await tx.agenda.create({
                data: { plantaId: r.plantaId, atividadeId: revisao.id, dataAgendada: r.dataAgendada },
              }),
            );
          }
        }

        return { concluidas, criadas, revisoes };
      },
      { timeout: 20_000 },
    );
  }
}
```

- [ ] **Step 2: Schema Zod** — adicionar em `agenda.schema.ts`:
```ts
export const concluirAgendasSchema = z.object({
  body: z.object({
    dataConcluida: z.string().datetime({ message: 'Data de conclusão inválida.' }),
    atividadeId: z.string().uuid().optional(),
    detalhes: z.string().optional(),
    observacaoFutura: z.string().optional(),
    extras: z.array(z.string().uuid()).optional(),
    proximos: z
      .array(z.object({ atividadeId: z.string().uuid(), dataAgendada: z.string().datetime() }))
      .optional(),
    itens: z
      .array(
        z.object({
          agendaId: z.string().uuid(),
          detalhes: z.string().optional(),
          observacaoFutura: z.string().optional(),
          fotos: z.array(z.string().url()).optional(),
        }),
      )
      .min(1, { message: 'Informe ao menos uma tarefa.' }),
  }),
});
```

- [ ] **Step 3: Controller** — em `agenda.controller.ts`:
  - importar `concluirAgendasSchema`, `ConcluirAgendasUseCase` (de `./use-cases`), `PrismaConclusaoRepository`, `ConcluirAgendasDTO`, e `ZodError` de `zod`;
  - campo `private concluirAgendasUseCase: ConcluirAgendasUseCase;` e no construtor `this.concluirAgendasUseCase = new ConcluirAgendasUseCase(new PrismaConclusaoRepository());`
  - método:
```ts
  async concluir(req: Request, res: Response) {
    try {
      const { body } = concluirAgendasSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const resultado = await this.concluirAgendasUseCase.execute(body as ConcluirAgendasDTO, usuarioId);
      res.json(resultado);
    } catch (error) {
      console.error('Erro ao concluir agendamentos:', error);

      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message ?? 'Dados inválidos' });
      }
      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof Error && error.message === 'Atividade não encontrada.') {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
```

- [ ] **Step 4: Rota** — em `agenda.router.ts`, antes de `agendaRouter.get('/:id', ...)`:
```ts
agendaRouter.post('/concluir', agendaController.concluir.bind(agendaController));
```

- [ ] **Step 5: Testes + build**

Run: `cd server && npm test && npm run build`
Expected: todos passam; build sem erros.

- [ ] **Step 6: Smoke test manual (se o Docker/DB estiver disponível)**

Run: `docker compose up --build` (raiz) e, com um token válido, `POST http://localhost:3000/api/agendas/concluir` com `{ "dataConcluida": "<iso>", "itens": [{ "agendaId": "<id pendente>" }] }`.
Expected: 200 com `revisoes` contendo 1 item quando a planta não tem outra pendente. Se não houver DB local, registrar que o smoke ficou para a verificação final.

- [ ] **Step 7: Commit**
```
feat(server): endpoint POST /agendas/concluir
```

---

### Task 4: Web — tipos, endpoints, queries e helpers

**Files:**
- Modify: `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/lib/format.ts`

**Interfaces:**
- Produces:
  - `agendasApi.concluir(body: ConcluirInput): Promise<ConcluirResultado>`
  - `preferenciasApi.set(chave: string, valor: string)`
  - `usePreferencias()`, `useRevisaoDias(): number`
  - `tarefasDaBancada(agendas): { atrasadas: Agenda[]; proximas: Agenda[] }`
  - `agruparPorAtividade(agendas): GrupoAtividade[]` com `GrupoAtividade = { atividadeId: string; nome: string; agendas: Agenda[] }`
  - `plantaRotulo(planta): string` (identificador → nome → espécie)
  - `daquiADias(dias: number): string` (ISO)

- [ ] **Step 1: `types.ts`** — em `interface Agenda`:
```ts
  planta?: Pick<Planta, 'id' | 'nome' | 'identificador' | 'fotoCapaUrl'> & { especie?: Partial<Especie> };
  atividade?: Pick<Atividade, 'id' | 'nome'>;
  fotos?: { id: string; caminhoArquivo: string }[];
```
e em `Preferencias` adicionar `revisao_automatica_dias?: string;`.

- [ ] **Step 2: `endpoints.ts`** — adicionar:
```ts
export interface ConcluirInput {
  dataConcluida: string;
  atividadeId?: string;
  detalhes?: string;
  observacaoFutura?: string;
  extras?: string[];
  proximos?: { atividadeId: string; dataAgendada: string }[];
  itens: { agendaId: string; detalhes?: string; observacaoFutura?: string; fotos?: string[] }[];
}

export interface ConcluirResultado {
  concluidas: Agenda[];
  criadas: Agenda[];
  revisoes: Agenda[];
}
```
dentro de `agendasApi`:
```ts
  /** Conclui uma ou várias tarefas (com extras, próximos passos e revisão automática). */
  concluir: (body: ConcluirInput) => data<ConcluirResultado>(api.post('/agendas/concluir', body)),
```
e `preferenciasApi`:
```ts
export const preferenciasApi = {
  get: () => data<Preferencias>(api.get('/preferencias')),
  set: (chave: string, valor: string) => api.put(`/preferencias/${chave}`, { valor }),
};
```

- [ ] **Step 3: `queries.ts`** — adicionar e usar em `useAtividadesOrdenadas`:
```ts
export const usePreferencias = () =>
  useQuery({ queryKey: keys.preferencias, queryFn: preferenciasApi.get, staleTime: 5 * 60_000 });

/** Dias da Revisão geral automática (padrão 30, 0 = desligada) — mesma regra do backend. */
export function useRevisaoDias() {
  const prefs = usePreferencias();
  const dias = parseInt(prefs.data?.revisao_automatica_dias ?? '30', 10);
  return Number.isNaN(dias) ? 30 : Math.max(0, dias);
}
```
Em `useAtividadesOrdenadas`, trocar a linha do `useQuery` de prefs por `const prefs = usePreferencias();`.

- [ ] **Step 4: `format.ts`** — adicionar:
```ts
export const daquiADias = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString();

/** Rótulo curto para identificar a planta: o identificador (ex.: JB-03) tem prioridade. */
export const plantaRotulo = (p?: Agenda['planta']) =>
  p?.identificador || p?.nome || p?.especie?.nomeComum || p?.especie?.nomeCientifico || 'Planta';

/** Pendentes da bancada: atrasadas e próximas (hoje até +6 dias). */
export function tarefasDaBancada(agendas: Agenda[]) {
  const pendentes = agendas.filter((a) => a.status === 'PENDENTE');
  return {
    atrasadas: pendentes.filter((a) => diasAte(a.dataAgendada) < 0),
    proximas: pendentes.filter((a) => {
      const d = diasAte(a.dataAgendada);
      return d >= 0 && d <= 6;
    }),
  };
}

export interface GrupoAtividade {
  atividadeId: string;
  nome: string;
  agendas: Agenda[];
}

/** Agrupa por atividade; grupos e itens ordenados pela data mais antiga. */
export function agruparPorAtividade(agendas: Agenda[]): GrupoAtividade[] {
  const grupos = new Map<string, GrupoAtividade>();
  for (const a of [...agendas].sort((x, y) => x.dataAgendada.localeCompare(y.dataAgendada))) {
    const g = grupos.get(a.atividadeId) ?? { atividadeId: a.atividadeId, nome: a.atividade?.nome ?? 'Cuidado', agendas: [] };
    g.agendas.push(a);
    grupos.set(a.atividadeId, g);
  }
  return [...grupos.values()];
}
```
**Não remover `agruparTarefas` nesta task** — `TodayPage` ainda a usa; a Task 7 a remove junto com a página.

- [ ] **Step 5: Build**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros.

- [ ] **Step 6: Commit**
```
feat(web): api de conclusão, preferência de revisão e helpers da bancada
```

---

### Task 5: Web — Tela de conclusão (`/concluir`)

**Files:**
- Create: `web/src/pages/ConcluirPage.tsx`
- Modify: `web/src/App.tsx` (rota)

**Interfaces:**
- Consumes: `agendasApi.concluir`, `useAgendas`, `useAtividadesOrdenadas`, `useRevisaoDias`, `uploadImage`, `plantaRotulo`, `toDateInput`, `fromDateInput`, `daquiADias`, `PhotoInput`, `PageHeader`, `PlantThumb`, `Field`, `Button`.
- Produces: rota `/concluir?ids=<id1>,<id2>`; ao terminar navega para `/` (replace).

- [ ] **Step 1: Criar `ConcluirPage.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button, EmptyState, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { PhotoInput } from '@/components/PhotoInput';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { daquiADias, fromDateInput, plantaRotulo, toDateInput } from '@/lib/format';
import { keys, useAgendas, useAtividadesOrdenadas, useRevisaoDias } from '@/lib/queries';
import { uploadImage } from '@/lib/upload';

interface Ajuste {
  detalhes: string;
  observacaoFutura: string;
  foto: File | null;
}

interface Proximo {
  atividadeId: string;
  data: string; // AAAA-MM-DD
}

const ATALHOS = [
  { label: '+1 sem', dias: 7 },
  { label: '+2 sem', dias: 14 },
  { label: '+1 mês', dias: 30 },
];

const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '', foto: null };

/** Concluir uma tarefa ou um grupo: campos comuns + ajuste opcional por planta. */
export function ConcluirPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const agendas = useAgendas();
  const atividades = useAtividadesOrdenadas();
  const revisaoDias = useRevisaoDias();

  const ids = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean), [params]);
  const tarefas = useMemo(
    () => (agendas.data ?? []).filter((a) => ids.includes(a.id) && a.status === 'PENDENTE'),
    [agendas.data, ids],
  );

  const [desmarcadas, setDesmarcadas] = useState<Set<string>>(new Set());
  const [aberta, setAberta] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [trocarAtividade, setTrocarAtividade] = useState(false);
  const [atividadeId, setAtividadeId] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [escolherExtra, setEscolherExtra] = useState(false);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [proximos, setProximos] = useState<Proximo[]>([]);
  const [salvando, setSalvando] = useState(false);

  const marcadas = tarefas.filter((t) => !desmarcadas.has(t.id));
  const atividadeAtual = tarefas[0]?.atividade;
  const nomeAtividade = (id: string) => atividades.data.find((a) => a.id === id)?.nome ?? '…';

  const alternar = (id: string) =>
    setDesmarcadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const ajuste = (id: string) => ajustes[id] ?? AJUSTE_VAZIO;
  const setAjuste = (id: string, patch: Partial<Ajuste>) =>
    setAjustes((a) => ({ ...a, [id]: { ...ajuste(id), ...patch } }));

  async function concluir() {
    if (!marcadas.length) return toast('Marque ao menos uma planta.', 'error');
    if (proximos.some((p) => !p.atividadeId || !p.data)) return toast('Complete os próximos passos.', 'error');
    setSalvando(true);
    try {
      const urlComum = foto ? await uploadImage(foto) : null;
      const itens = [];
      for (const t of marcadas) {
        const aj = ajuste(t.id);
        const urlPropria = aj.foto ? await uploadImage(aj.foto) : null;
        itens.push({
          agendaId: t.id,
          detalhes: aj.detalhes.trim() || undefined,
          observacaoFutura: aj.observacaoFutura.trim() || undefined,
          fotos: [urlComum, urlPropria].filter((u): u is string => !!u),
        });
      }
      const hoje = data === toDateInput();
      const resultado = await agendasApi.concluir({
        dataConcluida: hoje ? new Date().toISOString() : fromDateInput(data),
        atividadeId: atividadeId || undefined,
        detalhes: detalhes.trim() || undefined,
        observacaoFutura: observacaoFutura.trim() || undefined,
        extras: extras.length ? extras : undefined,
        proximos: proximos.length
          ? proximos.map((p) => ({ atividadeId: p.atividadeId, dataAgendada: fromDateInput(p.data) }))
          : undefined,
        itens,
      });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: ['fotos'] });
      const n = resultado.revisoes.length;
      toast(
        n
          ? `Concluído 🌿 · ${n === 1 ? 'Revisão geral agendada' : `${n} revisões gerais agendadas`}`
          : `${marcadas.length > 1 ? `${marcadas.length} tarefas concluídas` : 'Tarefa concluída'} 🌿`,
      );
      navigate('/', { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  if (agendas.isLoading || atividades.isLoading) return <><PageHeader title="Concluir" back /><Spinner /></>;
  if (!tarefas.length) {
    return (
      <>
        <PageHeader title="Concluir" back />
        <EmptyState title="Nada para concluir" text="Essas tarefas já foram concluídas ou não existem mais." />
      </>
    );
  }

  return (
    <div className="min-h-dvh pb-32">
      <PageHeader title={tarefas.length > 1 ? `Concluir ${atividadeAtual?.nome ?? 'grupo'}` : 'Concluir tarefa'} back />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
        {/* Plantas */}
        <section>
          <span className="label">{tarefas.length > 1 ? 'Plantas' : 'Planta'}</span>
          <div className="space-y-2">
            {tarefas.map((t) => {
              const marcada = !desmarcadas.has(t.id);
              const aj = ajuste(t.id);
              const temAjuste = !!(aj.detalhes || aj.observacaoFutura || aj.foto);
              return (
                <div key={t.id} className={`card overflow-hidden ${marcada ? '' : 'opacity-50'}`}>
                  <div className="flex items-center gap-3 p-2.5">
                    {tarefas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => alternar(t.id)}
                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                          marcada ? 'border-primary bg-primary text-white' : 'border-line'
                        }`}
                        aria-pressed={marcada}
                        aria-label={`Incluir ${plantaRotulo(t.planta)}`}
                      >
                        {marcada && <Check size={16} strokeWidth={3} />}
                      </button>
                    )}
                    <PlantThumb url={t.planta?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{plantaRotulo(t.planta)}</p>
                      {t.planta?.identificador && t.planta?.nome && (
                        <p className="truncate text-sm text-muted">{t.planta.nome}</p>
                      )}
                      {temAjuste && <p className="text-xs font-medium text-primary">Com ajuste próprio</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAberta(aberta === t.id ? null : t.id)}
                      className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-line/50"
                      aria-label="Ajustar só esta planta"
                      aria-expanded={aberta === t.id}
                    >
                      <ChevronDown size={20} className={`transition ${aberta === t.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {aberta === t.id && (
                    <div className="space-y-3 border-t border-line p-3">
                      <p className="text-xs text-muted">Só para esta planta (substitui os campos comuns).</p>
                      <Field label="Descrição">
                        <textarea
                          className="input min-h-16"
                          value={aj.detalhes}
                          onChange={(e) => setAjuste(t.id, { detalhes: e.target.value })}
                        />
                      </Field>
                      <Field label="Obs.">
                        <textarea
                          className="input min-h-16"
                          value={aj.observacaoFutura}
                          onChange={(e) => setAjuste(t.id, { observacaoFutura: e.target.value })}
                        />
                      </Field>
                      <PhotoInput
                        file={aj.foto}
                        onChange={(f) => setAjuste(t.id, { foto: f })}
                        label="Foto desta planta"
                        aspect="aspect-[16/9]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Atividade */}
        <section>
          <span className="label">Procedimento</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-active">{atividadeId ? nomeAtividade(atividadeId) : atividadeAtual?.nome}</span>
            <Button variant="ghost" size="sm" type="button" onClick={() => setTrocarAtividade((v) => !v)}>
              {trocarAtividade ? 'Fechar' : 'Trocar'}
            </Button>
          </div>
          {trocarAtividade && (
            <div className="mt-2 flex flex-wrap gap-2">
              {atividades.data.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className={`chip ${(atividadeId || atividadeAtual?.id) === a.id ? 'chip-active' : ''}`}
                  onClick={() => {
                    setAtividadeId(a.id === atividadeAtual?.id ? '' : a.id);
                    setTrocarAtividade(false);
                  }}
                >
                  {a.nome}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Feito junto */}
        <section>
          <span className="label">Feito junto (opcional)</span>
          <div className="flex flex-wrap gap-2">
            {extras.map((id) => (
              <button
                type="button"
                key={id}
                className="chip chip-active"
                onClick={() => setExtras((x) => x.filter((e) => e !== id))}
                aria-label={`Remover ${nomeAtividade(id)}`}
              >
                {nomeAtividade(id)} <X size={14} />
              </button>
            ))}
            <Button variant="ghost" size="sm" type="button" onClick={() => setEscolherExtra((v) => !v)}>
              <Plus size={16} /> Procedimento
            </Button>
          </div>
          {escolherExtra && (
            <div className="mt-2 flex flex-wrap gap-2">
              {atividades.data
                .filter((a) => !extras.includes(a.id) && a.id !== (atividadeId || atividadeAtual?.id))
                .map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    className="chip"
                    onClick={() => {
                      setExtras((x) => [...x, a.id]);
                      setEscolherExtra(false);
                    }}
                  >
                    {a.nome}
                  </button>
                ))}
            </div>
          )}
        </section>

        <Field label="Quando">
          <input type="date" className="input" value={data} max={toDateInput()} onChange={(e) => setData(e.target.value)} />
        </Field>

        <Field label="Descrição (opcional)">
          <textarea
            className="input min-h-20"
            value={detalhes}
            onChange={(e) => setDetalhes(e.target.value)}
            placeholder="O que foi feito"
          />
        </Field>

        <Field label="Obs. (opcional)" hint="Aparece em destaque no histórico da planta.">
          <textarea
            className="input min-h-16"
            value={observacaoFutura}
            onChange={(e) => setObservacaoFutura(e.target.value)}
            placeholder="Ex.: arame apertado no galho da esquerda"
          />
        </Field>

        <PhotoInput
          file={foto}
          onChange={setFoto}
          label={marcadas.length > 1 ? 'Foto (todas as plantas)' : 'Foto (opcional)'}
          aspect="aspect-[16/9]"
        />

        {/* Próximos passos */}
        <section>
          <span className="label">Próximos passos</span>
          <div className="space-y-3">
            {proximos.map((p, i) => (
              <div key={i} className="card space-y-2 p-3">
                <div className="flex items-center gap-2">
                  <select
                    className="input flex-1"
                    value={p.atividadeId}
                    onChange={(e) =>
                      setProximos((ps) => ps.map((x, j) => (j === i ? { ...x, atividadeId: e.target.value } : x)))
                    }
                  >
                    <option value="" disabled>
                      Tipo de cuidado
                    </option>
                    {atividades.data.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setProximos((ps) => ps.filter((_, j) => j !== i))}
                    className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-line/50"
                    aria-label="Remover próximo passo"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    className="input w-auto"
                    value={p.data}
                    min={toDateInput()}
                    onChange={(e) => setProximos((ps) => ps.map((x, j) => (j === i ? { ...x, data: e.target.value } : x)))}
                  />
                  {ATALHOS.map((at) => (
                    <button
                      type="button"
                      key={at.label}
                      className="chip"
                      onClick={() =>
                        setProximos((ps) =>
                          ps.map((x, j) => (j === i ? { ...x, data: toDateInput(daquiADias(at.dias)) } : x)),
                        )
                      }
                    >
                      {at.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setProximos((ps) => [...ps, { atividadeId: '', data: toDateInput(daquiADias(7)) }])}
            >
              <Plus size={16} /> Agendar próximo passo
            </Button>
            {proximos.length === 0 && revisaoDias > 0 && (
              <p className="text-xs text-muted">
                Sem próximos passos, será criada uma Revisão geral em {revisaoDias} dias (se a planta não tiver outra
                tarefa próxima).
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto mb-3 max-w-2xl">
          <Button block onClick={concluir} loading={salvando} disabled={!marcadas.length}>
            Concluir{marcadas.length > 1 ? ` (${marcadas.length})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rota** — em `App.tsx` importar `ConcluirPage` e adicionar após `/plantas/:id/editar`:
```tsx
        <Route path="/concluir" element={<Privada><ConcluirPage /></Privada>} />
```

- [ ] **Step 3: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**
```
feat(web): tela de conclusão de tarefas (individual e em grupo)
```

---

### Task 6: Web — Detalhe da tarefa com histórico + CareContext/TaskCard

**Files:**
- Create: `web/src/components/HistoricoPlanta.tsx`
- Create: `web/src/pages/TarefaPage.tsx`
- Modify: `web/src/context/CareContext.tsx`
- Modify: `web/src/components/TaskCard.tsx`
- Delete: `web/src/components/care/TaskSheet.tsx`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: `useAgendas`, `agendasApi.update/remove`, `plantaRotulo`, `dataCurta`, `dataRelativa`, `diasAte`, `Sheet`, `ConfirmSheet`.
- Produces: `HistoricoPlanta({ agendas: Agenda[]; atualId: string })`; `useCare()` passa a ter `{ registrarCuidado, agendarCuidado, abrirTarefa, reagendar }`; rota `/tarefas/:id`.

- [ ] **Step 1: `HistoricoPlanta.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Check, MessageSquareText } from 'lucide-react';
import { Sheet } from './Sheet';
import { dataCurta, dataRelativa, diasAte } from '@/lib/format';
import type { Agenda } from '@/types';

const dataDe = (a: Agenda) => (a.status === 'CONCLUIDO' ? a.dataConcluida ?? a.dataAgendada : a.dataAgendada);

/** Linha do tempo horizontal da planta: passados esmaecidos, atual em destaque, futuros tracejados. */
export function HistoricoPlanta({ agendas, atualId }: { agendas: Agenda[]; atualId: string }) {
  const atualRef = useRef<HTMLDivElement>(null);
  const [nota, setNota] = useState<Agenda | null>(null);

  const itens = agendas
    .filter((a) => a.status !== 'CANCELADO')
    .sort((x, y) => dataDe(x).localeCompare(dataDe(y)));

  useEffect(() => {
    atualRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [atualId, itens.length]);

  return (
    <>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {itens.map((a) => {
          const atual = a.id === atualId;
          const passado = a.status === 'CONCLUIDO';
          const atrasada = !passado && diasAte(a.dataAgendada) < 0;
          const foto = a.fotos?.[0]?.caminhoArquivo;
          return (
            <div
              key={a.id}
              ref={atual ? atualRef : undefined}
              className={`relative w-36 shrink-0 snap-center rounded-2xl p-3 ${
                atual
                  ? 'border-2 border-primary bg-primary-light'
                  : passado
                    ? 'border border-line bg-white opacity-70'
                    : 'border-2 border-dashed border-line bg-white'
              }`}
            >
              {atual && <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Agora</span>}
              {foto && <img src={foto} alt="" loading="lazy" className="mb-2 aspect-square w-full rounded-lg object-cover" />}
              <p className="flex items-center gap-1 text-sm font-semibold leading-tight">
                {passado && <Check size={14} className="shrink-0 text-primary" />}
                <span className="line-clamp-2">{a.atividade?.nome ?? 'Cuidado'}</span>
              </p>
              <p className={`mt-0.5 text-xs ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
                {passado ? dataCurta(dataDe(a)) : dataRelativa(a.dataAgendada)}
              </p>
              {passado && a.observacaoFutura && (
                <button
                  type="button"
                  onClick={() => setNota(a)}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-accent-light text-accent"
                  aria-label="Ver observação"
                >
                  <MessageSquareText size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!nota} onClose={() => setNota(null)} title={nota?.atividade?.nome ?? 'Observação'}>
        {nota && (
          <div className="space-y-4 pb-safe">
            <p className="text-sm text-muted">{dataCurta(dataDe(nota))}</p>
            <div>
              <span className="label">Obs.</span>
              <p className="whitespace-pre-line">{nota.observacaoFutura}</p>
            </div>
            {nota.detalhes && (
              <div>
                <span className="label">Descrição</span>
                <p className="whitespace-pre-line text-sm">{nota.detalhes}</p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
```

- [ ] **Step 2: `CareContext.tsx`** — substituir por:

```tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { RegisterCareSheet } from '@/components/care/RegisterCareSheet';
import { ScheduleCareSheet } from '@/components/care/ScheduleCareSheet';
import type { Agenda } from '@/types';

type Aberto =
  | { tipo: 'registrar'; plantaId?: string }
  | { tipo: 'agendar'; plantaId?: string; agenda?: Agenda }
  | null;

interface CareContextData {
  registrarCuidado: (plantaId?: string) => void;
  agendarCuidado: (plantaId?: string) => void;
  abrirTarefa: (agenda: Agenda) => void;
  reagendar: (agenda: Agenda) => void;
}

const CareContext = createContext<CareContextData | null>(null);

/** Sheets de cuidado acessíveis de qualquer tela (Bancada, Coleção, Detalhe, botão +). */
export function CareProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState<Aberto>(null);
  // Remonta o sheet a cada abertura para começar com o formulário limpo
  const [versao, setVersao] = useState(0);
  const abrir = useCallback((next: Aberto) => {
    setVersao((v) => v + 1);
    setAberto(next);
  }, []);
  const fechar = useCallback(() => setAberto(null), []);

  const value = useMemo(
    () => ({
      registrarCuidado: (plantaId?: string) => abrir({ tipo: 'registrar', plantaId }),
      agendarCuidado: (plantaId?: string) => abrir({ tipo: 'agendar', plantaId }),
      abrirTarefa: (agenda: Agenda) => navigate(`/tarefas/${agenda.id}`),
      reagendar: (agenda: Agenda) => abrir({ tipo: 'agendar', agenda }),
    }),
    [abrir, navigate],
  );

  return (
    <CareContext.Provider value={value}>
      {children}
      {aberto?.tipo === 'registrar' && (
        <RegisterCareSheet key={versao} open onClose={fechar} plantaId={aberto.plantaId} />
      )}
      {aberto?.tipo === 'agendar' && (
        <ScheduleCareSheet key={versao} open onClose={fechar} plantaId={aberto.plantaId} agenda={aberto.agenda} />
      )}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error('useCare precisa estar dentro de <CareProvider>');
  return ctx;
}
```
Depois apagar `web/src/components/care/TaskSheet.tsx`.

- [ ] **Step 3: `TarefaPage.tsx`**

```tsx
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarClock, Check, Trash2 } from 'lucide-react';
import { ConfirmSheet } from '@/components/Sheet';
import { HistoricoPlanta } from '@/components/HistoricoPlanta';
import { Button, EmptyState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { dataLonga, dataRelativa, diasAte, plantaRotulo } from '@/lib/format';
import { keys, useAgendas } from '@/lib/queries';

/** Detalhe da tarefa: planta em destaque + histórico horizontal + ações. */
export function TarefaPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { reagendar } = useCare();
  const agendas = useAgendas();
  const [salvando, setSalvando] = useState<'cancelar' | 'excluir' | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const agenda = agendas.data?.find((a) => a.id === id);
  const daPlanta = agendas.data?.filter((a) => a.plantaId === agenda?.plantaId) ?? [];

  async function acao(tipo: 'cancelar' | 'excluir') {
    if (!agenda) return;
    setSalvando(tipo);
    try {
      if (tipo === 'cancelar') await agendasApi.update(agenda.id, { status: 'CANCELADO' });
      else await agendasApi.remove(agenda.id);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast(tipo === 'cancelar' ? 'Tarefa cancelada' : 'Tarefa excluída');
      navigate(-1);
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(null);
    }
  }

  if (agendas.isLoading) return <><PageHeader title="Tarefa" back /><Spinner /></>;
  if (!agenda) {
    return (
      <>
        <PageHeader title="Tarefa" back />
        <EmptyState title="Tarefa não encontrada" />
      </>
    );
  }

  const pendente = agenda.status === 'PENDENTE';
  const atrasada = pendente && diasAte(agenda.dataAgendada) < 0;

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader title={agenda.atividade?.nome ?? 'Tarefa'} back />

      <div className="mx-auto max-w-2xl px-4">
        <Link to={`/plantas/${agenda.plantaId}`} className="relative mt-4 block overflow-hidden rounded-3xl">
          <PlantThumb url={agenda.planta?.fotoCapaUrl} className="aspect-[4/3] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
            <p className="text-3xl font-bold tracking-tight">{plantaRotulo(agenda.planta)}</p>
            {agenda.planta?.identificador && agenda.planta?.nome && <p className="text-sm opacity-90">{agenda.planta.nome}</p>}
          </div>
        </Link>

        <p className={`mt-4 text-sm ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
          {pendente ? 'Agendada' : 'Concluída'} · {dataRelativa(agenda.dataAgendada)} ({dataLonga(agenda.dataAgendada)})
        </p>

        <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Histórico da planta</h2>
        <HistoricoPlanta agendas={daPlanta} atualId={agenda.id} />

        {pendente && (
          <div className="mt-6 space-y-3">
            <Button block onClick={() => navigate(`/concluir?ids=${agenda.id}`)}>
              <Check size={18} /> Concluir
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" onClick={() => reagendar(agenda)}>
                <CalendarClock size={16} /> Reagendar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => acao('cancelar')} loading={salvando === 'cancelar'}>
                <Ban size={16} /> Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmarExclusao(true)}>
                <Trash2 size={16} /> Excluir
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmSheet
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={() => acao('excluir')}
        loading={salvando === 'excluir'}
        title="Excluir tarefa?"
        text="A tarefa some do histórico. Para manter o registro, use “Cancelar”."
      />
    </div>
  );
}
```

- [ ] **Step 4: `TaskCard.tsx`** — o ✓ passa a abrir a conclusão:

```tsx
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { PlantThumb } from './ui';
import { useCare } from '@/context/CareContext';
import { dataRelativa, diasAte } from '@/lib/format';
import type { Agenda } from '@/types';

/** Card de tarefa: toque no card abre detalhes; o botão ✓ abre a tela de conclusão. */
export function TaskCard({ agenda, showPlanta = true }: { agenda: Agenda; showPlanta?: boolean }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = diasAte(agenda.dataAgendada) < 0;

  return (
    <div className="card flex items-center gap-3 p-2.5 pr-3">
      <button onClick={() => abrirTarefa(agenda)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {showPlanta && <PlantThumb url={agenda.planta?.fotoCapaUrl} className="size-12 shrink-0 rounded-xl" />}
        <div className="min-w-0">
          <p className="truncate font-semibold">{agenda.atividade?.nome ?? 'Cuidado'}</p>
          <p className="truncate text-sm text-muted">
            {showPlanta && <>{agenda.planta?.nome || agenda.planta?.especie?.nomeComum || 'Planta'} · </>}
            <span className={atrasada ? 'font-medium text-danger' : ''}>{dataRelativa(agenda.dataAgendada)}</span>
          </p>
        </div>
      </button>
      <button
        onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-primary transition hover:bg-primary hover:text-white active:scale-90"
        aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'}`}
      >
        <Check size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Rota** — em `App.tsx` importar `TarefaPage` e adicionar:
```tsx
        <Route path="/tarefas/:id" element={<Privada><TarefaPage /></Privada>} />
```

- [ ] **Step 6: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros (verificar com `grep -rn TaskSheet web/src` que não sobrou import).

- [ ] **Step 7: Commit**
```
feat(web): detalhe da tarefa com histórico horizontal; conclusão sempre via tela
```

---

### Task 7: Web — Bancada (substitui "Hoje")

**Files:**
- Create: `web/src/components/BenchTaskCard.tsx`
- Create: `web/src/pages/BancadaPage.tsx`
- Delete: `web/src/pages/TodayPage.tsx`
- Modify: `web/src/lib/format.ts` (remover `agruparTarefas`)
- Modify: `web/src/components/Layout.tsx`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: `tarefasDaBancada`, `agruparPorAtividade`, `GrupoAtividade`, `plantaRotulo`, `useCare().abrirTarefa`.

- [ ] **Step 1: `BenchTaskCard.tsx`**

```tsx
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { PlantThumb } from './ui';
import { useCare } from '@/context/CareContext';
import { dataRelativa, diasAte, plantaRotulo } from '@/lib/format';
import type { Agenda } from '@/types';

/** Card da bancada: foto grande com o ID da planta em destaque. */
export function BenchTaskCard({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = diasAte(agenda.dataAgendada) < 0;
  const p = agenda.planta;
  const subtitulo = p?.identificador ? p?.nome || p?.especie?.nomeComum : p?.especie?.nomeComum;

  return (
    <div className="card overflow-hidden">
      <button onClick={() => abrirTarefa(agenda)} className="relative block w-full text-left" aria-label={`Abrir tarefa de ${plantaRotulo(p)}`}>
        <PlantThumb url={p?.fotoCapaUrl} className="aspect-[4/3] w-full" />
        <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-lg bg-black/70 px-2 py-1 text-base font-bold text-white">
          {plantaRotulo(p)}
        </span>
      </button>
      <div className="flex items-center gap-2 p-2.5">
        <button onClick={() => abrirTarefa(agenda)} className="min-w-0 flex-1 text-left">
          {subtitulo && <p className="truncate text-sm font-medium">{subtitulo}</p>}
          <p className={`truncate text-xs ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
            {dataRelativa(agenda.dataAgendada)}
          </p>
        </button>
        <button
          onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-primary transition hover:bg-primary hover:text-white active:scale-90"
          aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'} de ${plantaRotulo(p)}`}
        >
          <Check size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `BancadaPage.tsx`** (reaproveita saudação/dica/estados vazios da antiga `TodayPage`)

```tsx
import { Link, useNavigate } from 'react-router';
import { CalendarCheck, CheckCheck, PartyPopper } from 'lucide-react';
import { Button, EmptyState, ErrorState, SectionTitle, Spinner } from '@/components/ui';
import { BenchTaskCard } from '@/components/BenchTaskCard';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import { agruparPorAtividade, tarefasDaBancada, type GrupoAtividade } from '@/lib/format';
import { useAgendas, usePlantas } from '@/lib/queries';
import { errorMessage } from '@/lib/api';

const ESTACAO_DICA: Record<string, string> = {
  verao: 'Verão: atenção redobrada à rega nos dias quentes — prefira o início da manhã.',
  outono: 'Outono: reduza a adubação nitrogenada e prepare as plantas para o repouso.',
  inverno: 'Inverno: regas mais espaçadas e proteção das espécies sensíveis ao frio.',
  primavera: 'Primavera: época de brotação — bom momento para transplantes e adubação.',
};

/** Estação no hemisfério sul (o app é usado no Brasil). */
function estacaoAtual() {
  const m = new Date().getMonth();
  if (m === 11 || m <= 1) return 'verao';
  if (m <= 4) return 'outono';
  if (m <= 7) return 'inverno';
  return 'primavera';
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Bancada de trabalho: atrasadas + próximas tarefas, agrupadas por tipo de cuidado. */
export function BancadaPage() {
  const { user } = useAuth();
  const { registrarCuidado } = useCare();
  const agendas = useAgendas();
  const plantas = usePlantas();

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const { atrasadas, proximas } = tarefasDaBancada(agendas.data ?? []);
  const semPlantas = plantas.data?.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="pb-2 pt-6">
        <p className="text-sm text-muted">{saudacao()}{nome && `, ${nome}`}</p>
        <h1 className="text-3xl font-semibold">Bancada</h1>
      </header>

      {agendas.isLoading || plantas.isLoading ? (
        <Spinner />
      ) : agendas.isError ? (
        <ErrorState text={errorMessage(agendas.error)} onRetry={() => agendas.refetch()} />
      ) : semPlantas ? (
        <EmptyState
          title="Adicione sua primeira planta"
          text="Cadastre seus bonsais para acompanhar tarefas, cuidados e fotos."
          action={
            <Link to="/plantas/nova">
              <Button>Adicionar planta</Button>
            </Link>
          }
        />
      ) : (
        <>
          {atrasadas.length > 0 && (
            <section>
              <SectionTitle tone="danger">Atrasadas · {atrasadas.length}</SectionTitle>
              <Grupos grupos={agruparPorAtividade(atrasadas)} />
            </section>
          )}

          <section>
            <SectionTitle>Próximas tarefas</SectionTitle>
            {proximas.length > 0 ? (
              <Grupos grupos={agruparPorAtividade(proximas)} />
            ) : atrasadas.length === 0 ? (
              <div className="card flex items-center gap-3 p-4">
                <PartyPopper className="shrink-0 text-primary" size={24} />
                <p className="text-sm">
                  <span className="font-semibold">Nada pendente nos próximos dias.</span>{' '}
                  <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma tarefa nos próximos 7 dias.</p>
            )}
          </section>

          <section className="mt-6 rounded-2xl bg-accent-light p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Dica da estação</p>
            <p className="mt-1 text-sm text-ink">{ESTACAO_DICA[estacaoAtual()]}</p>
          </section>

          <Button variant="secondary" block className="mt-4" onClick={() => registrarCuidado()}>
            <CalendarCheck size={18} /> Registrar cuidado sem agendamento
          </Button>
        </>
      )}
    </div>
  );
}

function Grupos({ grupos }: { grupos: GrupoAtividade[] }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <div key={g.atividadeId}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">
              {g.nome} <span className="text-muted">· {g.agendas.length}</span>
            </h3>
            {g.agendas.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/concluir?ids=${g.agendas.map((a) => a.id).join(',')}`)}
              >
                <CheckCheck size={16} /> Concluir grupo
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {g.agendas.map((a) => (
              <BenchTaskCard key={a.id} agenda={a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Remover `TodayPage.tsx` e `agruparTarefas`** de `format.ts` (confirmar com `grep -rn "agruparTarefas\|TodayPage" web/src` que não há mais usos).

- [ ] **Step 4: `App.tsx`** — trocar import/uso de `TodayPage` por `BancadaPage`:
```tsx
import { BancadaPage } from '@/pages/BancadaPage';
...
          <Route index element={<BancadaPage />} />
```

- [ ] **Step 5: `Layout.tsx`** — aba:
```tsx
import { CalendarCheck, CalendarPlus, ClipboardList, Leaf, Plus, Sprout, User } from 'lucide-react';
...
  { to: '/', label: 'Bancada', icon: ClipboardList, end: true },
```
(remover `Sun` do import).

- [ ] **Step 6: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros.

- [ ] **Step 7: Commit**
```
feat(web): bancada de trabalho agrupada por atividade substitui a tela Hoje
```

---

### Task 8: Web — Preferência de revisão automática no Perfil

**Files:**
- Modify: `web/src/pages/ProfilePages.tsx`

**Interfaces:**
- Consumes: `usePreferencias`, `useRevisaoDias`, `preferenciasApi.set`, `keys.preferencias`.

- [ ] **Step 1: Componente** — adicionar em `ProfilePages.tsx`:

```tsx
const OPCOES_REVISAO = [
  { valor: '0', label: 'Desligada' },
  { valor: '15', label: '15 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '60', label: '60 dias' },
  { valor: '90', label: '90 dias' },
];

/** Intervalo da Revisão geral criada quando uma conclusão não agenda nada. */
function RevisaoAutomatica() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const prefs = usePreferencias();
  const dias = useRevisaoDias();
  const [salvando, setSalvando] = useState(false);

  async function mudar(valor: string) {
    setSalvando(true);
    try {
      await preferenciasApi.set('revisao_automatica_dias', valor);
      await queryClient.invalidateQueries({ queryKey: keys.preferencias });
      toast('Preferência salva');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="card mt-4 p-4">
      <Field
        label="Revisão automática"
        hint="Ao concluir uma tarefa sem agendar próximos passos, cria uma Revisão geral para não esquecer da planta."
      >
        <select
          className="input"
          value={String(dias)}
          disabled={prefs.isLoading || salvando}
          onChange={(e) => mudar(e.target.value)}
        >
          {!OPCOES_REVISAO.some((o) => o.valor === String(dias)) && <option value={String(dias)}>{dias} dias</option>}
          {OPCOES_REVISAO.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </section>
  );
}
```
Imports: adicionar `useQueryClient` (de `@tanstack/react-query`, junto de `useQuery`), `preferenciasApi` (endpoints), `usePreferencias`, `useRevisaoDias` (queries). Renderizar `<RevisaoAutomatica />` em `ProfilePage` entre o `</section>` do cartão de perfil e o `<nav>`.

- [ ] **Step 2: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Commit**
```
feat(web): preferência de revisão automática no perfil
```

---

### Task 9: Verificação final

- [ ] **Step 1:** `cd server && npm test && npm run build` — tudo verde.
- [ ] **Step 2:** `cd web && npm run build && npm run lint` — sem erros.
- [ ] **Step 3:** Se houver DB local (Docker): `docker compose up --build`, `cd server && npm run seed`, `cd web && npm run dev` e validar no navegador (viewport mobile ~400px):
  - Bancada mostra Atrasadas/Próximas tarefas agrupadas, foto grande + ID;
  - "Concluir grupo" abre `/concluir` com todas marcadas; desmarcar uma e ajustar outra funciona;
  - Concluir sem próximos passos → toast de Revisão geral; ela aparece na bancada/planta em 30 dias;
  - `/tarefas/:id` mostra histórico horizontal centralizado na atual, ícone de obs. abre o texto;
  - Perfil → Revisão automática "Desligada" → concluir não cria revisão.
- [ ] **Step 4:** Reportar resultado ao usuário (incluindo o que não pôde ser verificado). Lembrar que em produção é preciso rodar a migration (`prisma migrate deploy`) e, opcionalmente, o seed.
