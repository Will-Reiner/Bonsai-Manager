# Grupos de plantas + Bancada com filtros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada planta pode estar em um de 4 grupos fixos (Recém transplantada, Debilitada, Em crescimento, Refinamento); registrar um Transplante move a planta para "Recém transplantada" por N dias (preferência, padrão 15) e depois ela volta ao grupo anterior; a Bancada passa a agrupar por grupos/tarefas/espécies e filtrar por período; a Coleção filtra por grupo.

**Architecture:** Enum Prisma `GrupoPlanta` + 3 colunas opcionais em `Planta`. Regras puras em `server/src/modules/planta/dominio/grupo.ts`. Expiração "lazy": `GET /plantas` roda um `UPDATE` que devolve plantas vencidas ao grupo anterior antes de ler. O registro (`POST /agendas/registrar`) recebe `moverRecemTransplantada` e aplica a regra na mesma transação. No web, a lógica da Bancada vai para `web/src/lib/bancada.ts` (pura) e a página só renderiza.

**Tech Stack:** Express + Prisma + Zod + Jest (ts-jest) no `server/`; React + Vite + TanStack Query + Tailwind v4 no `web/`.

**Spec:** `docs/superpowers/specs/2026-10-06-grupos-de-plantas-design.md`

## Global Constraints

- Idioma do código, comentários, UI e commits: **português**.
- Migração **só aditiva**; plantas existentes ficam com `grupo = null` ("Sem grupo").
- Preferência `transplante_dias`: padrão **15**, inteiro entre **1 e 365**.
- Nome da atividade de transplante: exatamente `'Transplante'` (seed em `server/prisma/seed.js:17`).
- `@prisma/client` é mockado em `server/src/test/setup.ts` (só `ModoAquisicao` existe em runtime nos testes) → no domínio, use **`import type`** para `GrupoPlanta` e literais de string em runtime.
- Toda interface de repositório que ganhar método novo exige adicionar `jest.fn()` nos mocks dos testes existentes (ts-jest checa tipos).
- Docker no Windows não recarrega: após mudar `server/`, `docker restart bonsai_api`.
- Testes no navegador: só a conta `testeclaude@bonsai.dev` (ou a conta local de teste); viewport mobile ~390px.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Trabalhar na branch `develop`.

---

### Task 1: Banco — enum `GrupoPlanta` e colunas em `Planta`

**Files:**
- Modify: `server/prisma/schema.prisma` (enums no topo; `model Planta`)
- Create: `server/prisma/migrations/20261006120000_grupos_plantas/migration.sql`

**Interfaces:**
- Produces: tipo Prisma `GrupoPlanta` (`'RECEM_TRANSPLANTADA' | 'DEBILITADA' | 'EM_CRESCIMENTO' | 'REFINAMENTO'`); campos `Planta.grupo`, `Planta.grupoAnterior` (`GrupoPlanta | null`), `Planta.grupoExpiraEm` (`Date | null`).

- [ ] **Step 1: Editar o schema**

Após `enum TipoMidia { ... }` adicionar:

```prisma
/// Grupos fixos de fase da planta (um por planta, opcional).
enum GrupoPlanta {
  RECEM_TRANSPLANTADA
  DEBILITADA
  EM_CRESCIMENTO
  REFINAMENTO
}
```

Em `model Planta`, logo após `historicoPublico Boolean @default(false)`:

```prisma
  grupo            GrupoPlanta?
  /// Grupo de retorno quando o período em RECEM_TRANSPLANTADA acabar.
  grupoAnterior    GrupoPlanta?
  /// Fim do período automático em RECEM_TRANSPLANTADA.
  grupoExpiraEm    DateTime?
```

- [ ] **Step 2: Criar a migração**

`server/prisma/migrations/20261006120000_grupos_plantas/migration.sql`:

```sql
-- Grupos fixos de plantas (opcional; plantas existentes ficam sem grupo)
CREATE TYPE "GrupoPlanta" AS ENUM ('RECEM_TRANSPLANTADA', 'DEBILITADA', 'EM_CRESCIMENTO', 'REFINAMENTO');

ALTER TABLE "Planta"
  ADD COLUMN "grupo" "GrupoPlanta",
  ADD COLUMN "grupoAnterior" "GrupoPlanta",
  ADD COLUMN "grupoExpiraEm" TIMESTAMP(3);
```

- [ ] **Step 3: Aplicar e gerar o client**

Run: `docker compose exec api npx prisma migrate deploy` e depois `cd server && npm run prisma:generate`
Expected: "1 migration applied" / "Generated Prisma Client". Conferir que não há drift: `docker compose exec api npx prisma migrate status` → "Database schema is up to date".

- [ ] **Step 4: Rodar a suíte**

Run: `cd server && npm test`
Expected: tudo passa (nada usa os campos ainda).

- [ ] **Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/20261006120000_grupos_plantas
git commit -m "feat(db): grupos fixos de plantas (enum GrupoPlanta)"
```

---

### Task 2: Domínio — regras de grupo

**Files:**
- Create: `server/src/modules/planta/dominio/grupo.ts`
- Test: `server/src/modules/planta/dominio/grupo.test.ts`

**Interfaces:**
- Consumes: tipo `GrupoPlanta` (Task 1).
- Produces:
  - `interface EstadoGrupo { grupo: GrupoPlanta | null; grupoAnterior: GrupoPlanta | null; grupoExpiraEm: Date | null }`
  - `const RECEM_TRANSPLANTADA: GrupoPlanta` (`'RECEM_TRANSPLANTADA'`)
  - `const TRANSPLANTE_PADRAO_DIAS = 15`
  - `diasDeTransplante(valor: string | null | undefined): number`
  - `aplicarTransplante(estado: EstadoGrupo, data: Date, dias: number): EstadoGrupo`
  - `trocaManual(grupo: GrupoPlanta | null): EstadoGrupo`

- [ ] **Step 1: Escrever os testes**

```ts
import { aplicarTransplante, diasDeTransplante, trocaManual, TRANSPLANTE_PADRAO_DIAS } from './grupo';

const DIA = 86_400_000;
const DATA = new Date('2026-10-06T12:00:00.000Z');

describe('aplicarTransplante', () => {
  it('guarda o grupo atual e move para Recém transplantada até data + dias', () => {
    expect(aplicarTransplante({ grupo: 'REFINAMENTO', grupoAnterior: null, grupoExpiraEm: null }, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'REFINAMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });

  it('planta sem grupo volta para sem grupo', () => {
    expect(aplicarTransplante({ grupo: null, grupoAnterior: null, grupoExpiraEm: null }, DATA, 10).grupoAnterior).toBeNull();
  });

  it('novo transplante durante o prazo recomeça o prazo e mantém o grupo de retorno original', () => {
    const antes = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: 'EM_CRESCIMENTO' as const, grupoExpiraEm: new Date(DATA.getTime() + 3 * DIA) };
    expect(aplicarTransplante(antes, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'EM_CRESCIMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });

  it('Recém transplantada escolhida à mão (sem retorno) continua sem retorno', () => {
    const antes = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: null, grupoExpiraEm: null };
    expect(aplicarTransplante(antes, DATA, 15).grupoAnterior).toBeNull();
  });
});

describe('trocaManual', () => {
  it('define o grupo e cancela o retorno automático', () => {
    expect(trocaManual('DEBILITADA')).toEqual({ grupo: 'DEBILITADA', grupoAnterior: null, grupoExpiraEm: null });
    expect(trocaManual(null)).toEqual({ grupo: null, grupoAnterior: null, grupoExpiraEm: null });
  });
});

describe('diasDeTransplante', () => {
  it('usa o padrão sem preferência ou com valor inválido', () => {
    expect(diasDeTransplante(undefined)).toBe(TRANSPLANTE_PADRAO_DIAS);
    expect(diasDeTransplante('abc')).toBe(TRANSPLANTE_PADRAO_DIAS);
  });

  it('limita entre 1 e 365', () => {
    expect(diasDeTransplante('30')).toBe(30);
    expect(diasDeTransplante('0')).toBe(1);
    expect(diasDeTransplante('9999')).toBe(365);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npm test -- grupo.test`
Expected: FAIL — "Cannot find module './grupo'".

- [ ] **Step 3: Implementar**

```ts
import type { GrupoPlanta } from '@prisma/client';

export interface EstadoGrupo {
  grupo: GrupoPlanta | null;
  grupoAnterior: GrupoPlanta | null;
  grupoExpiraEm: Date | null;
}

export const RECEM_TRANSPLANTADA: GrupoPlanta = 'RECEM_TRANSPLANTADA';
export const TRANSPLANTE_PADRAO_DIAS = 15;

/** Preferência `transplante_dias` → dias em Recém transplantada (1–365, padrão 15). */
export function diasDeTransplante(valor: string | null | undefined): number {
  const dias = valor ? parseInt(valor, 10) : NaN;
  if (Number.isNaN(dias)) return TRANSPLANTE_PADRAO_DIAS;
  return Math.min(365, Math.max(1, dias));
}

/** Transplante registrado: vai para Recém transplantada até `data + dias` e depois volta ao grupo de antes. */
export function aplicarTransplante(estado: EstadoGrupo, data: Date, dias: number): EstadoGrupo {
  // Já em Recém transplantada: o grupo de retorno continua o original
  const grupoAnterior = estado.grupo === RECEM_TRANSPLANTADA ? estado.grupoAnterior : estado.grupo;
  return { grupo: RECEM_TRANSPLANTADA, grupoAnterior, grupoExpiraEm: new Date(data.getTime() + dias * 86_400_000) };
}

/** Escolha manual do usuário: cancela qualquer retorno automático. */
export function trocaManual(grupo: GrupoPlanta | null): EstadoGrupo {
  return { grupo, grupoAnterior: null, grupoExpiraEm: null };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd server && npm test -- grupo.test`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/planta/dominio
git commit -m "feat(api): regras puras dos grupos de plantas"
```

---

### Task 3: Módulo planta — grupo no CRUD e expiração na leitura

**Files:**
- Modify: `server/src/modules/planta/types/planta.types.ts`
- Modify: `server/src/modules/planta/planta.schema.ts`
- Modify: `server/src/modules/planta/repositories/prisma-planta.repository.ts`
- Modify: `server/src/modules/planta/use-cases/update-planta.use-case.ts`
- Modify: `server/src/modules/planta/use-cases/get-plantas-by-user.use-case.ts`
- Modify: `server/src/modules/planta/use-cases/get-planta-by-id.use-case.ts`
- Test: os 5 `*.use-case.test.ts` de `server/src/modules/planta/use-cases/` (mocks) + novos casos em `update-planta`, `get-plantas-by-user`, `get-planta-by-id`

**Interfaces:**
- Consumes: `trocaManual`, `EstadoGrupo` (Task 2).
- Produces: `PlantaRepository.resolverGruposVencidos(usuarioId: string, agora: Date): Promise<void>`; DTOs com `grupo?: GrupoPlanta | null`; respostas de planta com `grupo`, `grupoAnterior`, `grupoExpiraEm`.

- [ ] **Step 1: Atualizar os mocks dos testes existentes**

Nos 5 arquivos (`create-planta`, `delete-planta`, `get-planta-by-id`, `get-plantas-by-user`, `update-planta` `.use-case.test.ts`), dentro do objeto `mockPlantaRepository = { ... }`, após `findUrlsDeMidia: jest.fn(),` adicionar:

```ts
      resolverGruposVencidos: jest.fn().mockResolvedValue(undefined),
```

- [ ] **Step 2: Escrever os testes novos**

Em `get-plantas-by-user.use-case.test.ts`, dentro de `describe('execute')`:

```ts
    it('devolve ao grupo anterior as plantas com prazo vencido antes de listar', async () => {
      mockPlantaRepository.findManyByUser.mockResolvedValue([]);

      await getPlantasByUserUseCase.execute(usuarioId);

      expect(mockPlantaRepository.resolverGruposVencidos).toHaveBeenCalledWith(usuarioId, expect.any(Date));
      expect(mockPlantaRepository.resolverGruposVencidos.mock.invocationCallOrder[0]).toBeLessThan(
        mockPlantaRepository.findManyByUser.mock.invocationCallOrder[0],
      );
    });
```

Em `get-planta-by-id.use-case.test.ts` (ajuste nomes de variáveis ao arquivo — ex.: `getPlantaByIdUseCase`, ids usados nos outros casos):

```ts
    it('resolve prazos vencidos antes de buscar', async () => {
      mockPlantaRepository.findByIdAndUser.mockResolvedValue({ id: 'planta-1' } as any);

      await getPlantaByIdUseCase.execute('planta-1', 'user-123');

      expect(mockPlantaRepository.resolverGruposVencidos).toHaveBeenCalledWith('user-123', expect.any(Date));
    });
```

Em `update-planta.use-case.test.ts`, dentro de `describe('execute')`:

```ts
    it('troca manual de grupo cancela o retorno automático', async () => {
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      await updatePlantaUseCase.execute(plantaId, usuarioId, { grupo: 'EM_CRESCIMENTO' });

      expect(mockPlantaRepository.update).toHaveBeenCalledWith(
        plantaId,
        usuarioId,
        expect.objectContaining({ grupo: 'EM_CRESCIMENTO', grupoAnterior: null, grupoExpiraEm: null }),
      );
    });

    it('sem o campo grupo, não mexe no grupo', async () => {
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      await updatePlantaUseCase.execute(plantaId, usuarioId, { nome: 'X' });

      const dados = mockPlantaRepository.update.mock.calls[0][2];
      expect(dados).not.toHaveProperty('grupo');
      expect(dados).not.toHaveProperty('grupoAnterior');
      expect(dados).not.toHaveProperty('grupoExpiraEm');
    });
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server && npm test -- planta`
Expected: FAIL — erros de tipo (`resolverGruposVencidos` não existe em `PlantaRepository`; `grupo` não existe no DTO).

- [ ] **Step 4: Tipos**

Em `planta.types.ts`: trocar o import para `import { GrupoPlanta, ModoAquisicao } from '@prisma/client';` e adicionar `grupo?: GrupoPlanta | null;` a `CreatePlantaRequestDTO`, `UpdatePlantaRequestDTO` e `CreatePlantaDTO`. Em `UpdatePlantaDTO` adicionar:

```ts
  grupo?: GrupoPlanta | null;
  grupoAnterior?: GrupoPlanta | null;
  grupoExpiraEm?: Date | null;
```

Em `PlantaWithEspecie`, após `historicoPublico: boolean;` (opcionais para não exigir mudança nos fixtures dos testes):

```ts
  grupo?: GrupoPlanta | null;
  grupoAnterior?: GrupoPlanta | null;
  grupoExpiraEm?: Date | null;
```

Em `PlantaRepository`, após `findUrlsDeMidia`:

```ts
  /** Plantas do usuário com `grupoExpiraEm <= agora` voltam ao grupo anterior. */
  resolverGruposVencidos(usuarioId: string, agora: Date): Promise<void>;
```

- [ ] **Step 5: Schema Zod**

Em `planta.schema.ts`, após `ModoAquisicaoEnum`:

```ts
const GrupoPlantaEnum = z.enum(['RECEM_TRANSPLANTADA', 'DEBILITADA', 'EM_CRESCIMENTO', 'REFINAMENTO']);
```

e em `createPlantaSchema.body` e `updatePlantaSchema.body`, após `historicoPublico`:

```ts
    grupo: GrupoPlantaEnum.optional().nullable(),
```

- [ ] **Step 6: Use cases**

`update-planta.use-case.ts`: importar `import { trocaManual } from '../dominio/grupo';` e trocar o bloco `const updateData` por:

```ts
    // Transformar dataAquisicao de string para Date se fornecida
    const { grupo, ...resto } = data;
    const updateData: UpdatePlantaDTO = {
      ...resto,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : undefined,
      // Grupo escolhido à mão cancela o retorno automático do transplante
      ...(grupo !== undefined ? trocaManual(grupo) : {}),
    };
```

`get-plantas-by-user.use-case.ts`:

```ts
  async execute(usuarioId: string): Promise<PlantaWithEspecie[]> {
    await this.plantaRepository.resolverGruposVencidos(usuarioId, new Date());
    return await this.plantaRepository.findManyByUser(usuarioId);
  }
```

`get-planta-by-id.use-case.ts`: primeira linha de `execute`:

```ts
    await this.plantaRepository.resolverGruposVencidos(usuarioId, new Date());
```

- [ ] **Step 7: Repositório**

Em `prisma-planta.repository.ts`, as 4 cópias do `select` viram uma constante no topo do arquivo (após os imports):

```ts
const SELECT_PLANTA = {
  id: true,
  especieId: true,
  usuarioId: true,
  nome: true,
  identificador: true,
  dataAquisicao: true,
  modoAquisicao: true,
  observacoes: true,
  fotoCapaUrl: true,
  plantaPublica: true,
  historicoPublico: true,
  grupo: true,
  grupoAnterior: true,
  grupoExpiraEm: true,
  createdAt: true,
  updatedAt: true,
  especie: { select: { nomeCientifico: true, nomeComum: true } },
} as const;
```

Substituir cada `select: { ... }` de `create`, `findManyByUser`, `findByIdAndUser`, `update` por `select: SELECT_PLANTA`. No `data` de `create` adicionar `grupo: data.grupo,`; no `data` de `update` adicionar:

```ts
        grupo: data.grupo,
        grupoAnterior: data.grupoAnterior,
        grupoExpiraEm: data.grupoExpiraEm,
```

E o método novo:

```ts
  async resolverGruposVencidos(usuarioId: string, agora: Date): Promise<void> {
    // Copia coluna→coluna (o Prisma não faz isso em updateMany)
    await this.prisma.$executeRaw`
      UPDATE "Planta"
      SET "grupo" = "grupoAnterior", "grupoAnterior" = NULL, "grupoExpiraEm" = NULL, "updatedAt" = NOW()
      WHERE "usuarioId" = ${usuarioId} AND "grupoExpiraEm" <= ${agora}`;
  }
```

- [ ] **Step 8: Rodar e ver passar + build**

Run: `cd server && npm test -- planta` e `cd server && npm run build`
Expected: PASS; build sem erros.

- [ ] **Step 9: Commit**

```bash
git add server/src/modules/planta
git commit -m "feat(api): grupo da planta no CRUD e retorno automático ao grupo anterior"
```

---

### Task 4: Registro de cuidado — mover para Recém transplantada

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts`
- Modify: `server/src/modules/agenda/agenda.schema.ts` (`registrarCuidadosSchema`)
- Modify: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.ts`
- Modify: `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts`
- Test: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.test.ts`, `server/src/modules/agenda/use-cases/concluir-agendas.use-case.test.ts` (mock)

**Interfaces:**
- Consumes: `aplicarTransplante`, `diasDeTransplante`, `EstadoGrupo` (Task 2).
- Produces:
  - `ATIVIDADE_TRANSPLANTE = 'Transplante'`, `PREF_TRANSPLANTE_DIAS = 'transplante_dias'` em `agenda.types.ts`
  - `RegistrarCuidadosDTO.moverRecemTransplantada?: boolean`
  - `PlanoRegistro.atualizarGrupos: ({ plantaId: string } & EstadoGrupo)[]`
  - `ConclusaoRepository.transplanteDasPlantas(plantaIds: string[], usuarioId: string): Promise<{ atividadeId: string | null; dias: number; plantas: ({ plantaId: string } & EstadoGrupo)[] }>`

- [ ] **Step 1: Mocks existentes**

Nos dois testes (`registrar-cuidados` e `concluir-agendas`), no objeto `repo = { ... }` adicionar:

```ts
      transplanteDasPlantas: jest.fn().mockResolvedValue({ atividadeId: null, dias: 15, plantas: [] }),
```

- [ ] **Step 2: Testes novos** (em `registrar-cuidados.use-case.test.ts`, dentro do `describe`)

```ts
  describe('mover para Recém transplantada', () => {
    beforeEach(() => {
      repo.contarPlantasDoUsuario.mockResolvedValue(2);
      repo.transplanteDasPlantas.mockResolvedValue({
        atividadeId: 'at-transplante',
        dias: 15,
        plantas: [
          { plantaId: 'p1', grupo: 'REFINAMENTO', grupoAnterior: null, grupoExpiraEm: null },
          { plantaId: 'p2', grupo: null, grupoAnterior: null, grupoExpiraEm: null },
        ],
      });
    });

    const dto = (mover?: boolean): RegistrarCuidadosDTO => ({
      data: AGORA.toISOString(),
      plantas: [
        { plantaId: 'p1', atividadeIds: ['at-transplante'] },
        { plantaId: 'p2', atividadeIds: ['at-1'] },
      ],
      moverRecemTransplantada: mover,
    });

    it('com a opção marcada, move só as plantas transplantadas', async () => {
      await useCase.execute(dto(true), 'user-1');

      expect(repo.transplanteDasPlantas).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');
      expect(plano().atualizarGrupos).toEqual([
        {
          plantaId: 'p1',
          grupo: 'RECEM_TRANSPLANTADA',
          grupoAnterior: 'REFINAMENTO',
          grupoExpiraEm: new Date(AGORA.getTime() + 15 * DIA),
        },
      ]);
    });

    it('sem a opção, não mexe em grupos', async () => {
      await useCase.execute(dto(undefined), 'user-1');

      expect(repo.transplanteDasPlantas).not.toHaveBeenCalled();
      expect(plano().atualizarGrupos).toEqual([]);
    });

    it('sem a atividade Transplante no banco, não mexe em grupos', async () => {
      repo.transplanteDasPlantas.mockResolvedValue({ atividadeId: null, dias: 15, plantas: [] });

      await useCase.execute(dto(true), 'user-1');

      expect(plano().atualizarGrupos).toEqual([]);
    });
  });
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server && npm test -- registrar-cuidados`
Expected: FAIL — tipo (`transplanteDasPlantas`, `moverRecemTransplantada`, `atualizarGrupos` inexistentes).

- [ ] **Step 4: Tipos e schema**

`agenda.types.ts`: adicionar import `import { EstadoGrupo } from '../planta/dominio/grupo';` e, após `PREF_REVISAO_DIAS`:

```ts
export const ATIVIDADE_TRANSPLANTE = 'Transplante';
export const PREF_TRANSPLANTE_DIAS = 'transplante_dias';

export type AtualizacaoGrupo = { plantaId: string } & EstadoGrupo;
```

Em `RegistrarCuidadosDTO`, após `concluirAgendaIds`:

```ts
  /** Plantas com Transplante registrado vão para Recém transplantada (por `transplante_dias`). */
  moverRecemTransplantada?: boolean;
```

Em `PlanoRegistro`, após `moverPendentes`:

```ts
  /** Mudanças de grupo (Transplante → Recém transplantada). */
  atualizarGrupos: AtualizacaoGrupo[];
```

Em `ConclusaoRepository`, após `registrar`:

```ts
  /** Id da atividade Transplante (null se não existir), dias da preferência e grupo atual das plantas do usuário. */
  transplanteDasPlantas(
    plantaIds: string[],
    usuarioId: string,
  ): Promise<{ atividadeId: string | null; dias: number; plantas: AtualizacaoGrupo[] }>;
```

`agenda.schema.ts`, em `registrarCuidadosSchema.body`, após `concluirAgendaIds`:

```ts
    moverRecemTransplantada: z.boolean().optional(),
```

- [ ] **Step 5: Use case**

Em `registrar-cuidados.use-case.ts`: importar `import { aplicarTransplante } from '../../planta/dominio/grupo';` e trocar o import de tipos para `import { AtualizacaoGrupo, ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';`. Antes do `return this.repo.registrar({`:

```ts
    const atualizarGrupos = dto.moverRecemTransplantada ? await this.gruposDoTransplante(cuidados, usuarioId, data) : [];
```

e no objeto passado a `registrar`, após `moverPendentes: revisoes.mover,`:

```ts
      atualizarGrupos,
```

Novo método da classe:

```ts
  /** Plantas com Transplante neste registro vão para Recém transplantada. */
  private async gruposDoTransplante(
    cuidados: { plantaId: string; atividadeIds: string[] }[],
    usuarioId: string,
    data: Date,
  ): Promise<AtualizacaoGrupo[]> {
    const { atividadeId, dias, plantas } = await this.repo.transplanteDasPlantas(
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

- [ ] **Step 6: Repositório**

Em `prisma-conclusao.repository.ts`: adicionar `ATIVIDADE_TRANSPLANTE, PREF_TRANSPLANTE_DIAS` ao import de `../agenda.types` e `import { diasDeTransplante } from '../../planta/dominio/grupo';`. Método novo:

```ts
  async transplanteDasPlantas(plantaIds: string[], usuarioId: string) {
    const [atividade, pref, plantas] = await Promise.all([
      prisma.atividade.findUnique({ where: { nome: ATIVIDADE_TRANSPLANTE }, select: { id: true } }),
      prisma.preferenciaUsuario.findUnique({
        where: { usuarioId_chave: { usuarioId, chave: PREF_TRANSPLANTE_DIAS } },
      }),
      prisma.planta.findMany({
        where: { id: { in: plantaIds }, usuarioId },
        select: { id: true, grupo: true, grupoAnterior: true, grupoExpiraEm: true },
      }),
    ]);
    return {
      atividadeId: atividade?.id ?? null,
      dias: diasDeTransplante(pref?.valor),
      plantas: plantas.map(({ id, ...g }) => ({ plantaId: id, ...g })),
    };
  }
```

Em `registrar`, dentro da transação, logo após `await this.moverPendentes(tx, plano.moverPendentes);`:

```ts
        for (const g of plano.atualizarGrupos) {
          await tx.planta.update({
            where: { id: g.plantaId },
            data: { grupo: g.grupo, grupoAnterior: g.grupoAnterior, grupoExpiraEm: g.grupoExpiraEm },
          });
        }
```

- [ ] **Step 7: Rodar e ver passar + build**

Run: `cd server && npm test` e `cd server && npm run build`
Expected: toda a suíte PASS; build OK.

- [ ] **Step 8: Commit**

```bash
git add server/src/modules/agenda
git commit -m "feat(api): registrar Transplante move a planta para Recém transplantada"
```

---

### Task 5: Web — tipos, seletor de grupo nas telas de planta e preferência no Perfil

**Files:**
- Modify: `web/src/types.ts`
- Modify: `web/src/lib/endpoints.ts`
- Modify: `web/src/lib/format.ts`
- Modify: `web/src/lib/queries.ts`
- Create: `web/src/components/GrupoChips.tsx`
- Modify: `web/src/pages/AddPlantPage.tsx`, `web/src/pages/EditPlantPage.tsx`, `web/src/pages/PlantDetailPage.tsx`, `web/src/pages/ProfilePages.tsx`

**Interfaces:**
- Consumes: API de planta com `grupo`, `grupoAnterior`, `grupoExpiraEm` (Task 3).
- Produces:
  - `type GrupoPlanta` e `GRUPOS_PLANTA: { value: GrupoPlanta; label: string }[]` em `types.ts`
  - `grupoLabel(g?: GrupoPlanta | null): string` em `format.ts` (null → `'Sem grupo'`)
  - `ATIVIDADE_TRANSPLANTE = 'Transplante'` em `types.ts`
  - `PlantaInput.grupo?: GrupoPlanta | null`; `RegistrarInput.moverRecemTransplantada?: boolean`
  - `<GrupoChips value onChange />`

- [ ] **Step 1: Tipos**

`web/src/types.ts`: após `export type TipoPlanta = ...`:

```ts
export type GrupoPlanta = 'RECEM_TRANSPLANTADA' | 'DEBILITADA' | 'EM_CRESCIMENTO' | 'REFINAMENTO';
```

Em `interface Planta`, após `historicoPublico: boolean;`:

```ts
  grupo?: GrupoPlanta | null;
  /** Grupo de retorno quando o período em Recém transplantada acabar. */
  grupoAnterior?: GrupoPlanta | null;
  grupoExpiraEm?: string | null;
```

No fim do arquivo:

```ts
/** Ordem de exibição (Bancada, filtros, seletor). */
export const GRUPOS_PLANTA: { value: GrupoPlanta; label: string }[] = [
  { value: 'RECEM_TRANSPLANTADA', label: 'Recém transplantada' },
  { value: 'DEBILITADA', label: 'Debilitada' },
  { value: 'EM_CRESCIMENTO', label: 'Em crescimento' },
  { value: 'REFINAMENTO', label: 'Refinamento' },
];

/** Nome da atividade (seed) que move a planta para Recém transplantada. */
export const ATIVIDADE_TRANSPLANTE = 'Transplante';
```

`web/src/types.ts` (interface `Preferencias`, perto de `revisao_automatica_dias?: string;`): adicionar `transplante_dias?: string;`.

`web/src/lib/endpoints.ts`: em `PlantaInput` adicionar `grupo?: GrupoPlanta | null;` (importar `GrupoPlanta` de `@/types`); em `RegistrarInput`, após `concluirAgendaIds`:

```ts
  /** Plantas com Transplante vão para Recém transplantada. */
  moverRecemTransplantada?: boolean;
```

`web/src/lib/format.ts`: trocar imports para `import type { Agenda, GrupoPlanta, ModoAquisicao, Planta } from '@/types';` e `import { GRUPOS_PLANTA, MODOS_AQUISICAO } from '@/types';`, e após `modoAquisicaoLabel`:

```ts
export const grupoLabel = (g?: GrupoPlanta | null) => GRUPOS_PLANTA.find((x) => x.value === g)?.label ?? 'Sem grupo';
```

`web/src/lib/queries.ts`, após `useRevisaoDias`:

```ts
/** Dias em Recém transplantada após um Transplante (padrão 15, 1–365) — mesma regra do backend. */
export function useTransplanteDias() {
  const prefs = usePreferencias();
  const dias = parseInt(prefs.data?.transplante_dias ?? '15', 10);
  return Number.isNaN(dias) ? 15 : Math.min(365, Math.max(1, dias));
}
```

- [ ] **Step 2: Componente `GrupoChips`**

`web/src/components/GrupoChips.tsx`:

```tsx
import { GRUPOS_PLANTA, type GrupoPlanta } from '@/types';

/** Escolha do grupo da planta; tocar no ativo deixa sem grupo. */
export function GrupoChips({ value, onChange }: { value: GrupoPlanta | null; onChange: (g: GrupoPlanta | null) => void }) {
  return (
    <div>
      <span className="label">Grupo</span>
      <div className="flex flex-wrap gap-2">
        {GRUPOS_PLANTA.map((g) => (
          <button
            key={g.value}
            type="button"
            className={`chip ${value === g.value ? 'chip-active' : ''}`}
            onClick={() => onChange(value === g.value ? null : g.value)}
            aria-pressed={value === g.value}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar planta**

`AddPlantPage.tsx`: importar `GrupoChips` e `type GrupoPlanta`; estado `const [grupo, setGrupo] = useState<GrupoPlanta | null>(null);`; em `resetar()` adicionar `setGrupo(null);`; em `plantasApi.create({...})` adicionar `grupo,`; no passo 2 ("Como ela chegou?"), após o bloco "Modo de aquisição", adicionar `<GrupoChips value={grupo} onChange={setGrupo} />`.

- [ ] **Step 4: Editar planta**

`EditPlantPage.tsx`: importar `GrupoChips`, `grupoLabel`, `dataCurta` (de `@/lib/format`) e `type GrupoPlanta`; estado `const [grupo, setGrupo] = useState<GrupoPlanta | null>(p.grupo ?? null);`; em `plantasApi.update(id, {...})` adicionar (só envia se mudou, para não cancelar o retorno automático à toa):

```ts
        ...(grupo !== (p.grupo ?? null) ? { grupo } : {}),
```

Após o bloco "Modo de aquisição":

```tsx
        <div>
          <GrupoChips value={grupo} onChange={setGrupo} />
          {p.grupoExpiraEm && grupo === p.grupo && (
            <p className="mt-1.5 text-xs text-muted">
              Volta para {grupoLabel(p.grupoAnterior)} em {dataCurta(p.grupoExpiraEm)}. Trocar o grupo cancela o retorno.
            </p>
          )}
        </div>
```

- [ ] **Step 5: Detalhe da planta**

`PlantDetailPage.tsx`: importar `Layers` de `lucide-react` e `grupoLabel` de `@/lib/format`. Trocar a condição `{(idade || aquisicao) && (` por `{(idade || aquisicao || p.grupo) && (` e, dentro do `div`, antes do `{idade && (`:

```tsx
            {p.grupo && (
              <span className="flex items-center gap-1.5">
                <Layers size={16} className="text-primary" /> {grupoLabel(p.grupo)}
                {p.grupoExpiraEm && ` · volta para ${grupoLabel(p.grupoAnterior)} em ${dataCurta(p.grupoExpiraEm)}`}
              </span>
            )}
```

- [ ] **Step 6: Perfil — preferência genérica**

Em `ProfilePages.tsx`, substituir `OPCOES_REVISAO` e `function RevisaoAutomatica()` por um componente genérico e dois usos:

```tsx
const OPCOES_REVISAO = [
  { valor: '0', label: 'Desligada' },
  { valor: '15', label: '15 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '60', label: '60 dias' },
  { valor: '90', label: '90 dias' },
];

const OPCOES_TRANSPLANTE = [
  { valor: '7', label: '7 dias' },
  { valor: '15', label: '15 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '45', label: '45 dias' },
  { valor: '60', label: '60 dias' },
];

/** Preferência numérica (dias) escolhida numa lista. */
function PreferenciaDias({
  chave,
  dias,
  opcoes,
  label,
  hint,
}: {
  chave: string;
  dias: number;
  opcoes: { valor: string; label: string }[];
  label: string;
  hint: string;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const prefs = usePreferencias();
  const [salvando, setSalvando] = useState(false);

  async function mudar(valor: string) {
    setSalvando(true);
    try {
      await preferenciasApi.set(chave, valor);
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
      <Field label={label} hint={hint}>
        <select className="input" value={String(dias)} disabled={prefs.isLoading || salvando} onChange={(e) => mudar(e.target.value)}>
          {!opcoes.some((o) => o.valor === String(dias)) && <option value={String(dias)}>{dias} dias</option>}
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </section>
  );
}

/** Intervalo da rotina de Revisão geral criada em cada planta nova. */
function RevisaoAutomatica() {
  return (
    <PreferenciaDias
      chave="revisao_automatica_dias"
      dias={useRevisaoDias()}
      opcoes={OPCOES_REVISAO}
      label="Revisão geral das plantas novas"
      hint="Cada planta nova ganha uma rotina de Revisão geral com este intervalo, remarcada a cada cuidado. Para mudar numa planta, use a seção Rotinas dela."
    />
  );
}

/** Quanto tempo a planta fica em Recém transplantada depois de um Transplante. */
function TempoTransplante() {
  return (
    <PreferenciaDias
      chave="transplante_dias"
      dias={useTransplanteDias()}
      opcoes={OPCOES_TRANSPLANTE}
      label="Dias em Recém transplantada"
      hint="Ao registrar um Transplante, a planta vai para o grupo Recém transplantada por este tempo e depois volta ao grupo em que estava."
    />
  );
}
```

Adicionar `useTransplanteDias` ao import de `@/lib/queries` e, logo após `<RevisaoAutomatica />` (linha ~103), `<TempoTransplante />`.

- [ ] **Step 7: Build e lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add web/src
git commit -m "feat(web): grupo da planta no cadastro, edição, detalhe e preferência de transplante"
```

---

### Task 6: Web — filtro por grupo na Coleção e opção no Registrar

**Files:**
- Modify: `web/src/pages/CollectionPage.tsx`
- Modify: `web/src/pages/RegistrarPage.tsx`

**Interfaces:**
- Consumes: `GRUPOS_PLANTA`, `ATIVIDADE_TRANSPLANTE`, `GrupoPlanta` (Task 5); `RegistrarInput.moverRecemTransplantada` (Task 5); `useAtividades` (`web/src/lib/queries.ts`).

- [ ] **Step 1: Coleção**

Importar `GRUPOS_PLANTA, type GrupoPlanta` de `@/types`. Estado: `const [grupo, setGrupo] = useState<'' | 'sem' | GrupoPlanta>('');`. No filtro de `lista`, após a linha da espécie:

```ts
      if (grupo === 'sem' ? !!p.grupo : grupo && p.grupo !== grupo) return false;
```

e adicionar `grupo` ao array de dependências do `useMemo`. Trocar o `<div className="flex gap-2">` que contém os selects por duas linhas:

```tsx
            <div className="flex gap-2">
              <select className="input min-w-0 flex-1 py-2 text-sm" value={grupo} onChange={(e) => setGrupo(e.target.value as typeof grupo)} aria-label="Filtrar por grupo">
                <option value="">Todos os grupos</option>
                {GRUPOS_PLANTA.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
                <option value="sem">Sem grupo</option>
              </select>
              {/* select de espécie existente, sem mudanças */}
            </div>
            <div className="flex gap-2">
              {/* select de ordem existente, agora com className "input min-w-0 flex-1 py-2 text-sm" */}
              {/* toggle grade/lista existente, sem mudanças */}
            </div>
```

(Mover os elementos existentes — não reescrevê-los; só o select de ordem troca `w-auto` por `min-w-0 flex-1`.)

- [ ] **Step 2: Registrar**

Em `RegistrarPage.tsx`: adicionar `useAtividades` ao import de `@/lib/queries` e `import { ATIVIDADE_TRANSPLANTE } from '@/types';`. Junto dos outros hooks/estados:

```ts
  const atividades = useAtividades();
  /** "Mover para Recém transplantadas" — vem marcado quando há Transplante. */
  const [moverTransplante, setMoverTransplante] = useState(true);
```

Após a linha `const concluirAgendaIds = ...`:

```ts
  const transplanteId = atividades.data?.find((a) => a.nome === ATIVIDADE_TRANSPLANTE)?.id;
  const comTransplante = !!transplanteId && tocadas.some((pid) => tiposDe(pid).includes(transplanteId));
```

Em `agendasApi.registrar({...})`, após `concluirAgendaIds`:

```ts
          moverRecemTransplantada: comTransplante && moverTransplante ? true : undefined,
```

Logo antes de `{candidatas.length > 0 && (`:

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

- [ ] **Step 3: Build e lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/CollectionPage.tsx web/src/pages/RegistrarPage.tsx
git commit -m "feat(web): filtro por grupo na Coleção e mover para Recém transplantadas no registro"
```

---

### Task 7: Web — Bancada por grupos/tarefas/espécies com período

**Files:**
- Create: `web/src/lib/bancada.ts`
- Modify: `web/src/lib/estacoes.ts` (nova `fimDaEstacao`)
- Modify: `web/src/lib/format.ts` (remover `tarefasDaBancada`, que vai para `bancada.ts`)
- Modify: `web/src/pages/BancadaPage.tsx`

**Interfaces:**
- Consumes: `grupoLabel` (Task 5), `GRUPOS_PLANTA` (Task 5), `agruparPorAtividade`, `GrupoAtividade`, `diasAte`, `especieNome` (`format.ts`), `proximaOcorrencia` (`estacoes.ts`).
- Produces:
  - `fimDaEstacao(hoje?: Date): Date`
  - `type Periodo = 'semana' | 'mes' | 'estacao' | 'todas'`, `type Agrupar = 'grupos' | 'tarefas' | 'especies'`
  - `tarefasDaBancada(agendas: Agenda[], periodo: Periodo): { atrasadas: Agenda[]; proximas: Agenda[] }`
  - `interface Bloco { chave: string; titulo: string | null; grupos: GrupoAtividade[] }`
  - `blocosDaBancada(agendas: Agenda[], modo: Agrupar, plantas: Map<string, Planta>): Bloco[]`

- [ ] **Step 1: `fimDaEstacao`**

No fim de `web/src/lib/estacoes.ts`:

```ts
/** Último dia da estação atual (o "final" mais próximo a partir de hoje, inclusive). */
export function fimDaEstacao(hoje = new Date()): Date {
  const ontem = meioDia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
  return ESTACOES.map((e) => proximaOcorrencia(e.final, ontem)).reduce((a, b) => (b < a ? b : a));
}
```

- [ ] **Step 2: `bancada.ts`**

```ts
import { GRUPOS_PLANTA, type Agenda, type Planta } from '@/types';
import { agruparPorAtividade, diasAte, especieNome, grupoLabel, type GrupoAtividade } from './format';
import { fimDaEstacao } from './estacoes';

export type Periodo = 'semana' | 'mes' | 'estacao' | 'todas';
export type Agrupar = 'grupos' | 'tarefas' | 'especies';

export const PERIODOS: { value: Periodo; label: string; vazio: string }[] = [
  { value: 'semana', label: 'Esta semana', vazio: 'nos próximos 7 dias' },
  { value: 'mes', label: 'Este mês', vazio: 'neste mês' },
  { value: 'estacao', label: 'Esta estação', vazio: 'nesta estação' },
  { value: 'todas', label: 'Todas', vazio: 'agendada' },
];

export const AGRUPAMENTOS: { value: Agrupar; label: string }[] = [
  { value: 'grupos', label: 'Por grupo' },
  { value: 'tarefas', label: 'Por tarefa' },
  { value: 'especies', label: 'Por espécie' },
];

/** Último dia incluído no período, em dias a partir de hoje; null = sem limite. */
function limiteDoPeriodo(periodo: Periodo): number | null {
  const hoje = new Date();
  if (periodo === 'semana') return 6;
  if (periodo === 'mes') return diasAte(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 12).toISOString());
  if (periodo === 'estacao') return diasAte(fimDaEstacao(hoje).toISOString());
  return null;
}

/** Pendentes da bancada: atrasadas (sempre) e próximas dentro do período. */
export function tarefasDaBancada(agendas: Agenda[], periodo: Periodo) {
  const pendentes = agendas.filter((a) => a.status === 'PENDENTE');
  const limite = limiteDoPeriodo(periodo);
  return {
    atrasadas: pendentes.filter((a) => diasAte(a.dataAgendada) < 0),
    proximas: pendentes.filter((a) => {
      const d = diasAte(a.dataAgendada);
      return d >= 0 && (limite === null || d <= limite);
    }),
  };
}

export interface Bloco {
  chave: string;
  /** null = sem cabeçalho (modo "por tarefa") */
  titulo: string | null;
  grupos: GrupoAtividade[];
}

/** Blocos por grupo da planta (ordem fixa) ou espécie (A–Z), com as tarefas agrupadas por atividade dentro. */
export function blocosDaBancada(agendas: Agenda[], modo: Agrupar, plantas: Map<string, Planta>): Bloco[] {
  if (!agendas.length) return [];
  if (modo === 'tarefas') return [{ chave: 'tarefas', titulo: null, grupos: agruparPorAtividade(agendas) }];

  const chaveDe = (a: Agenda) => {
    const p = plantas.get(a.plantaId);
    return (modo === 'grupos' ? p?.grupo : p?.especieId) ?? '';
  };
  const porChave = new Map<string, Agenda[]>();
  for (const a of agendas) {
    const k = chaveDe(a);
    porChave.set(k, [...(porChave.get(k) ?? []), a]);
  }
  const titulo = (k: string) =>
    modo === 'grupos'
      ? grupoLabel(k ? (k as Planta['grupo']) : null)
      : k
        ? especieNome(plantas.get(porChave.get(k)![0].plantaId)?.especie)
        : 'Sem espécie';
  const ordem =
    modo === 'grupos'
      ? [...GRUPOS_PLANTA.map((g) => g.value as string), '']
      : [...[...porChave.keys()].filter(Boolean).sort((a, b) => titulo(a).localeCompare(titulo(b), 'pt-BR')), ''];
  return ordem
    .filter((k) => porChave.has(k))
    .map((k) => ({ chave: k || 'sem', titulo: titulo(k), grupos: agruparPorAtividade(porChave.get(k)!) }));
}
```

- [ ] **Step 3: Remover `tarefasDaBancada` de `format.ts`**

Apagar a função `tarefasDaBancada` (e o comentário acima dela) de `web/src/lib/format.ts`. Único uso era a `BancadaPage`.

- [ ] **Step 4: Reescrever `BancadaPage.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCheck, PartyPopper } from 'lucide-react';
import { Button, EmptyState, ErrorState, SectionTitle, Spinner } from '@/components/ui';
import { BenchTaskCard } from '@/components/BenchTaskCard';
import { useAuth } from '@/context/AuthContext';
import { AGRUPAMENTOS, PERIODOS, blocosDaBancada, tarefasDaBancada, type Agrupar, type Bloco, type Periodo } from '@/lib/bancada';
import { useAgendas, usePlantas } from '@/lib/queries';
import { errorMessage } from '@/lib/api';
import type { Planta } from '@/types';

const PERIODO_KEY = 'bonsai_bancada_periodo';
const AGRUPAR_KEY = 'bonsai_bancada_agrupar';

/** Lê uma escolha salva; armazenamento indisponível ou valor estranho → padrão. */
function lerEscolha<T extends string>(chave: string, validos: { value: T }[], padrao: T): T {
  try {
    const v = localStorage.getItem(chave);
    return validos.some((o) => o.value === v) ? (v as T) : padrao;
  } catch {
    return padrao;
  }
}

function salvarEscolha(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // sem armazenamento: a escolha vale só nesta visita
  }
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Bancada de trabalho: atrasadas + próximas do período, por grupo da planta, tarefa ou espécie. */
export function BancadaPage() {
  const { user } = useAuth();
  const agendas = useAgendas();
  const plantas = usePlantas();
  const [periodo, setPeriodo] = useState<Periodo>(() => lerEscolha(PERIODO_KEY, PERIODOS, 'semana'));
  const [agrupar, setAgrupar] = useState<Agrupar>(() => lerEscolha(AGRUPAR_KEY, AGRUPAMENTOS, 'grupos'));

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const semPlantas = plantas.data?.length === 0;
  const plantasPorId = useMemo(() => new Map<string, Planta>((plantas.data ?? []).map((p) => [p.id, p])), [plantas.data]);
  const { atrasadas, proximas } = tarefasDaBancada(agendas.data ?? [], periodo);
  const vazio = PERIODOS.find((p) => p.value === periodo)!.vazio;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="pb-2 pt-6">
        <p className="text-sm text-muted">
          {saudacao()}
          {nome && `, ${nome}`}
        </p>
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
          <div className="flex gap-2 pt-2">
            <select
              className="input min-w-0 flex-1 py-2 text-sm"
              value={periodo}
              aria-label="Período"
              onChange={(e) => {
                setPeriodo(e.target.value as Periodo);
                salvarEscolha(PERIODO_KEY, e.target.value);
              }}
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              className="input min-w-0 flex-1 py-2 text-sm"
              value={agrupar}
              aria-label="Agrupar por"
              onChange={(e) => {
                setAgrupar(e.target.value as Agrupar);
                salvarEscolha(AGRUPAR_KEY, e.target.value);
              }}
            >
              {AGRUPAMENTOS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {atrasadas.length > 0 && (
            <section>
              <SectionTitle tone="danger">Atrasadas · {atrasadas.length}</SectionTitle>
              <Blocos blocos={blocosDaBancada(atrasadas, agrupar, plantasPorId)} />
            </section>
          )}

          <section className="pb-6">
            <SectionTitle>Próximas tarefas</SectionTitle>
            {proximas.length > 0 ? (
              <Blocos blocos={blocosDaBancada(proximas, agrupar, plantasPorId)} />
            ) : atrasadas.length === 0 ? (
              <div className="card flex items-center gap-3 p-4">
                <PartyPopper className="shrink-0 text-primary" size={24} />
                <p className="text-sm">
                  <span className="font-semibold">Nada pendente {vazio}.</span>{' '}
                  <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma tarefa {vazio}.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    <div className="space-y-6">
      {blocos.map((b) => (
        <div key={b.chave}>
          {b.titulo && <h3 className="mb-3 border-b border-line pb-1.5 text-xl font-semibold">{b.titulo}</h3>}
          <GruposAtividade grupos={b.grupos} grande={!b.titulo} />
        </div>
      ))}
    </div>
  );
}

/** `grande`: sem título de bloco acima (modo "Por tarefa"), a atividade é o cabeçalho principal. */
function GruposAtividade({ grupos, grande }: { grupos: Bloco['grupos']; grande: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <div key={g.atividadeId}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className={`${grande ? 'text-lg' : 'text-base'} font-semibold`}>
              {g.nome} <span className="text-muted">· {g.agendas.length}</span>
            </h4>
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

- [ ] **Step 5: Build e lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros (sem imports órfãos — `useCare`, `CalendarCheck` saíram).

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/bancada.ts web/src/lib/estacoes.ts web/src/lib/format.ts web/src/pages/BancadaPage.tsx
git commit -m "feat(web): Bancada por grupo, tarefa ou espécie com filtro de período"
```

---

### Task 8: Verificação no navegador e documentação

**Files:**
- Modify: `CLAUDE.md` (seção Structure do web)

- [ ] **Step 1: Subir o ambiente**

Run: `docker restart bonsai_api` e `cd web && npm run dev`. Confirmar `GET http://localhost:3000/api/plantas` com token retorna `grupo` em cada planta.

- [ ] **Step 2: Roteiro manual (conta de teste, viewport ~390px)**

1. Editar uma planta → grupo "Refinamento" → detalhe mostra "Refinamento".
2. Registrar → escolher essa planta → atividade "Transplante" → a opção "Mover para Recém transplantadas" aparece **marcada** → Registrar → detalhe mostra "Recém transplantada · volta para Refinamento em <hoje+15>".
3. Repetir com a opção desmarcada em outra planta → grupo não muda.
4. Perfil → "Dias em Recém transplantadas" = 30 → novo transplante → prazo de 30 dias.
5. Expiração: no banco (`docker compose exec api npx prisma studio` ou SQL), pôr `grupoExpiraEm` no passado → recarregar Coleção → planta volta a "Refinamento" e os campos de retorno ficam vazios.
6. Editar a planta em Recém transplantada e trocar para "Em crescimento" → o texto "volta para" some no detalhe.
7. Coleção → filtro de grupo (cada grupo + "Sem grupo") combinado com espécie e busca.
8. Bancada: sem título "Bancada", sem dica da estação, sem botão "Registrar cuidado sem agendamento". Testar os 3 agrupamentos × 4 períodos; atrasadas sempre no topo; "Concluir grupo" abre `/concluir` com os ids certos; recarregar a página mantém as escolhas.
9. Plantas sem grupo aparecem no bloco "Sem grupo" no fim; sem espécie em "Sem espécie".

- [ ] **Step 3: Atualizar `CLAUDE.md`**

Na linha "Structure:" do web, acrescentar após a menção a `BancadaPage` `/`: ` (agrupa por grupo/tarefa/espécie e filtra por período — `src/lib/bancada.ts`)`, e no fim do parágrafo: ` Grupos fixos da planta (`Planta.grupo`, enum `GrupoPlanta`, um por planta): registrar Transplante com `moverRecemTransplantada` leva a "Recém transplantada" por `transplante_dias` (padrão 15) e depois volta ao `grupoAnterior` — resolvido na leitura de `GET /plantas` (`planta/dominio/grupo.ts`).`

- [ ] **Step 4: Rodar tudo uma última vez**

Run: `cd server && npm test && npm run build` e `cd web && npm run build && npm run lint`
Expected: tudo verde.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: grupos de plantas e nova Bancada no CLAUDE.md"
```
