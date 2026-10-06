# Pré-transplante — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plantas com Transplante agendado entram sozinhas no grupo Pré-transplante X dias antes (preferência, padrão 30); feito o transplante (Registrar ou Concluir), vão para Recém transplantada e depois voltam ao grupo de antes do Pré-transplante.

**Architecture:** Novo valor `PRE_TRANSPLANTE` no enum + marcador `Planta.preTransplanteAgendaId`. Regra pura `planejarPreTransplante` em `planta/dominio/grupo.ts`, aplicada na leitura (`GET /plantas`, `GET /plantas/:id`) por um helper que também resolve a Recém transplantada vencida. Concluir ganha `moverRecemTransplantada`, reusando a lógica do Registrar extraída para um helper.

**Tech Stack:** Express + Prisma + Zod + Jest (ts-jest) no `server/`; React + Vite + TanStack Query + Tailwind v4 no `web/`.

**Spec:** `docs/superpowers/specs/2026-10-06-pre-transplante-design.md` (continua `docs/superpowers/specs/2026-10-06-grupos-de-plantas-design.md`)

## Global Constraints

- Idioma do código, comentários, UI e commits: **português**.
- Migração **só aditiva**.
- Preferência `pre_transplante_dias`: padrão **30**, inteiro entre **1 e 365**; opções no Perfil **15/30/45/60**.
- Atividade de transplante: exatamente `'Transplante'` (`ATIVIDADE_TRANSPLANTE` em `server/src/modules/agenda/agenda.types.ts`).
- O usuário **não** pode escolher `PRE_TRANSPLANTE` à mão: o `GrupoPlantaEnum` de `server/src/modules/planta/planta.schema.ts` continua só com os 4 grupos manuais.
- `@prisma/client` é mockado em `server/src/test/setup.ts` → `import type` para `GrupoPlanta`, literais de string em runtime.
- Interface de repositório com método novo ⇒ adicionar `jest.fn()` em todos os mocks existentes (ts-jest checa tipos).
- Docker no Windows não recarrega: após mudar `server/`, `docker restart bonsai_api`.
- Branch `develop`. Não fazer stage de `docs/problemas_encontrados.md`. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Banco + regras puras do Pré-transplante

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20261006180000_pre_transplante/migration.sql`
- Modify: `server/src/modules/planta/dominio/grupo.ts`
- Test: `server/src/modules/planta/dominio/grupo.test.ts`

**Interfaces:**
- Produces (em `grupo.ts`):
  - `PRE_TRANSPLANTE: GrupoPlanta` (`'PRE_TRANSPLANTE'`), `PRE_TRANSPLANTE_PADRAO_DIAS = 30`
  - `diasDePreTransplante(valor: string | null | undefined): number`
  - `interface PlantaPre { plantaId: string; grupo: GrupoPlanta | null; grupoAnterior: GrupoPlanta | null; preTransplanteAgendaId: string | null }`
  - `interface TransplantePendente { plantaId: string; agendaId: string; dataAgendada: Date }`
  - `planejarPreTransplante(plantas: PlantaPre[], pendentes: TransplantePendente[], agora: Date, dias: number): PlantaPre[]` (só as plantas que mudam, com o estado novo)
  - `aplicarTransplante` passa a manter `grupoAnterior` também quando o grupo atual é `PRE_TRANSPLANTE`.

- [ ] **Step 1: Schema + migração**

Em `enum GrupoPlanta`, adicionar `PRE_TRANSPLANTE` como **primeiro** valor. Em `model Planta`, após `grupoExpiraEm`:

```prisma
  /// Agendamento de Transplante que já colocou a planta no Pré-transplante (impede reentrada pelo mesmo).
  preTransplanteAgendaId String?
```

`server/prisma/migrations/20261006180000_pre_transplante/migration.sql`:

```sql
-- Grupo automático Pré-transplante (entra X dias antes de um Transplante agendado)
ALTER TYPE "GrupoPlanta" ADD VALUE 'PRE_TRANSPLANTE' BEFORE 'RECEM_TRANSPLANTADA';

ALTER TABLE "Planta" ADD COLUMN "preTransplanteAgendaId" TEXT;
```

Run: `docker compose exec api npx prisma migrate deploy`, `cd server && npm run prisma:generate`, `docker compose exec api npx prisma migrate status` → "Database schema is up to date".

- [ ] **Step 2: Testes (acrescentar em `grupo.test.ts`)**

Ajustar o import do topo para:

```ts
import {
  aplicarTransplante,
  diasDePreTransplante,
  diasDeTransplante,
  planejarPreTransplante,
  trocaManual,
  PRE_TRANSPLANTE_PADRAO_DIAS,
  TRANSPLANTE_PADRAO_DIAS,
  type PlantaPre,
} from './grupo';
```

e acrescentar:

```ts
describe('aplicarTransplante a partir do Pré-transplante', () => {
  it('mantém o grupo de antes do Pré-transplante como retorno', () => {
    expect(aplicarTransplante({ grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', grupoExpiraEm: null }, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'REFINAMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });
});

describe('diasDePreTransplante', () => {
  it('padrão 30 e limite 1–365', () => {
    expect(diasDePreTransplante(undefined)).toBe(PRE_TRANSPLANTE_PADRAO_DIAS);
    expect(diasDePreTransplante('x')).toBe(30);
    expect(diasDePreTransplante('45')).toBe(45);
    expect(diasDePreTransplante('0')).toBe(1);
    expect(diasDePreTransplante('999')).toBe(365);
  });
});

describe('planejarPreTransplante', () => {
  const planta = (p: Partial<PlantaPre> = {}): PlantaPre => ({
    plantaId: 'p1',
    grupo: 'REFINAMENTO',
    grupoAnterior: null,
    preTransplanteAgendaId: null,
    ...p,
  });
  const pendente = (dias: number, agendaId = 'ag-1', plantaId = 'p1') => ({
    plantaId,
    agendaId,
    dataAgendada: new Date(DATA.getTime() + dias * DIA),
  });

  it('entra no Pré-transplante quando o transplante está dentro do prazo', () => {
    expect(planejarPreTransplante([planta()], [pendente(20)], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', preTransplanteAgendaId: 'ag-1' },
    ]);
  });

  it('transplante atrasado também conta; sem grupo guarda null', () => {
    expect(planejarPreTransplante([planta({ grupo: null })], [pendente(-2)], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: null, preTransplanteAgendaId: 'ag-1' },
    ]);
  });

  it('não entra se o transplante está além do prazo', () => {
    expect(planejarPreTransplante([planta()], [pendente(31)], DATA, 30)).toEqual([]);
  });

  it('não entra pelo mesmo agendamento depois de uma troca manual', () => {
    expect(planejarPreTransplante([planta({ preTransplanteAgendaId: 'ag-1' })], [pendente(5)], DATA, 30)).toEqual([]);
  });

  it('um agendamento novo coloca de novo', () => {
    expect(planejarPreTransplante([planta({ preTransplanteAgendaId: 'ag-velho' })], [pendente(5, 'ag-novo')], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', preTransplanteAgendaId: 'ag-novo' },
    ]);
  });

  it('Recém transplantada não entra', () => {
    expect(planejarPreTransplante([planta({ grupo: 'RECEM_TRANSPLANTADA' })], [pendente(5)], DATA, 30)).toEqual([]);
  });

  it('usa o transplante mais cedo da planta', () => {
    expect(planejarPreTransplante([planta()], [pendente(25, 'ag-b'), pendente(10, 'ag-a')], DATA, 30)[0].preTransplanteAgendaId).toBe('ag-a');
  });

  it('sem transplante no prazo, volta ao grupo de antes', () => {
    const pre = planta({ grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'EM_CRESCIMENTO', preTransplanteAgendaId: 'ag-1' });
    expect(planejarPreTransplante([pre], [], DATA, 30)).toEqual([
      { plantaId: 'p1', grupo: 'EM_CRESCIMENTO', grupoAnterior: null, preTransplanteAgendaId: null },
    ]);
    expect(planejarPreTransplante([pre], [pendente(60)], DATA, 30)[0].grupo).toBe('EM_CRESCIMENTO');
  });

  it('continua no Pré-transplante com o mesmo agendamento; troca só o marcador se mudou', () => {
    const pre = planta({ grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'EM_CRESCIMENTO', preTransplanteAgendaId: 'ag-1' });
    expect(planejarPreTransplante([pre], [pendente(3)], DATA, 30)).toEqual([]);
    expect(planejarPreTransplante([pre], [pendente(3, 'ag-2')], DATA, 30)).toEqual([{ ...pre, preTransplanteAgendaId: 'ag-2' }]);
  });

  it('pendentes de outras plantas não contam', () => {
    expect(planejarPreTransplante([planta()], [pendente(5, 'ag-x', 'p2')], DATA, 30)).toEqual([]);
  });
});
```

Run: `cd server && npm test -- grupo.test` → FAIL (exports inexistentes).

- [ ] **Step 3: Implementar em `grupo.ts`**

Substituir `diasDeTransplante` por uma versão baseada num helper e acrescentar o resto:

```ts
const DIA_MS = 86_400_000;

export const PRE_TRANSPLANTE: GrupoPlanta = 'PRE_TRANSPLANTE';
export const PRE_TRANSPLANTE_PADRAO_DIAS = 30;

/** Preferência numérica de dias → inteiro entre 1 e 365 (inválido = padrão). */
function limitarDias(valor: string | null | undefined, padrao: number): number {
  const dias = valor ? parseInt(valor, 10) : NaN;
  if (Number.isNaN(dias)) return padrao;
  return Math.min(365, Math.max(1, dias));
}

/** Preferência `transplante_dias` → dias em Recém transplantada (1–365, padrão 15). */
export const diasDeTransplante = (valor: string | null | undefined) => limitarDias(valor, TRANSPLANTE_PADRAO_DIAS);

/** Preferência `pre_transplante_dias` → dias antes do Transplante agendado (1–365, padrão 30). */
export const diasDePreTransplante = (valor: string | null | undefined) => limitarDias(valor, PRE_TRANSPLANTE_PADRAO_DIAS);
```

Em `aplicarTransplante`, trocar a linha do `grupoAnterior` e o literal de dias:

```ts
  // Já em Pré-transplante ou Recém transplantada: o grupo de retorno continua o original
  const grupoAnterior =
    estado.grupo === RECEM_TRANSPLANTADA || estado.grupo === PRE_TRANSPLANTE ? estado.grupoAnterior : estado.grupo;
  return { grupo: RECEM_TRANSPLANTADA, grupoAnterior, grupoExpiraEm: new Date(data.getTime() + dias * DIA_MS) };
```

No fim do arquivo:

```ts
export interface PlantaPre {
  plantaId: string;
  grupo: GrupoPlanta | null;
  grupoAnterior: GrupoPlanta | null;
  /** Agendamento que já colocou a planta no Pré-transplante. */
  preTransplanteAgendaId: string | null;
}

export interface TransplantePendente {
  plantaId: string;
  agendaId: string;
  dataAgendada: Date;
}

/** Entradas e saídas automáticas do Pré-transplante (só as plantas que mudam, com o estado novo). */
export function planejarPreTransplante(
  plantas: PlantaPre[],
  pendentes: TransplantePendente[],
  agora: Date,
  dias: number,
): PlantaPre[] {
  // Transplante pendente mais cedo de cada planta dentro do prazo (atrasados incluídos)
  const limite = agora.getTime() + dias * DIA_MS;
  const proximaDe = new Map<string, TransplantePendente>();
  for (const p of pendentes) {
    if (p.dataAgendada.getTime() > limite) continue;
    const atual = proximaDe.get(p.plantaId);
    if (!atual || p.dataAgendada < atual.dataAgendada) proximaDe.set(p.plantaId, p);
  }

  return plantas.flatMap((pl): PlantaPre[] => {
    const proxima = proximaDe.get(pl.plantaId);
    if (pl.grupo === PRE_TRANSPLANTE) {
      // Transplante cancelado, apagado, feito ou remarcado para longe: volta ao grupo de antes
      if (!proxima) return [{ plantaId: pl.plantaId, grupo: pl.grupoAnterior, grupoAnterior: null, preTransplanteAgendaId: null }];
      return proxima.agendaId === pl.preTransplanteAgendaId ? [] : [{ ...pl, preTransplanteAgendaId: proxima.agendaId }];
    }
    // Recém transplantada não entra; o mesmo agendamento não coloca de novo (troca manual)
    if (pl.grupo === RECEM_TRANSPLANTADA || !proxima || proxima.agendaId === pl.preTransplanteAgendaId) return [];
    return [{ plantaId: pl.plantaId, grupo: PRE_TRANSPLANTE, grupoAnterior: pl.grupo, preTransplanteAgendaId: proxima.agendaId }];
  });
}
```

- [ ] **Step 4: Testes passam**

Run: `cd server && npm test -- grupo.test` → PASS; `cd server && npm test` → tudo verde.

- [ ] **Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/20261006180000_pre_transplante server/src/modules/planta/dominio
git commit -m "feat(api): grupo Pré-transplante (enum, marcador e regras puras)"
```

---

### Task 2: Pré-transplante aplicado na leitura das plantas

**Files:**
- Create: `server/src/modules/planta/use-cases/atualizar-grupos-automaticos.ts`
- Test: `server/src/modules/planta/use-cases/atualizar-grupos-automaticos.test.ts`
- Modify: `server/src/modules/planta/types/planta.types.ts`, `server/src/modules/planta/repositories/prisma-planta.repository.ts`, `server/src/modules/planta/use-cases/get-plantas-by-user.use-case.ts`, `server/src/modules/planta/use-cases/get-planta-by-id.use-case.ts`, `server/src/modules/agenda/agenda.types.ts`
- Test: mocks dos 5 `*.use-case.test.ts` de `server/src/modules/planta/use-cases/`

**Interfaces:**
- Consumes: `planejarPreTransplante`, `diasDePreTransplante`, `PlantaPre`, `TransplantePendente` (Task 1).
- Produces:
  - `PREF_PRE_TRANSPLANTE_DIAS = 'pre_transplante_dias'` em `agenda.types.ts`
  - `PlantaRepository.estadoPreTransplante(usuarioId: string): Promise<{ dias: number; plantas: PlantaPre[]; pendentes: TransplantePendente[] }>`
  - `PlantaRepository.aplicarMudancasPre(mudancas: PlantaPre[]): Promise<void>`
  - `atualizarGruposAutomaticos(repo: PlantaRepository, usuarioId: string, agora: Date): Promise<void>`
  - `PlantaWithEspecie.preTransplanteAgendaId?: string | null`

- [ ] **Step 1: Mocks existentes**

Nos 5 testes de use case de planta, no objeto `mockPlantaRepository`, após `resolverGruposVencidos: ...`:

```ts
      estadoPreTransplante: jest.fn().mockResolvedValue({ dias: 30, plantas: [], pendentes: [] }),
      aplicarMudancasPre: jest.fn().mockResolvedValue(undefined),
```

- [ ] **Step 2: Teste do helper** (`atualizar-grupos-automaticos.test.ts`)

```ts
import { atualizarGruposAutomaticos } from './atualizar-grupos-automaticos';
import { PlantaRepository } from '../types/planta.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-06T12:00:00.000Z');

describe('atualizarGruposAutomaticos', () => {
  let repo: jest.Mocked<PlantaRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      findUrlsDeMidia: jest.fn(),
      resolverGruposVencidos: jest.fn().mockResolvedValue(undefined),
      estadoPreTransplante: jest.fn().mockResolvedValue({ dias: 30, plantas: [], pendentes: [] }),
      aplicarMudancasPre: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('resolve a Recém transplantada vencida antes de calcular o Pré-transplante', async () => {
    await atualizarGruposAutomaticos(repo, 'user-1', AGORA);

    expect(repo.resolverGruposVencidos).toHaveBeenCalledWith('user-1', AGORA);
    expect(repo.estadoPreTransplante).toHaveBeenCalledWith('user-1');
    expect(repo.resolverGruposVencidos.mock.invocationCallOrder[0]).toBeLessThan(
      repo.estadoPreTransplante.mock.invocationCallOrder[0],
    );
  });

  it('grava as mudanças do Pré-transplante', async () => {
    repo.estadoPreTransplante.mockResolvedValue({
      dias: 30,
      plantas: [{ plantaId: 'p1', grupo: 'REFINAMENTO', grupoAnterior: null, preTransplanteAgendaId: null }],
      pendentes: [{ plantaId: 'p1', agendaId: 'ag-1', dataAgendada: new Date(AGORA.getTime() + 10 * DIA) }],
    });

    await atualizarGruposAutomaticos(repo, 'user-1', AGORA);

    expect(repo.aplicarMudancasPre).toHaveBeenCalledWith([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', preTransplanteAgendaId: 'ag-1' },
    ]);
  });

  it('sem mudanças, não grava nada', async () => {
    await atualizarGruposAutomaticos(repo, 'user-1', AGORA);

    expect(repo.aplicarMudancasPre).not.toHaveBeenCalled();
  });
});
```

Nos testes existentes de `get-plantas-by-user` e `get-planta-by-id` que conferem `resolverGruposVencidos`, nada muda (o helper continua chamando-o). Acrescentar em `get-plantas-by-user.use-case.test.ts`:

```ts
    it('calcula o Pré-transplante antes de listar', async () => {
      mockPlantaRepository.findManyByUser.mockResolvedValue([]);

      await getPlantasByUserUseCase.execute(usuarioId);

      expect(mockPlantaRepository.estadoPreTransplante).toHaveBeenCalledWith(usuarioId);
      expect(mockPlantaRepository.estadoPreTransplante.mock.invocationCallOrder[0]).toBeLessThan(
        mockPlantaRepository.findManyByUser.mock.invocationCallOrder[0],
      );
    });
```

Run: `cd server && npm test -- planta` → FAIL (tipos/módulo inexistentes).

- [ ] **Step 3: Tipos**

`agenda.types.ts`, após `PREF_TRANSPLANTE_DIAS`:

```ts
export const PREF_PRE_TRANSPLANTE_DIAS = 'pre_transplante_dias';
```

`planta.types.ts`: importar `import type { PlantaPre, TransplantePendente } from '../dominio/grupo';`; em `PlantaWithEspecie`, após `grupoExpiraEm?`, `preTransplanteAgendaId?: string | null;`; em `PlantaRepository`, após `resolverGruposVencidos`:

```ts
  /** Dias da preferência, Transplantes pendentes e plantas candidatas (em Pré-transplante ou com Transplante pendente). */
  estadoPreTransplante(usuarioId: string): Promise<{ dias: number; plantas: PlantaPre[]; pendentes: TransplantePendente[] }>;
  aplicarMudancasPre(mudancas: PlantaPre[]): Promise<void>;
```

- [ ] **Step 4: Helper**

`atualizar-grupos-automaticos.ts`:

```ts
import { PlantaRepository } from '../types/planta.types';
import { planejarPreTransplante } from '../dominio/grupo';

/** Grupos automáticos, resolvidos na leitura: Recém transplantada vencida volta; Pré-transplante entra/sai pelos agendamentos. */
export async function atualizarGruposAutomaticos(repo: PlantaRepository, usuarioId: string, agora: Date): Promise<void> {
  await repo.resolverGruposVencidos(usuarioId, agora);
  const { dias, plantas, pendentes } = await repo.estadoPreTransplante(usuarioId);
  const mudancas = planejarPreTransplante(plantas, pendentes, agora, dias);
  if (mudancas.length) await repo.aplicarMudancasPre(mudancas);
}
```

`get-plantas-by-user.use-case.ts` e `get-planta-by-id.use-case.ts`: trocar `await this.plantaRepository.resolverGruposVencidos(usuarioId, new Date());` por `await atualizarGruposAutomaticos(this.plantaRepository, usuarioId, new Date());` (importando de `./atualizar-grupos-automaticos`).

- [ ] **Step 5: Repositório**

Em `prisma-planta.repository.ts`: importar `import { ATIVIDADE_TRANSPLANTE, PREF_PRE_TRANSPLANTE_DIAS } from '../../agenda/agenda.types';` e `import { diasDePreTransplante, PlantaPre } from '../dominio/grupo';`; adicionar `preTransplanteAgendaId: true,` ao `SELECT_PLANTA` (após `grupoExpiraEm`); e os métodos:

```ts
  async estadoPreTransplante(usuarioId: string) {
    const [pref, pendentes] = await Promise.all([
      this.prisma.preferenciaUsuario.findUnique({
        where: { usuarioId_chave: { usuarioId, chave: PREF_PRE_TRANSPLANTE_DIAS } },
      }),
      this.prisma.agenda.findMany({
        where: { status: 'PENDENTE', atividade: { nome: ATIVIDADE_TRANSPLANTE }, planta: { usuarioId } },
        select: { id: true, plantaId: true, dataAgendada: true },
      }),
    ]);
    const plantas = await this.prisma.planta.findMany({
      where: { usuarioId, OR: [{ grupo: 'PRE_TRANSPLANTE' }, { id: { in: [...new Set(pendentes.map((p) => p.plantaId))] } }] },
      select: { id: true, grupo: true, grupoAnterior: true, preTransplanteAgendaId: true },
    });
    return {
      dias: diasDePreTransplante(pref?.valor),
      plantas: plantas.map(({ id, ...g }) => ({ plantaId: id, ...g })),
      pendentes: pendentes.map((p) => ({ plantaId: p.plantaId, agendaId: p.id, dataAgendada: p.dataAgendada })),
    };
  }

  async aplicarMudancasPre(mudancas: PlantaPre[]): Promise<void> {
    await this.prisma.$transaction(
      mudancas.map((m) =>
        this.prisma.planta.update({
          where: { id: m.plantaId },
          data: { grupo: m.grupo, grupoAnterior: m.grupoAnterior, preTransplanteAgendaId: m.preTransplanteAgendaId },
        }),
      ),
    );
  }
```

Não mexer em `planta.schema.ts` (o `GrupoPlantaEnum` sem `PRE_TRANSPLANTE` é proposital) nem em `trocaManual` (não toca `preTransplanteAgendaId`).

- [ ] **Step 6: Testes + build**

Run: `cd server && npm test` e `cd server && npm run build` → verdes.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/planta server/src/modules/agenda/agenda.types.ts
git commit -m "feat(api): Pré-transplante entra e sai sozinho na leitura das plantas"
```

---

### Task 3: Concluir tarefa de Transplante move para Recém transplantada

**Files:**
- Create: `server/src/modules/agenda/use-cases/planejar-grupos-transplante.ts`
- Modify: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.ts`, `server/src/modules/agenda/use-cases/concluir-agendas.use-case.ts`, `server/src/modules/agenda/agenda.types.ts`, `server/src/modules/agenda/agenda.schema.ts` (`concluirAgendasSchema`), `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts` (`executar`)
- Test: `server/src/modules/agenda/use-cases/concluir-agendas.use-case.test.ts`

**Interfaces:**
- Consumes: `ConclusaoRepository.transplanteDasPlantas`, `AtualizacaoGrupo`, `aplicarTransplante` (já existem).
- Produces:
  - `planejarGruposDoTransplante(repo: Pick<ConclusaoRepository, 'transplanteDasPlantas'>, cuidados: { plantaId: string; atividadeIds: string[] }[], usuarioId: string, data: Date): Promise<AtualizacaoGrupo[]>`
  - `ConcluirAgendasDTO.moverRecemTransplantada?: boolean`
  - `PlanoConclusao.atualizarGrupos: AtualizacaoGrupo[]`

- [ ] **Step 1: Testes** (em `concluir-agendas.use-case.test.ts`, dentro do `describe`)

```ts
  describe('mover para Recém transplantada', () => {
    const estado = { plantaId: 'pl-1', grupo: 'PRE_TRANSPLANTE' as const, grupoAnterior: 'REFINAMENTO' as const, grupoExpiraEm: null };

    beforeEach(() => {
      repo.transplanteDasPlantas.mockResolvedValue({ atividadeId: 'at-transplante', dias: 15, plantas: [estado] });
    });

    const esperado = [
      { plantaId: 'pl-1', grupo: 'RECEM_TRANSPLANTADA', grupoAnterior: 'REFINAMENTO', grupoExpiraEm: emDias(15) },
    ];

    it('tarefa de Transplante concluída com a opção move a planta', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-transplante', rotinaId: null }]);

      await useCase.execute({ ...base, moverRecemTransplantada: true }, 'user-1');

      expect(repo.transplanteDasPlantas).toHaveBeenCalledWith(['pl-1'], 'user-1');
      expect(plano().atualizarGrupos).toEqual(esperado);
    });

    it('vale quando a tarefa é concluída como Transplante ou com Transplante nos extras', async () => {
      await useCase.execute({ ...base, atividadeId: 'at-transplante', moverRecemTransplantada: true }, 'user-1');
      expect(plano().atualizarGrupos).toEqual(esperado);

      repo.executar.mockClear();
      await useCase.execute({ ...base, extras: ['at-transplante'], moverRecemTransplantada: true }, 'user-1');
      expect(plano().atualizarGrupos).toEqual(esperado);
    });

    it('outra atividade não move', async () => {
      await useCase.execute({ ...base, moverRecemTransplantada: true }, 'user-1');

      expect(plano().atualizarGrupos).toEqual([]);
    });

    it('sem a opção, não consulta nem move', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([{ id: 'ag-1', plantaId: 'pl-1', atividadeId: 'at-transplante', rotinaId: null }]);

      await useCase.execute(base, 'user-1');

      expect(repo.transplanteDasPlantas).not.toHaveBeenCalled();
      expect(plano().atualizarGrupos).toEqual([]);
    });
  });
```

Run: `cd server && npm test -- concluir-agendas` → FAIL (tipos).

- [ ] **Step 2: Helper compartilhado**

`planejar-grupos-transplante.ts` (mover o corpo do método privado `gruposDoTransplante` do Registrar):

```ts
import { aplicarTransplante } from '../../planta/dominio/grupo';
import { AtualizacaoGrupo, ConclusaoRepository } from '../agenda.types';

/** Plantas com Transplante entre os cuidados vão para Recém transplantada (prazo da preferência). */
export async function planejarGruposDoTransplante(
  repo: Pick<ConclusaoRepository, 'transplanteDasPlantas'>,
  cuidados: { plantaId: string; atividadeIds: string[] }[],
  usuarioId: string,
  data: Date,
): Promise<AtualizacaoGrupo[]> {
  const { atividadeId, dias, plantas } = await repo.transplanteDasPlantas(
    cuidados.map((c) => c.plantaId),
    usuarioId,
  );
  if (!atividadeId) return [];
  const transplantadas = new Set(cuidados.filter((c) => c.atividadeIds.includes(atividadeId)).map((c) => c.plantaId));
  return plantas
    .filter((p) => transplantadas.has(p.plantaId))
    .map((p) => ({ plantaId: p.plantaId, ...aplicarTransplante(p, data, dias) }));
}
```

Em `registrar-cuidados.use-case.ts`: remover o método `gruposDoTransplante` e o import de `aplicarTransplante`; trocar a chamada por `await planejarGruposDoTransplante(this.repo, cuidados, usuarioId, data)`; importar o helper; tirar `AtualizacaoGrupo` do import se ficar sem uso. Os testes do Registrar devem continuar passando sem mudança.

- [ ] **Step 3: Tipos, schema e use case do Concluir**

`agenda.types.ts`: em `ConcluirAgendasDTO`, após `itens`:

```ts
  /** Tarefas concluídas como Transplante levam a planta para Recém transplantada. */
  moverRecemTransplantada?: boolean;
```

Em `PlanoConclusao`, após `moverPendentes`:

```ts
  /** Mudanças de grupo (Transplante → Recém transplantada). */
  atualizarGrupos: AtualizacaoGrupo[];
```

`agenda.schema.ts`, em `concluirAgendasSchema.body`, junto dos outros campos opcionais: `moverRecemTransplantada: z.boolean().optional(),`.

`concluir-agendas.use-case.ts`: importar `planejarGruposDoTransplante`; antes de `const plano`:

```ts
    // Atividade efetiva de cada tarefa (a escolhida na tela ou a original) + extras
    const atualizarGrupos = dto.moverRecemTransplantada
      ? await planejarGruposDoTransplante(
          this.repo,
          plantas.map((plantaId) => ({
            plantaId,
            atividadeIds: [
              ...pendentes.filter((p) => p.plantaId === plantaId).map((p) => dto.atividadeId ?? p.atividadeId),
              ...extras,
            ],
          })),
          usuarioId,
          dataConcluida,
        )
      : [];
```

e no objeto `plano`, após `moverPendentes: revisoes.mover,`: `atualizarGrupos,`.

- [ ] **Step 4: Repositório**

Em `prisma-conclusao.repository.ts`, `executar`, logo após `await this.moverPendentes(tx, plano.moverPendentes);`, o mesmo laço que já existe em `registrar`:

```ts
        for (const g of plano.atualizarGrupos) {
          await tx.planta.update({
            where: { id: g.plantaId },
            data: { grupo: g.grupo, grupoAnterior: g.grupoAnterior, grupoExpiraEm: g.grupoExpiraEm },
          });
        }
```

Extraia esse laço para um método privado `atualizarGrupos(tx, itens)` e use-o nos dois lugares (`registrar` e `executar`) para não duplicar.

- [ ] **Step 5: Testes + build**

Run: `cd server && npm test` e `cd server && npm run build` → verdes.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/agenda
git commit -m "feat(api): concluir Transplante agendado move a planta para Recém transplantada"
```

---

### Task 4: Web — Pré-transplante nas telas, Perfil e Concluir

**Files:**
- Modify: `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/main.tsx`, `web/src/components/GrupoChips.tsx`, `web/src/pages/EditPlantPage.tsx`, `web/src/pages/PlantDetailPage.tsx`, `web/src/pages/ProfilePages.tsx`, `web/src/pages/ConcluirPage.tsx`

**Interfaces:**
- Consumes: API com `grupo: 'PRE_TRANSPLANTE'` e `preTransplanteAgendaId`; `POST /agendas/concluir` com `moverRecemTransplantada`; preferência `pre_transplante_dias`.

- [ ] **Step 1: Tipos e dados**

`types.ts`: `GrupoPlanta` ganha `'PRE_TRANSPLANTE'` (primeiro na união); `GRUPOS_PLANTA` ganha como **primeiro** item `{ value: 'PRE_TRANSPLANTE', label: 'Pré-transplante' },`; em `Planta`, após `grupoExpiraEm`, `preTransplanteAgendaId?: string | null;`; em `Preferencias`, `pre_transplante_dias?: string;`. Após `GRUPOS_PLANTA`:

```ts
/** Grupos que o usuário escolhe à mão (Pré-transplante é automático). */
export const GRUPOS_MANUAIS = GRUPOS_PLANTA.filter((g) => g.value !== 'PRE_TRANSPLANTE');
```

`endpoints.ts`: em `ConcluirInput`, após `itens`, `moverRecemTransplantada?: boolean;`.

`queries.ts`, após `useTransplanteDias`:

```ts
/** Dias antes de um Transplante agendado em que a planta entra no Pré-transplante (padrão 30, 1–365) — mesma regra do backend. */
export function usePreTransplanteDias() {
  const prefs = usePreferencias();
  const dias = parseInt(prefs.data?.pre_transplante_dias ?? '30', 10);
  return Number.isNaN(dias) ? 30 : Math.min(365, Math.max(1, dias));
}
```

`main.tsx`, logo após criar o `queryClient`:

```ts
// O Pré-transplante depende das tarefas: quando a lista de tarefas é invalidada, as plantas também são
queryClient.getQueryCache().subscribe((evento) => {
  if (evento.type === 'updated' && evento.action.type === 'invalidate' && evento.query.queryKey[0] === 'agendas') {
    queryClient.invalidateQueries({ queryKey: ['plantas'] });
  }
});
```

- [ ] **Step 2: Seletor, edição e detalhe**

`GrupoChips.tsx`: usar `GRUPOS_MANUAIS` no lugar de `GRUPOS_PLANTA` (import ajustado).

`EditPlantPage.tsx`, dentro do `<div>` do `GrupoChips`, após o parágrafo da expiração:

```tsx
          {p.grupo === 'PRE_TRANSPLANTE' && grupo === p.grupo && (
            <p className="mt-1.5 text-xs text-muted">
              Em Pré-transplante (automático, pelo transplante agendado). Escolher um grupo tira a planta dele.
            </p>
          )}
```

`PlantDetailPage.tsx`, na linha do grupo, após o trecho de `grupoExpiraEm`:

```tsx
                {p.grupo === 'PRE_TRANSPLANTE' && p.grupoAnterior && ` · antes: ${grupoLabel(p.grupoAnterior)}`}
```

- [ ] **Step 3: Perfil**

`ProfilePages.tsx`: adicionar

```tsx
const OPCOES_PRE_TRANSPLANTE = [
  { valor: '15', label: '15 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '45', label: '45 dias' },
  { valor: '60', label: '60 dias' },
];
```

e, após `TempoTransplante`:

```tsx
/** Quantos dias antes de um Transplante agendado a planta entra no Pré-transplante. */
function TempoPreTransplante() {
  return (
    <PreferenciaDias
      chave="pre_transplante_dias"
      dias={usePreTransplanteDias()}
      opcoes={OPCOES_PRE_TRANSPLANTE}
      label="Dias de Pré-transplante"
      hint="Com um Transplante agendado, a planta entra no grupo Pré-transplante este tempo antes da data. Feito o transplante, vai para Recém transplantada."
    />
  );
}
```

Importar `usePreTransplanteDias` e renderizar `<TempoPreTransplante />` logo antes de `<TempoTransplante />`.

- [ ] **Step 4: Concluir**

`ConcluirPage.tsx`: importar `ATIVIDADE_TRANSPLANTE` de `@/types`. Estado junto dos outros: `const [moverTransplante, setMoverTransplante] = useState(true);`. Após `const nomeAtividade = ...`:

```ts
  const transplanteId = atividades.data.find((a) => a.nome === ATIVIDADE_TRANSPLANTE)?.id;
  const comTransplante =
    !!transplanteId &&
    (marcadas.some((t) => (atividadeId || t.atividadeId) === transplanteId) || extras.includes(transplanteId));
```

Em `agendasApi.concluir({...})`, após `itens,`: `moverRecemTransplantada: comTransplante && moverTransplante ? true : undefined,`. Após `queryClient.invalidateQueries({ queryKey: ['fotos'] });`: `queryClient.invalidateQueries({ queryKey: keys.plantas });`. Logo antes de `<ProximosPassos value={proximos} onChange={setProximos} />`:

```tsx
        {comTransplante && (
          <label className="card flex cursor-pointer items-center gap-3 p-3">
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-primary"
              checked={moverTransplante}
              onChange={(e) => setMoverTransplante(e.target.checked)}
            />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Mover para Recém transplantadas</span>
              <span className="block text-xs text-muted">Depois do prazo (ajustável no Perfil) a planta volta ao grupo de antes.</span>
            </span>
          </label>
        )}
```

- [ ] **Step 5: Build e lint**

Run: `cd web && npm run build && npm run lint` → 0 erros.

- [ ] **Step 6: Commit**

```bash
git add web/src
git commit -m "feat(web): Pré-transplante nas telas, preferência no Perfil e opção ao concluir Transplante"
```

---

### Task 5: Verificação no navegador e documentação

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1:** `docker restart bonsai_api`; dev server do web rodando.
- [ ] **Step 2: Roteiro (conta local, iframe 390px)**
  1. Planta em Refinamento + agendar Transplante para daqui a 10 dias → Bancada "Por grupo" mostra o bloco Pré-transplante com ela; detalhe "Pré-transplante · antes: Refinamento".
  2. Agendar Transplante para daqui a 40 dias numa planta (prazo 30) → não entra; Perfil → 45 dias → entra.
  3. Editar a planta em Pré-transplante → texto do automático; escolher "Em crescimento" → fica em Em crescimento (não volta ao recarregar).
  4. Concluir a tarefa de Transplante pela Bancada → opção marcada → planta vai para Recém transplantada com retorno "Refinamento".
  5. Outra planta em Pré-transplante: apagar/cancelar o Transplante → volta ao grupo anterior.
  6. GrupoChips não oferece Pré-transplante; Coleção filtra por Pré-transplante.
- [ ] **Step 3:** No `CLAUDE.md`, na frase dos grupos fixos, acrescentar: ` Pré-transplante (`PRE_TRANSPLANTE`, automático): Transplante pendente a até `pre_transplante_dias` (padrão 30) põe a planta nele (`preTransplanteAgendaId` impede reentrada após troca manual) e ela sai quando não há mais transplante no prazo; `/concluir` também aceita `moverRecemTransplantada`.`
- [ ] **Step 4:** `cd server && npm test && npm run build`; `cd web && npm run build && npm run lint`.
- [ ] **Step 5:** Commit `docs: Pré-transplante no CLAUDE.md`.
