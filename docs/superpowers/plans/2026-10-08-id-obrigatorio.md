# ID da planta obrigatório e numérico — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toda planta tem um ID (`Planta.identificador`) inteiro positivo, único por usuário; sem ID informado na criação, o servidor gera o próximo número livre.

**Architecture:** Migration SQL converte a coluna `TEXT NULL` em `INTEGER NOT NULL` (numéricos aproveitados, resto numerado depois do maior). O `CreatePlantaUseCase` gera `maiorIdentificador + 1` com nova tentativa em P2002. No web, `identificador` vira `number` e helpers puros em `format.ts` (`plantaNome`, `plantaTitulo`, `plantaRotulo`, `plantaCodigoNome`) centralizam a exibição.

**Tech Stack:** Prisma + PostgreSQL, Express + Zod 3, Jest (server); React + Vite + TS, Vitest (web).

**Spec:** `docs/superpowers/specs/2026-10-08-id-obrigatorio-design.md`

## Global Constraints

- Idioma: português em código, comentários e UI.
- ID: inteiro, `>= 1` e `<= 999999999` (cabe em `INTEGER`), único por `(usuarioId, identificador)`.
- Códigos antigos com letras são descartados (sem guardar em observações).
- Mensagem de conflito (criar e editar): `Já existe uma planta com esse código.` com HTTP 409.
- Dica do campo na criação: `Deixe vazio para gerar automaticamente`. Campo vem vazio.
- `mobile_app/` não é tocado.
- Commits direto na `main`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Não dar push** sem o usuário confirmar (push = deploy).
- Depois de mudar `server/`: `docker restart bonsai_api` (aplica migrations e recarrega).

## Review Focus

1. Código digitado "0"/"000" na triagem: não pode oferecer "Criar planta #0" (a API rejeita) — Task 3 bloqueia.
2. ID enorme (ex.: 10 dígitos): API responde 400, não 500 de overflow do Postgres — Task 1 testa o `max`.
3. Editar com o ID de outra planta: 409 com a mensagem, não 400 genérico — Task 1 trata P2002 no `update`.
4. Planta sem nome e sem espécie (criada pela triagem): título "Planta #N", sem "#N · Planta #N" duplicado — Task 2 testa `plantaCodigoNome`.
5. Busca na Coleção/PlantasPicker com `identificador` numérico: não pode quebrar com `.toLowerCase()` em número — Task 3 converte com `String()`.

---

### Task 1: Server — coluna inteira, migração e geração automática

**Files:**
- Modify: `server/prisma/schema.prisma:158`
- Create: `server/prisma/migrations/20261008150000_id_planta_obrigatorio/migration.sql`
- Modify: `server/src/modules/planta/types/planta.types.ts`
- Modify: `server/src/modules/planta/planta.schema.ts`
- Create: `server/src/modules/planta/planta.schema.test.ts`
- Modify: `server/src/modules/planta/repositories/prisma-planta.repository.ts`
- Modify: `server/src/modules/planta/use-cases/create-planta.use-case.ts`
- Modify: `server/src/modules/planta/use-cases/create-planta.use-case.test.ts`
- Modify (fixtures/mocks): `server/src/modules/planta/use-cases/{atualizar-grupos-automaticos,delete-planta.use-case,get-planta-by-id.use-case,get-plantas-by-user.use-case,update-planta.use-case}.test.ts`
- Modify: `server/src/modules/planta/planta.controller.ts` (update: P2002 → 409)

**Interfaces:**
- Produces: `PlantaRepository.maiorIdentificador(usuarioId: string): Promise<number>` (0 sem plantas); `PlantaWithEspecie.identificador: number`; `CreatePlantaRequestDTO.identificador?: number`; `CreatePlantaDTO.identificador: number`; `UpdatePlantaRequestDTO.identificador?: number`; `UpdatePlantaDTO.identificador?: number`. JSON das rotas de planta/agenda/rotina passa a ter `identificador` numérico.

- [ ] **Step 1: Prisma schema**

Em `server/prisma/schema.prisma`, trocar a linha `identificador    String?` por:

```prisma
  /// ID numérico da planta, único por usuário (gerado se não informado).
  identificador    Int
```

- [ ] **Step 2: Migration SQL**

Criar `server/prisma/migrations/20261008150000_id_planta_obrigatorio/migration.sql`:

```sql
-- ID da planta obrigatório e numérico. Códigos com letras são descartados.
ALTER TABLE "Planta" ADD COLUMN "identificador_num" INTEGER;

-- 1. IDs só com dígitos (1..999999999, ignorando zeros à esquerda) viram número.
--    Em colisão (ex.: "011" e "11") fica a planta mais antiga.
WITH numericos AS (
  SELECT "id",
         CAST(LTRIM("identificador", '0') AS INTEGER) AS "num",
         ROW_NUMBER() OVER (
           PARTITION BY "usuarioId", CAST(LTRIM("identificador", '0') AS INTEGER)
           ORDER BY "createdAt", "id"
         ) AS "ordem"
  FROM "Planta"
  WHERE LTRIM("identificador", '0') ~ '^[1-9][0-9]{0,8}$'
)
UPDATE "Planta" p SET "identificador_num" = n."num"
FROM numericos n
WHERE p."id" = n."id" AND n."ordem" = 1;

-- 2. As demais recebem, por ordem de criação, os números depois do maior do usuário.
WITH base AS (
  SELECT "usuarioId", COALESCE(MAX("identificador_num"), 0) AS "maior"
  FROM "Planta"
  GROUP BY "usuarioId"
), novos AS (
  SELECT p."id",
         b."maior" + ROW_NUMBER() OVER (PARTITION BY p."usuarioId" ORDER BY p."createdAt", p."id") AS "num"
  FROM "Planta" p
  JOIN base b ON b."usuarioId" = p."usuarioId"
  WHERE p."identificador_num" IS NULL
)
UPDATE "Planta" p SET "identificador_num" = novos."num"
FROM novos
WHERE p."id" = novos."id";

-- 3. Troca a coluna
DROP INDEX "Planta_usuarioId_identificador_key";
ALTER TABLE "Planta" DROP COLUMN "identificador";
ALTER TABLE "Planta" RENAME COLUMN "identificador_num" TO "identificador";
ALTER TABLE "Planta" ALTER COLUMN "identificador" SET NOT NULL;
CREATE UNIQUE INDEX "Planta_usuarioId_identificador_key" ON "Planta"("usuarioId", "identificador");
```

- [ ] **Step 3: Aplicar no banco local e conferir**

Antes, anotar o estado atual (o banco local tem os 3 casos: `AZ-03`/`JB-01`, `011`/`7`, NULL):

```bash
U=$(docker exec bonsai_db printenv POSTGRES_USER); D=$(docker exec bonsai_db printenv POSTGRES_DB)
docker exec bonsai_db psql -U $U -d $D -c 'select "usuarioId", identificador, "createdAt" from "Planta" order by "usuarioId", "createdAt";'
docker restart bonsai_api && sleep 25 && docker logs --tail 15 bonsai_api
docker exec bonsai_db psql -U $U -d $D -c 'select "usuarioId", identificador, "createdAt" from "Planta" order by "usuarioId", identificador;'
```

Expected: log com `All migrations have been successfully applied` (ou a migration listada); todas as plantas com número, sem repetição por usuário; numéricos antigos preservados (`011` → `11`); os com letras/NULL numerados depois do maior, na ordem de `createdAt`.

Depois, checar que o banco migrado bate com o `schema.prisma` e gerar o client no host:

```bash
docker exec bonsai_api npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma
cd server && npx prisma generate
```

Expected do `migrate diff`: `No difference detected.` (se apontar diferença, corrigir a migration — não o schema).

- [ ] **Step 4: Tipos**

Em `server/src/modules/planta/types/planta.types.ts`:
- `CreatePlantaRequestDTO.identificador?: string;` → `identificador?: number;`
- `UpdatePlantaRequestDTO.identificador?: string | null;` → `identificador?: number;`
- `CreatePlantaDTO.identificador?: string;` → `identificador: number;`
- `UpdatePlantaDTO.identificador?: string | null;` → `identificador?: number;`
- `PlantaWithEspecie.identificador: string | null;` → `identificador: number;`
- Na interface `PlantaRepository`, depois de `existsByIdAndUser`:

```ts
  /** Maior ID (identificador) das plantas do usuário; 0 se ele não tem plantas. */
  maiorIdentificador(usuarioId: string): Promise<number>;
```

- [ ] **Step 5: Ajustar mocks e fixtures dos testes existentes**

Nos 6 arquivos de teste que montam `mockPlantaRepository` (`atualizar-grupos-automaticos`, `create-planta`, `delete-planta`, `get-planta-by-id`, `get-plantas-by-user`, `update-planta`), adicionar ao objeto, depois de `existsByIdAndUser: jest.fn(),`:

```ts
      maiorIdentificador: jest.fn().mockResolvedValue(0),
```

E trocar toda fixture `identificador: null,` por `identificador: 1,` (aparece em `create-planta`, `get-planta-by-id`, `get-plantas-by-user` (2×), `update-planta`). No `create-planta.use-case.test.ts`, o teste "só código e capa" passa `identificador: '42'` → trocar por `identificador: 42`.

- [ ] **Step 6: Testes do schema (falhando)**

Criar `server/src/modules/planta/planta.schema.test.ts`:

```ts
import { createPlantaSchema, updatePlantaSchema } from './planta.schema';

const criar = (identificador: unknown) => createPlantaSchema.safeParse({ body: { identificador } });
const editar = (identificador: unknown) =>
  updatePlantaSchema.safeParse({ body: { identificador }, params: { id: '3f8c1c1e-7a52-4d8e-9a43-2a4c5b6d7e8f' } });

describe('identificador nos schemas de planta', () => {
  it('criar: aceita número e texto só com dígitos (a triagem manda texto)', () => {
    expect(criar(14)).toMatchObject({ success: true, data: { body: { identificador: 14 } } });
    expect(criar('14')).toMatchObject({ success: true, data: { body: { identificador: 14 } } });
  });

  it('criar: sem identificador é válido (o servidor gera)', () => {
    const r = createPlantaSchema.safeParse({ body: {} });
    expect(r.success).toBe(true);
    expect(r.success && r.data.body.identificador).toBeUndefined();
  });

  it.each(['JB-03', 0, -3, 1.5, 1_000_000_000, ''])('criar: rejeita %p', (valor) => {
    expect(criar(valor).success).toBe(false);
  });

  it('editar: aceita número e omitido, rejeita null', () => {
    expect(editar(7)).toMatchObject({ success: true, data: { body: { identificador: 7 } } });
    expect(updatePlantaSchema.safeParse({ body: {}, params: { id: '3f8c1c1e-7a52-4d8e-9a43-2a4c5b6d7e8f' } }).success).toBe(true);
    expect(editar(null).success).toBe(false);
  });
});
```

Run: `cd server && npm test -- planta.schema`
Expected: FAIL (hoje `identificador` é `z.string()`: `14` é rejeitado e `'JB-03'` é aceito).

- [ ] **Step 7: Schema Zod**

Em `server/src/modules/planta/planta.schema.ts`, depois de `GrupoPlantaEnum`:

```ts
// ID da planta: inteiro positivo. Aceita texto só com dígitos ("14"), que é como a triagem de fotos manda.
const IdentificadorSchema = z.preprocess(
  (v) => (typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : v),
  z
    .number({ invalid_type_error: 'O código da planta deve ser um número.' })
    .int('O código da planta deve ser um número inteiro.')
    .min(1, 'O código da planta deve ser maior que zero.')
    .max(999_999_999, 'O código da planta é grande demais.'),
);
```

E trocar `identificador: z.string().optional(),` (create) e `identificador: z.string().optional().nullable(),` (update) por `identificador: IdentificadorSchema.optional(),`.

(Usar `preprocess` e não `z.coerce`: `coerce` transformaria `''`/`null` em `0` e `'JB-03'` em `NaN` com mensagem ruim; aqui `''`, `null` e `'JB-03'` caem no `invalid_type_error`.)

Run: `cd server && npm test -- planta.schema`
Expected: PASS.

- [ ] **Step 8: Testes da geração automática (falhando)**

Em `server/src/modules/planta/use-cases/create-planta.use-case.test.ts`, dentro de `describe('execute', ...)`, adicionar:

```ts
    describe('ID automático', () => {
      const conflito = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

      it('sem ID, usa o maior ID do usuário + 1', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValue(13);
        mockPlantaRepository.create.mockResolvedValue({ ...mockCreatedPlanta, identificador: 14 });

        await createPlantaUseCase.execute({ usuarioId: 'user-123' });

        expect(mockPlantaRepository.maiorIdentificador).toHaveBeenCalledWith('user-123');
        expect(mockPlantaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ identificador: 14 }));
      });

      it('primeira planta do usuário recebe 1', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValue(0);
        mockPlantaRepository.create.mockResolvedValue(mockCreatedPlanta);

        await createPlantaUseCase.execute({ usuarioId: 'user-123' });

        expect(mockPlantaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ identificador: 1 }));
      });

      it('com ID informado, respeita e não consulta o maior', async () => {
        mockPlantaRepository.create.mockResolvedValue({ ...mockCreatedPlanta, identificador: 7 });

        await createPlantaUseCase.execute({ usuarioId: 'user-123', identificador: 7 });

        expect(mockPlantaRepository.maiorIdentificador).not.toHaveBeenCalled();
        expect(mockPlantaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ identificador: 7 }));
      });

      it('conflito no ID gerado (criação simultânea): recalcula e tenta de novo', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValueOnce(4).mockResolvedValueOnce(5);
        mockPlantaRepository.create.mockRejectedValueOnce(conflito).mockResolvedValueOnce(mockCreatedPlanta);

        await createPlantaUseCase.execute({ usuarioId: 'user-123' });

        expect(mockPlantaRepository.create).toHaveBeenCalledTimes(2);
        expect(mockPlantaRepository.create).toHaveBeenLastCalledWith(expect.objectContaining({ identificador: 6 }));
      });

      it('desiste depois de 3 conflitos seguidos', async () => {
        mockPlantaRepository.maiorIdentificador.mockResolvedValue(4);
        mockPlantaRepository.create.mockRejectedValue(conflito);

        await expect(createPlantaUseCase.execute({ usuarioId: 'user-123' })).rejects.toBe(conflito);
        expect(mockPlantaRepository.create).toHaveBeenCalledTimes(3);
      });

      it('conflito com ID informado pelo usuário não tenta de novo', async () => {
        mockPlantaRepository.create.mockRejectedValue(conflito);

        await expect(createPlantaUseCase.execute({ usuarioId: 'user-123', identificador: 7 })).rejects.toBe(conflito);
        expect(mockPlantaRepository.create).toHaveBeenCalledTimes(1);
      });
    });
```

Os testes antigos que criam sem `identificador` e checam `toHaveBeenCalledWith({...dto})` passam a receber também `identificador: 1` (mock do maior = 0). Ajustar esses `expect` para incluir `identificador: 1`:
- "deve criar uma planta com sucesso quando a espécie existe": `{ ...mockCreatePlantaDTO, dataAquisicao: new Date(...), identificador: 1 }`
- "deve criar uma planta com campos opcionais nulos": `{ ...minimalCreateDTO, identificador: 1 }`
- demais casos sem `identificador` no DTO (ex.: "com fotoCapaUrl"): idem, acrescentar `identificador: 1`.

Run: `cd server && npm test -- create-planta`
Expected: FAIL nos novos testes (`maiorIdentificador` não é chamado; `create` recebe sem `identificador`).

- [ ] **Step 9: Implementar no use case**

Substituir `server/src/modules/planta/use-cases/create-planta.use-case.ts` por:

```ts
import { CreatePlantaRequestDTO, CreatePlantaDTO, PlantaWithEspecie, PlantaRepository, EspecieRepository } from '../types/planta.types';

/** Tentativas de gerar o ID quando outra criação simultânea pega o mesmo número. */
const TENTATIVAS_ID_AUTOMATICO = 3;

export class CreatePlantaUseCase {
  constructor(
    private plantaRepository: PlantaRepository,
    private especieRepository: EspecieRepository
  ) {}

  async execute(data: CreatePlantaRequestDTO): Promise<PlantaWithEspecie> {
    // Espécie é opcional (planta criada só com código + foto); se vier, precisa existir
    if (data.especieId && !(await this.especieRepository.existsById(data.especieId))) {
      throw new Error('Espécie não encontrada');
    }

    // Transformar dataAquisicao de string para Date se fornecida
    const base = {
      ...data,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : undefined,
    };

    // ID informado pelo usuário: conflito vira 409 no controller, sem nova tentativa
    if (data.identificador !== undefined) {
      return this.plantaRepository.create({ ...base, identificador: data.identificador });
    }

    // Sem ID: próximo número livre do usuário
    for (let tentativa = 1; ; tentativa++) {
      const createData: CreatePlantaDTO = {
        ...base,
        identificador: (await this.plantaRepository.maiorIdentificador(data.usuarioId)) + 1,
      };
      try {
        return await this.plantaRepository.create(createData);
      } catch (error: any) {
        if (error?.code !== 'P2002' || tentativa >= TENTATIVAS_ID_AUTOMATICO) throw error;
      }
    }
  }
}
```

- [ ] **Step 10: Repositório**

Em `server/src/modules/planta/repositories/prisma-planta.repository.ts`, depois de `existsByIdAndUser`:

```ts
  async maiorIdentificador(usuarioId: string): Promise<number> {
    const { _max } = await this.prisma.planta.aggregate({ where: { usuarioId }, _max: { identificador: true } });
    return _max.identificador ?? 0;
  }
```

- [ ] **Step 11: Controller — 409 também ao editar**

Em `server/src/modules/planta/planta.controller.ts`, no `catch` do `update`, antes do `return res.status(400)...`:

```ts
      // Violação de unicidade (usuarioId + identificador)
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'Já existe uma planta com esse código.' });
      }
```

- [ ] **Step 12: Rodar tudo e compilar**

Run: `cd server && npm test` → Expected: todos PASS.
Run: `cd server && npm run build` → Expected: sem erros de tipo (pega qualquer outro uso de `identificador` como string).

- [ ] **Step 13: Smoke test na API local**

```bash
docker restart bonsai_api && sleep 25
```

Logar com a conta local de teste (ver memória `local-browser-testing`) via `POST http://localhost:3000/api/auth/login` e, com o token:
- `POST /api/plantas` com `{}` → 201 com `identificador` = maior + 1.
- `POST /api/plantas` com `{"identificador":"<um ID existente>"}` → 409 `Já existe uma planta com esse código.`
- `POST /api/plantas` com `{"identificador":"JB-03"}` → 400.
- `PUT /api/plantas/<id>` com `{"identificador": <ID de outra planta>}` → 409.

Apagar as plantas criadas no teste (`DELETE /api/plantas/<id>`).

- [ ] **Step 14: Commit**

```bash
git add server/prisma server/src/modules/planta
git commit -m "feat(api): ID da planta obrigatório e numérico, gerado se não informado

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Web — helpers de exibição da planta

**Files:**
- Modify: `web/src/lib/format.ts:5-6` e `:96-98`
- Create: `web/src/lib/format.test.ts`

**Interfaces:**
- Produces (em `@/lib/format`):
  - `type PlantaRef = { nome?: string | null; identificador?: number | null; especie?: { nomeComum?: string | null; nomeCientifico?: string | null } | null } | null | undefined`
  - `plantaNome(p: PlantaRef): string | null` — apelido → nome comum → nome científico → `null`
  - `plantaTitulo(p: PlantaRef): string` — `plantaNome` → `Planta #N` → `Planta sem nome`
  - `plantaRotulo(p: PlantaRef): string` — `#N` → `plantaNome` → `Planta`
  - `plantaCodigoNome(p: PlantaRef): string` — `#N · nome` (só o que existir) → `Planta`

- [ ] **Step 1: Testes (falhando)**

Criar `web/src/lib/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { plantaCodigoNome, plantaNome, plantaRotulo, plantaTitulo } from './format';

const ficus = { nomeComum: 'Ficus', nomeCientifico: 'Ficus microcarpa' };

describe('plantaNome', () => {
  it('apelido, depois nome comum, depois científico', () => {
    expect(plantaNome({ nome: 'Vovó', identificador: 3, especie: ficus })).toBe('Vovó');
    expect(plantaNome({ identificador: 3, especie: ficus })).toBe('Ficus');
    expect(plantaNome({ identificador: 3, especie: { nomeCientifico: 'Ficus microcarpa' } })).toBe('Ficus microcarpa');
  });

  it('sem apelido nem espécie: null (o ID não é nome)', () => {
    expect(plantaNome({ identificador: 3 })).toBeNull();
  });
});

describe('plantaTitulo', () => {
  it('usa o nome quando há', () => {
    expect(plantaTitulo({ nome: 'Vovó', identificador: 3 })).toBe('Vovó');
    expect(plantaTitulo({ identificador: 3, especie: ficus })).toBe('Ficus');
  });

  it('sem nome nem espécie: "Planta #N"', () => {
    expect(plantaTitulo({ identificador: 14 })).toBe('Planta #14');
  });

  it('sem nada', () => {
    expect(plantaTitulo(undefined)).toBe('Planta sem nome');
  });
});

describe('plantaRotulo', () => {
  it('o ID tem prioridade, com #', () => {
    expect(plantaRotulo({ nome: 'Vovó', identificador: 3 })).toBe('#3');
  });

  it('sem ID cai no nome', () => {
    expect(plantaRotulo({ nome: 'Vovó' })).toBe('Vovó');
    expect(plantaRotulo(null)).toBe('Planta');
  });
});

describe('plantaCodigoNome', () => {
  it('"#N · nome"', () => {
    expect(plantaCodigoNome({ identificador: 3, especie: ficus })).toBe('#3 · Ficus');
  });

  it('sem nome nem espécie não repete o ID', () => {
    expect(plantaCodigoNome({ identificador: 14 })).toBe('#14');
  });

  it('sem nada', () => {
    expect(plantaCodigoNome(undefined)).toBe('Planta');
  });
});
```

Run: `cd web && npx vitest run src/lib/format.test.ts`
Expected: FAIL (`plantaNome`/`plantaCodigoNome` não existem).

- [ ] **Step 2: Implementar**

Em `web/src/lib/format.ts`, substituir o `plantaTitulo` (linhas 5-6) por:

```ts
/** O mínimo para nomear uma planta (Planta, Agenda['planta'], Rotina['planta'], alvo da triagem). */
export type PlantaRef =
  | {
      nome?: string | null;
      identificador?: number | null;
      especie?: { nomeComum?: string | null; nomeCientifico?: string | null } | null;
    }
  | null
  | undefined;

/** Apelido ou espécie — sem o ID; null se não houver nenhum. */
export const plantaNome = (p: PlantaRef) => p?.nome || p?.especie?.nomeComum || p?.especie?.nomeCientifico || null;

export const plantaTitulo = (p: PlantaRef) =>
  plantaNome(p) || (p?.identificador != null ? `Planta #${p.identificador}` : 'Planta sem nome');
```

E substituir o `plantaRotulo` (linhas 96-98, com o comentário) por:

```ts
/** Rótulo curto para identificar a planta: o ID (#14) tem prioridade. */
export const plantaRotulo = (p: PlantaRef) => (p?.identificador != null ? `#${p.identificador}` : plantaNome(p) || 'Planta');

/** "#14 · Ficus" — ID e nome juntos, para listas de escolha. */
export const plantaCodigoNome = (p: PlantaRef) =>
  [p?.identificador != null ? `#${p.identificador}` : null, plantaNome(p)].filter(Boolean).join(' · ') || 'Planta';
```

Se o import de `Agenda`/`Planta` em `format.ts` ficar sem uso, removê-lo do `import type` (o lint acusa).

Run: `cd web && npx vitest run src/lib/format.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

(O build completo do web só passa depois da Task 3 — os tipos `Planta.identificador` ainda são `string`. Rodar só os testes aqui.)

```bash
git add web/src/lib/format.ts web/src/lib/format.test.ts
git commit -m "feat(web): helpers de nome/rótulo da planta com o ID numérico

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Web — `identificador: number` em tipos, formulários, triagem e telas

**Files:**
- Modify: `web/src/types.ts:56`
- Modify: `web/src/lib/endpoints.ts:37`
- Modify: `web/src/pages/AddPlantPage.tsx:95,181-183`
- Modify: `web/src/pages/EditPlantPage.tsx:37,56,107-109,146`
- Modify: `web/src/lib/loteFotos.ts:27,56,61,100,122`
- Modify: `web/src/components/TriagemFotos.tsx:27,40,45,110-116`
- Modify: `web/src/pages/RegistrarPage.tsx:117`
- Modify: `web/src/pages/BatchPhotosPage.tsx:206`
- Modify: `web/src/components/care/PlantasPicker.tsx:35,109-110`
- Modify: `web/src/pages/CollectionPage.tsx:78,218`
- Modify: `web/src/components/bancada/LinhaTarefa.tsx:16`
- Modify: `web/src/pages/ConcluirPage.tsx:171,277`
- Modify: `web/src/pages/TarefaPage.tsx:103`
- Modify: `web/src/components/care/RotinaSheet.tsx:75`

**Interfaces:**
- Consumes: `plantaNome`, `plantaTitulo`, `plantaRotulo`, `plantaCodigoNome` (Task 2); API devolve `identificador: number`, aceita número ou texto só com dígitos (Task 1).
- Produces: `Planta.identificador: number`; `PlantaInput.identificador?: number`; `Alvo.identificador: number`.

- [ ] **Step 1: Tipos**

- `web/src/types.ts` (`interface Planta`): `identificador?: string | null;` → `identificador: number;`
- `web/src/lib/endpoints.ts` (`PlantaInput`): `identificador?: string | null;` → `identificador?: number;`

Run: `cd web && npx tsc -b` — a lista de erros é o roteiro dos próximos passos.

- [ ] **Step 2: AddPlantPage**

Linha ~95: `identificador: identificador.trim() || undefined,` → `identificador: Number(identificador) || undefined,` (vazio ou "0" → o servidor gera)

Linhas ~181-183, trocar o `Field` do código por:

```tsx
            <Field label="Código / etiqueta" hint="Deixe vazio para gerar automaticamente">
              <input
                className="input"
                inputMode="numeric"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value.replace(/\D/g, ''))}
                placeholder="#"
              />
            </Field>
```

Ajustar o texto de ajuda da seção (linha ~178) de "Opcional — use um apelido, um código de etiqueta, ou os dois." para "Opcional — um apelido e o número da etiqueta.".

- [ ] **Step 3: EditPlantPage**

- Linha ~37: `useState(p.identificador ?? '')` → `useState(String(p.identificador))`
- Linha ~56: `identificador: identificador.trim() || null,` → `identificador: Number(identificador),`
- Linhas ~107-109:

```tsx
        <Field label="Código / etiqueta">
          <input
            className="input"
            inputMode="numeric"
            required
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value.replace(/\D/g, ''))}
          />
        </Field>
```

- Linha ~146: `<Button type="submit" block loading={salvando}>` → `<Button type="submit" block loading={salvando} disabled={!Number(identificador)}>` (vazio ou "0" não salva). Se `Button` não aceitar `disabled`, conferir as props em `web/src/components/` e usar a equivalente.

- [ ] **Step 4: loteFotos**

Em `web/src/lib/loteFotos.ts`:
- `Alvo.identificador?: string | null;` → `identificador: number;`
- linha ~56: `novas.map((c) => ({ id: PREFIXO_NOVA + c, identificador: c, nova: true }))` → `identificador: Number(c)`
- linha ~61: `for (const a of alvos) if (a.identificador) mapa.set(normalizarCodigo(a.identificador), a);` → `for (const a of alvos) mapa.set(String(a.identificador), a);`
- linha ~100: `return { id: PREFIXO_NOVA + c, identificador: c, nova: true };` → `identificador: Number(c)`
- linha ~122: `plantasApi.create({ identificador: codigo, ... })` → `identificador: Number(codigo)`

(`normalizarCodigo` continua para o texto digitado; `String(n)` de um número já está normalizado.)

- [ ] **Step 5: TriagemFotos**

Em `web/src/components/TriagemFotos.tsx`:
- linhas ~27 e ~40: `porId.get(pid)?.identificador ?? ''` → `String(porId.get(pid)?.identificador ?? '')`
- linha ~45: `if (alvo?.identificador) setAnterior(alvo.identificador);` → `if (alvo) setAnterior(String(alvo.identificador));`
- Bloco `) : digitado ? (` (linhas ~110-116) que oferece "Criar planta #X": só oferecer quando o número é válido. Trocar a condição `digitado ?` por `Number(normalizarCodigo(digitado)) > 0 ?` — "0"/"000" cai no ramo seguinte (o mesmo de campo vazio).

- [ ] **Step 6: Listas com "#N · nome"**

- `web/src/pages/RegistrarPage.tsx` ~117 (`tituloDe`):

```ts
    return alvo?.nova ? `#${alvo.identificador} · Planta nova` : plantaCodigoNome(alvo);
```

- `web/src/pages/BatchPhotosPage.tsx` ~206: `#{p?.identificador} · {plantaTitulo(p)}` → `{plantaCodigoNome(p)}`
- `web/src/components/care/PlantasPicker.tsx` ~109-110: `{p.identificador ? `#${p.identificador} · ` : ''}{plantaTitulo(p)}` → `{plantaCodigoNome(p)}`
- `web/src/components/care/RotinaSheet.tsx` ~75: `{rotina.planta?.identificador || rotina.planta?.nome || 'Planta'}` → `{plantaCodigoNome(rotina.planta)}`

Atualizar os imports de `@/lib/format` em cada arquivo (tirar `plantaTitulo` onde ficar sem uso).

- [ ] **Step 7: Busca com número**

- `web/src/components/care/PlantasPicker.tsx` ~35 e `web/src/pages/CollectionPage.tsx` ~78: no array da busca, `p.identificador` → `String(p.identificador)`.

- [ ] **Step 8: Complementos que dependiam de "tem ID?"**

- `web/src/pages/CollectionPage.tsx` ~218: `{p.identificador && p.nome ? ` · ${p.identificador}` : ''}` → `{` · #${p.identificador}`}`
- `web/src/components/bancada/LinhaTarefa.tsx` ~16: `const nome = p?.identificador ? p?.nome || p?.especie?.nomeComum : p?.especie?.nomeComum;` → `const nome = plantaNome(p);`
- `web/src/pages/ConcluirPage.tsx` ~171: `[t.planta?.identificador && t.planta?.nome ? t.planta.nome : null, t.atividade?.nome]` → `[plantaNome(t.planta), t.atividade?.nome]`
- `web/src/pages/ConcluirPage.tsx` ~277: `{t.planta?.identificador && t.planta?.nome && <p className="truncate text-sm text-muted">{t.planta.nome}</p>}` → `{plantaNome(t.planta) && <p className="truncate text-sm text-muted">{plantaNome(t.planta)}</p>}`
- `web/src/pages/TarefaPage.tsx` ~103: `{agenda.planta?.identificador && agenda.planta?.nome && <p className="text-sm opacity-90">{agenda.planta.nome}</p>}` → `{plantaNome(agenda.planta) && <p className="text-sm opacity-90">{plantaNome(agenda.planta)}</p>}`

Importar `plantaNome` de `@/lib/format` onde for usado.

- [ ] **Step 9: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: build sem erros de tipo, lint limpo, testes PASS. Se `tsc` apontar outro uso de `identificador` como string não listado aqui, aplicar a mesma regra (exibir com `plantaRotulo`/`plantaCodigoNome`, comparar com `String()`).

Conferir que não sobrou exemplo com letras: `grep -rn "JB-0" web/src` → Expected: nada.

- [ ] **Step 10: Conferir no navegador (local)**

Com `docker restart bonsai_api` feito e `cd web && npm run dev`, na conta local de teste (memória `local-browser-testing`, iframe 390px):
1. Nova planta sem código → tela de concluído e Coleção mostram o número gerado (`· #N` no subtítulo).
2. Nova planta com um código já usado → toast "Já existe uma planta com esse código."
3. Editar: apagar o código desabilita salvar; trocar por um número livre salva.
4. Fotos em lote: digitar "0" não oferece criar; digitar um número novo → "Criar planta #N" → salvar cria a planta com esse número.
5. Bancada, Concluir e página da tarefa mostram `#N` e o nome/espécie ao lado, sem número cru.

Apagar as plantas criadas no teste.

- [ ] **Step 11: Commit**

```bash
git add web/src
git commit -m "feat(web): ID numérico da planta nos formulários, triagem e telas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Documentação

**Files:**
- Modify: `CLAUDE.md` (parágrafo do frontend web)
- Modify: `docs/todo.md`

- [ ] **Step 1: CLAUDE.md**

No parágrafo do frontend web, depois de "`Planta.especieId` opcional: planta sem espécie aparece topo Coleção com "!".", acrescentar:

```
`Planta.identificador` é `Int` obrigatório, único por usuário: sem ID na criação o servidor gera maior + 1 (`CreatePlantaUseCase`, nova tentativa em P2002); exibição via `plantaRotulo` (`#N`), `plantaCodigoNome` (`#N · nome`) e `plantaTitulo` (nome → espécie → `Planta #N`) em `src/lib/format.ts`.
```

- [ ] **Step 2: todo.md**

Marcar o item do ID como feito e anotar:

```markdown
- [x] ID tem q comecar a ser obrigatorio visto que ao adicionar fotos, fazemos tudo pelo fluxo de ID. Logo, caso o usuario nao adicione ID, adicione automaticamente um ID para ele. (veja que o ID tem q sempre ser um numero)
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-id-obrigatorio-design.md): ID virou número obrigatório; sem ID o servidor gera o próximo livre; a migration numerou as plantas antigas (códigos com letras descartados).
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/todo.md
git commit -m "docs: ID da planta obrigatório

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Avisar antes do push**

Não dar push. Avisar o usuário que o push dispara o deploy e que a migration vai renumerar as plantas de produção sem ID ou com letras (códigos com letras descartados); pedir confirmação.
