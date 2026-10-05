# Cuidados em lote — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agendar cuidados para várias plantas (com observação e atalhos de estação), criar planta só com código + foto, e um novo "Registrar cuidado" que começa pelas fotos.

**Architecture:** Backend Express + Prisma em Clean Architecture (use cases testados com repositórios mockados). Frontend React + Vite + TanStack Query, mobile-first. A triagem de fotos por código sai de `BatchPhotosPage` para um hook (`useLoteFotos`) + componente (`TriagemFotos`) compartilhados pelo lote de fotos e pela nova página `/registrar`.

**Tech Stack:** Node/Express, Prisma 5.15 (Postgres), Zod, Jest · React 19, react-router, TanStack Query 5, Tailwind v4, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-05-cuidados-em-lote-design.md`

## Global Constraints

- Idioma: código, comentários, UI e commits em **português**.
- Não tocar em `mobile_app/`.
- Backend: regras de negócio só em use cases; testes AAA com repositórios mockados (`jest.Mocked<...>`); TDD.
- Frontend: chamadas HTTP só em `web/src/lib/endpoints.ts`; cache keys em `web/src/lib/queries.ts`.
- Commits em `develop`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verificação por tarefa: `cd server && npm test` (backend) · `cd web && npm run build && npm run lint` (frontend).
- Testes no navegador só na conta `testeclaude@bonsai.dev` (ou `teste.web` local).

---

## Parte 1 — Agendar para várias plantas

### Task 1: `POST /agendas/lote` com várias plantas e `detalhes`

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts`
- Modify: `server/src/modules/agenda/agenda.schema.ts` (`createAgendasLoteSchema`)
- Modify: `server/src/modules/agenda/use-cases/create-agendas-lote.use-case.ts`
- Modify: `server/src/modules/agenda/repositories/prisma-agenda.repository.ts`
- Modify: `server/src/modules/agenda/agenda.controller.ts` (`createLote`)
- Test: `server/src/modules/agenda/use-cases/create-agendas-lote.use-case.test.ts` (reescrever)
- Modify (mocks): os outros 5 `*.test.ts` de `agenda/use-cases` que montam `AgendaRepository`

**Interfaces:**
- Produces: `CreateAgendasLoteDTO = { plantaIds: string[]; atividadeIds: string[]; dataAgendada: string; detalhes?: string }`; `AgendaRepository.contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>`; body HTTP aceita `plantaIds` (ou `plantaId` legado) + `detalhes`.

- [ ] **Step 1: Tipos.** Em `agenda.types.ts`:

```ts
export interface CreateAgendaDTO {
  plantaId: string;
  atividadeId: string;
  dataAgendada: string;
  observacoes?: string;
  detalhes?: string;
}

export interface CreateAgendasLoteDTO {
  plantaIds: string[];
  atividadeIds: string[];
  dataAgendada: string;
  /** Instrução para quando o cuidado for feito (ex.: qual adubo usar). */
  detalhes?: string;
}
```

e na interface `AgendaRepository`, depois de `checkPlantaBelongsToUser`:

```ts
  /** Quantas das plantas informadas são do usuário. */
  contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>;
```

- [ ] **Step 2: Mocks.** Adicionar `contarPlantasDoUsuario: jest.fn(),` logo após `checkPlantaBelongsToUser: jest.fn(),` nos testes de agenda:

```bash
cd server && for f in create-agenda delete-agenda get-agenda-by-id get-all-agendas-by-user update-agenda; do
  sed -i 's/^\(\s*\)checkPlantaBelongsToUser: jest.fn(),/&\n\1contarPlantasDoUsuario: jest.fn(),/' src/modules/agenda/use-cases/$f.use-case.test.ts
done
```

- [ ] **Step 3: Teste falhando.** Substituir `create-agendas-lote.use-case.test.ts` por:

```ts
import { CreateAgendasLoteUseCase } from './create-agendas-lote.use-case';
import { AgendaRepository } from '../agenda.types';

describe('CreateAgendasLoteUseCase', () => {
  let useCase: CreateAgendasLoteUseCase;
  let repo: jest.Mocked<AgendaRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      createMany: jest.fn().mockResolvedValue([]),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      updateWithResources: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      checkPlantaBelongsToUser: jest.fn(),
      contarPlantasDoUsuario: jest.fn(),
    };
    useCase = new CreateAgendasLoteUseCase(repo);
  });

  const dataAgendada = '2026-10-10T12:00:00.000Z';

  it('cria uma agenda para cada planta × atividade', async () => {
    // Arrange
    repo.contarPlantasDoUsuario.mockResolvedValue(2);
    repo.createMany.mockResolvedValue([{ id: 'a1' }]);

    // Act
    const result = await useCase.execute(
      { plantaIds: ['p1', 'p2'], atividadeIds: ['at-1', 'at-2'], dataAgendada },
      'user-1',
    );

    // Assert
    expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');
    expect(repo.createMany).toHaveBeenCalledWith([
      { plantaId: 'p1', atividadeId: 'at-1', dataAgendada },
      { plantaId: 'p1', atividadeId: 'at-2', dataAgendada },
      { plantaId: 'p2', atividadeId: 'at-1', dataAgendada },
      { plantaId: 'p2', atividadeId: 'at-2', dataAgendada },
    ]);
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('ignora plantas e atividades repetidas', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(1);

    await useCase.execute({ plantaIds: ['p1', 'p1'], atividadeIds: ['at-1', 'at-1'], dataAgendada }, 'user-1');

    expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1'], 'user-1');
    expect(repo.createMany).toHaveBeenCalledWith([{ plantaId: 'p1', atividadeId: 'at-1', dataAgendada }]);
  });

  it('repassa a observação (detalhes) aparada para todas as agendas', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(2);

    await useCase.execute(
      { plantaIds: ['p1', 'p2'], atividadeIds: ['at-1'], dataAgendada, detalhes: '  usar Bioplant ' },
      'user-1',
    );

    expect(repo.createMany).toHaveBeenCalledWith([
      { plantaId: 'p1', atividadeId: 'at-1', dataAgendada, detalhes: 'usar Bioplant' },
      { plantaId: 'p2', atividadeId: 'at-1', dataAgendada, detalhes: 'usar Bioplant' },
    ]);
  });

  it('não grava detalhes em branco', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(1);

    await useCase.execute({ plantaIds: ['p1'], atividadeIds: ['at-1'], dataAgendada, detalhes: '   ' }, 'user-1');

    expect(repo.createMany).toHaveBeenCalledWith([{ plantaId: 'p1', atividadeId: 'at-1', dataAgendada }]);
  });

  it('lança erro quando alguma planta não é do usuário', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(1);

    await expect(
      useCase.execute({ plantaIds: ['p1', 'p2'], atividadeIds: ['at-1'], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Acesso negado. A planta não pertence a si.');
    expect(repo.createMany).not.toHaveBeenCalled();
  });

  it('lança erro sem atividades', async () => {
    await expect(
      useCase.execute({ plantaIds: ['p1'], atividadeIds: [], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Informe ao menos um cuidado.');
  });

  it('lança erro sem plantas', async () => {
    await expect(
      useCase.execute({ plantaIds: [], atividadeIds: ['at-1'], dataAgendada }, 'user-1'),
    ).rejects.toThrow('Informe ao menos uma planta.');
  });

  it('lança erro acima do limite de tarefas', async () => {
    const plantaIds = Array.from({ length: 101 }, (_, i) => `p${i}`);
    const atividadeIds = Array.from({ length: 20 }, (_, i) => `at${i}`);

    await expect(useCase.execute({ plantaIds, atividadeIds, dataAgendada }, 'user-1')).rejects.toThrow(
      'Máximo de 2000 tarefas por vez.',
    );
    expect(repo.contarPlantasDoUsuario).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4:** `cd server && npm test -- create-agendas-lote` → FAIL (use case ainda usa `plantaId`).

- [ ] **Step 5: Use case.** Substituir `create-agendas-lote.use-case.ts`:

```ts
import { AgendaRepository, CreateAgendasLoteDTO } from '../agenda.types';

export const MAX_AGENDAS_LOTE = 2000;

/** Agenda vários cuidados de uma vez para várias plantas, na mesma data (tudo ou nada). */
export class CreateAgendasLoteUseCase {
  constructor(private agendaRepository: AgendaRepository) {}

  async execute(data: CreateAgendasLoteDTO, usuarioId: string) {
    const atividadeIds = [...new Set(data.atividadeIds)];
    const plantaIds = [...new Set(data.plantaIds)];
    if (!atividadeIds.length) throw new Error('Informe ao menos um cuidado.');
    if (!plantaIds.length) throw new Error('Informe ao menos uma planta.');
    if (atividadeIds.length * plantaIds.length > MAX_AGENDAS_LOTE) {
      throw new Error(`Máximo de ${MAX_AGENDAS_LOTE} tarefas por vez.`);
    }

    const doUsuario = await this.agendaRepository.contarPlantasDoUsuario(plantaIds, usuarioId);
    if (doUsuario !== plantaIds.length) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }

    const detalhes = data.detalhes?.trim() || undefined;
    return await this.agendaRepository.createMany(
      plantaIds.flatMap((plantaId) =>
        atividadeIds.map((atividadeId) => ({
          plantaId,
          atividadeId,
          dataAgendada: data.dataAgendada,
          ...(detalhes && { detalhes }),
        })),
      ),
    );
  }
}
```

- [ ] **Step 6: Repositório.** Em `prisma-agenda.repository.ts`, trocar `createMany` (até 2000 linhas: um `INSERT` só) e adicionar o contador:

```ts
  async createMany(data: CreateAgendaDTO[]) {
    // Um INSERT só (atômico): até 2000 linhas no lote
    return await prisma.agenda.createManyAndReturn({ data });
  }
```

```ts
  async contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number> {
    return prisma.planta.count({ where: { id: { in: plantaIds }, usuarioId } });
  }
```

- [ ] **Step 7: Schema.** Substituir `createAgendasLoteSchema`:

```ts
export const createAgendasLoteSchema = z.object({
  body: z
    .object({
      /** Legado: uma planta só. */
      plantaId: z.string().uuid({ message: 'ID de planta inválido.' }).optional(),
      plantaIds: z
        .array(z.string().uuid({ message: 'ID de planta inválido.' }))
        .max(500, { message: 'Máximo de 500 plantas por vez.' })
        .optional(),
      atividadeIds: z
        .array(z.string().uuid({ message: 'ID de atividade inválido.' }))
        .min(1, { message: 'Informe ao menos um cuidado.' })
        .max(20, { message: 'Máximo de 20 cuidados por vez.' }),
      dataAgendada: z.string().datetime({ message: 'A data agendada deve ser uma data válida.' }),
      detalhes: z.string().max(2000, { message: 'Observação muito longa.' }).optional(),
    })
    .transform(({ plantaId, plantaIds, ...resto }) => ({
      ...resto,
      plantaIds: plantaIds ?? (plantaId ? [plantaId] : []),
    })),
});
```

- [ ] **Step 8: Controller.** Em `createLote`, trocar os dois `if` de mensagens 400 por:

```ts
      const MENSAGENS_400 = [
        'Informe ao menos um cuidado.',
        'Informe ao menos uma planta.',
        'Máximo de 2000 tarefas por vez.',
      ];
      if (error instanceof Error && MENSAGENS_400.includes(error.message)) {
        return res.status(400).json({ error: error.message });
      }
```

(mantendo o `if` do 403 antes dele).

- [ ] **Step 9:** `cd server && npm test -- agenda && npm run build` → tudo PASS, build ok.

- [ ] **Step 10: Commit**

```bash
git add server/src/modules/agenda
git commit -m "feat(api): agendar cuidados para várias plantas com observação (POST /agendas/lote)"
```

---

### Task 2: Atalhos de data (estações do hemisfério sul) e endpoint no web

**Files:**
- Create: `web/src/lib/estacoes.ts`
- Modify: `web/src/lib/endpoints.ts` (`agendasApi.createLote`)

**Interfaces:**
- Produces: `atalhosDeData(hoje?: Date): { label: string; data: string /* AAAA-MM-DD */ }[]` (12 itens, nesta ordem: Amanhã, 1 semana, 1 mês, 3 meses, Começo/Final da primavera, do verão, do outono, do inverno); `agendasApi.createLote(body: { plantaIds: string[]; atividadeIds: string[]; dataAgendada: string; detalhes?: string })`.

- [ ] **Step 1: `estacoes.ts`:**

```ts
import { toDateInput } from './format';

/** Estações no hemisfério sul (Brasil) — aproximação das datas astronômicas, [mês, dia]. */
const ESTACOES = [
  { nome: 'da primavera', comeco: [9, 22], final: [12, 20] },
  { nome: 'do verão', comeco: [12, 21], final: [3, 19] },
  { nome: 'do outono', comeco: [3, 20], final: [6, 20] },
  { nome: 'do inverno', comeco: [6, 21], final: [9, 21] },
] as const;

const meioDia = (ano: number, mes0: number, dia: number) => new Date(ano, mes0, dia, 12);

/** Próxima ocorrência de [mês, dia] a partir de amanhã. */
export function proximaOcorrencia([mes, dia]: readonly [number, number], hoje = new Date()): Date {
  const amanha = meioDia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  const esteAno = meioDia(hoje.getFullYear(), mes - 1, dia);
  return esteAno >= amanha ? esteAno : meioDia(hoje.getFullYear() + 1, mes - 1, dia);
}

/** Soma meses de calendário; 31/01 + 1 mês = 28/02 (ou 29). */
export function somarMeses(base: Date, meses: number): Date {
  const alvo = meioDia(base.getFullYear(), base.getMonth() + meses, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(base.getDate(), ultimoDia));
  return alvo;
}

export interface AtalhoData {
  label: string;
  /** AAAA-MM-DD, pronto para <input type="date"> */
  data: string;
}

/** Atalhos do agendamento: prazos curtos + começo/final de cada estação (sempre a próxima). */
export function atalhosDeData(hoje = new Date()): AtalhoData[] {
  const base = meioDia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const emDias = (n: number) => meioDia(base.getFullYear(), base.getMonth(), base.getDate() + n);
  const iso = (d: Date) => toDateInput(d.toISOString());
  return [
    { label: 'Amanhã', data: iso(emDias(1)) },
    { label: '1 semana', data: iso(emDias(7)) },
    { label: '1 mês', data: iso(somarMeses(base, 1)) },
    { label: '3 meses', data: iso(somarMeses(base, 3)) },
    ...ESTACOES.flatMap((e) => [
      { label: `Começo ${e.nome}`, data: iso(proximaOcorrencia(e.comeco, hoje)) },
      { label: `Final ${e.nome}`, data: iso(proximaOcorrencia(e.final, hoje)) },
    ]),
  ];
}
```

- [ ] **Step 2: Conferir as datas** (sem framework de teste no web; script descartável no scratchpad):

```bash
cd web && npx --yes tsx --tsconfig tsconfig.app.json -e "import { atalhosDeData } from './src/lib/estacoes'; console.table(atalhosDeData(new Date(2026, 9, 5, 9)))"
```

(`--tsconfig` faz o `tsx` resolver o alias `@/` usado por `format.ts`.)

Expected (hoje = 05/10/2026): Amanhã 2026-10-06 · 1 semana 2026-10-12 · 1 mês 2026-11-05 · 3 meses 2027-01-05 · Começo da primavera **2027-09-22** · Final da primavera 2026-12-20 · Começo do verão 2026-12-21 · Final do verão 2027-03-19 · Começo do outono 2027-03-20 · Final do outono 2027-06-20 · Começo do inverno 2027-06-21 · Final do inverno 2027-09-21.
- [ ] **Step 3: Endpoint.** Em `endpoints.ts`, substituir `createLote`:

```ts
  /** Vários cuidados para várias plantas na mesma data (tudo ou nada). `detalhes` = observação/instrução. */
  createLote: (body: { plantaIds: string[]; atividadeIds: string[]; dataAgendada: string; detalhes?: string }) =>
    data<Agenda[]>(api.post('/agendas/lote', body)),
```

- [ ] **Step 4:** Ajustar a única chamada atual em `ScheduleCareSheet.tsx` para não quebrar o build até a Task 4: `agendasApi.createLote({ plantaIds: [plantaId], atividadeIds, dataAgendada: fromDateInput(data) })`. Rodar `cd web && npm run build` → ok.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/estacoes.ts web/src/lib/endpoints.ts web/src/components/care/ScheduleCareSheet.tsx
git commit -m "feat(web): atalhos de data por estação (hemisfério sul) e lote com várias plantas"
```

---

### Task 3: `PlantasPicker` (várias plantas, por espécie, todas) e `AtividadeChips`

**Files:**
- Create: `web/src/components/care/PlantasPicker.tsx`
- Create: `web/src/components/care/AtividadeChips.tsx`

**Interfaces:**
- Produces:
  - `PlantasPicker({ open, onClose, selecionadas: string[], onConfirmar(ids: string[]): void, titulo?: string })` — sheet; o estado interno começa em `selecionadas` a cada abertura (o pai remonta com `key`).
  - `PlantasCampo({ ids: string[], onChange(ids: string[]): void, label?: string })` — campo-resumo que abre o picker.
  - `AtividadeChips({ value: string[], onChange(ids: string[]): void, label?: string })` — chips de múltipla escolha (atividades rastreadas primeiro).

- [ ] **Step 1: `AtividadeChips.tsx`:**

```tsx
import { useAtividadesOrdenadas } from '@/lib/queries';

/** Chips de tipo de cuidado, múltipla escolha. */
export function AtividadeChips({
  value,
  onChange,
  label = 'Tipos de cuidado',
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const atividades = useAtividadesOrdenadas();
  const tocar = (id: string) => onChange(value.includes(id) ? value.filter((a) => a !== id) : [...value, id]);

  return (
    <div>
      <span className="label">
        {label} <span className="font-normal text-muted">· toque em quantos quiser</span>
      </span>
      {atividades.isLoading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : atividades.data.length === 0 ? (
        <p className="text-sm text-muted">Nenhum tipo de cuidado cadastrado ainda (o admin cadastra em Perfil → Admin).</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {atividades.data.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => tocar(a.id)}
              className={`chip ${value.includes(a.id) ? 'chip-active' : ''}`}
              aria-pressed={value.includes(a.id)}
            >
              {a.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `PlantasPicker.tsx`:**

```tsx
import { useMemo, useState } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { Button, PlantThumb } from '@/components/ui';
import { especieNome, plantaTitulo } from '@/lib/format';
import { usePlantas } from '@/lib/queries';
import type { Planta } from '@/types';

const SEM_ESPECIE = 'sem-especie';
const grupoDe = (p: Planta) => p.especieId ?? SEM_ESPECIE;

/** Escolha de várias plantas: busca, "Todas", grupos por espécie e lista com checkbox. */
export function PlantasPicker({
  open,
  onClose,
  selecionadas,
  onConfirmar,
  titulo = 'Escolher plantas',
}: {
  open: boolean;
  onClose: () => void;
  selecionadas: string[];
  onConfirmar: (ids: string[]) => void;
  titulo?: string;
}) {
  const plantas = usePlantas();
  const [sel, setSel] = useState(() => new Set(selecionadas));
  const [busca, setBusca] = useState('');
  const todas = plantas.data ?? [];

  const grupos = useMemo(() => {
    const mapa = new Map<string, { nome: string; ids: string[] }>();
    for (const p of todas) {
      const g = grupoDe(p);
      const atual = mapa.get(g) ?? { nome: g === SEM_ESPECIE ? 'Sem espécie' : especieNome(p.especie), ids: [] };
      atual.ids.push(p.id);
      mapa.set(g, atual);
    }
    return [...mapa.entries()].sort(([a, x], [b, y]) =>
      a === SEM_ESPECIE ? -1 : b === SEM_ESPECIE ? 1 : x.nome.localeCompare(y.nome, 'pt-BR'),
    );
  }, [todas]);

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? todas.filter((p) =>
        [p.identificador, p.nome, p.especie?.nomeComum, p.especie?.nomeCientifico]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(termo)),
      )
    : todas;

  const tudoMarcado = (ids: string[]) => ids.length > 0 && ids.every((id) => sel.has(id));
  const alternarGrupo = (ids: string[]) =>
    setSel((s) => {
      const n = new Set(s);
      if (tudoMarcado(ids)) ids.forEach((id) => n.delete(id));
      else ids.forEach((id) => n.add(id));
      return n;
    });
  const alternar = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={titulo}
      footer={
        <Button block disabled={!sel.size} onClick={() => onConfirmar([...sel])}>
          Pronto{sel.size ? ` (${sel.size})` : ''}
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            placeholder="Buscar por código ou nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            type="search"
          />
        </div>
        {!termo && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`chip ${tudoMarcado(todas.map((p) => p.id)) ? 'chip-active' : ''}`}
              onClick={() => alternarGrupo(todas.map((p) => p.id))}
            >
              Todas ({todas.length})
            </button>
            {grupos.map(([g, { nome, ids }]) => (
              <button
                type="button"
                key={g}
                className={`chip ${tudoMarcado(ids) ? 'chip-active' : ''}`}
                onClick={() => alternarGrupo(ids)}
              >
                {nome} ({ids.length})
              </button>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          {visiveis.map((p) => {
            const marcada = sel.has(p.id);
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => alternar(p.id)}
                className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-line/40"
                aria-pressed={marcada}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 ${
                    marcada ? 'border-primary bg-primary text-white' : 'border-line'
                  }`}
                >
                  {marcada && <Check size={14} strokeWidth={3} />}
                </span>
                <PlantThumb url={p.fotoCapaUrl} className="size-10 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {p.identificador ? `#${p.identificador} · ` : ''}
                    {plantaTitulo(p)}
                  </span>
                  <span className="block truncate text-xs text-muted">{especieNome(p.especie)}</span>
                </span>
              </button>
            );
          })}
          {!visiveis.length && <p className="py-6 text-center text-sm text-muted">Nenhuma planta encontrada.</p>}
        </div>
      </div>
    </Sheet>
  );
}

/** Campo-resumo ("3 plantas ›") que abre o PlantasPicker. */
export function PlantasCampo({
  ids,
  onChange,
  label = 'Plantas',
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const plantas = usePlantas();
  const [aberto, setAberto] = useState(false);
  const [versao, setVersao] = useState(0);
  const primeira = plantas.data?.find((p) => p.id === ids[0]);
  const resumo = !ids.length
    ? 'Escolha as plantas'
    : ids.length === 1
      ? `${primeira?.identificador ? `#${primeira.identificador} · ` : ''}${plantaTitulo(primeira)}`
      : ids.length === plantas.data?.length
        ? `Todas as plantas (${ids.length})`
        : `${ids.length} plantas`;

  return (
    <div>
      <span className="label">{label}</span>
      <button
        type="button"
        onClick={() => {
          setVersao((v) => v + 1);
          setAberto(true);
        }}
        className="input flex items-center justify-between text-left"
      >
        <span className={`truncate ${ids.length ? '' : 'text-muted'}`}>{plantas.isLoading ? 'Carregando…' : resumo}</span>
        <ChevronRight size={18} className="shrink-0 text-muted" />
      </button>
      <PlantasPicker
        key={versao}
        open={aberto}
        onClose={() => setAberto(false)}
        selecionadas={ids}
        onConfirmar={(novos) => {
          onChange(novos);
          setAberto(false);
        }}
      />
    </div>
  );
}
```

(`p.especieId ?? SEM_ESPECIE` já prepara a Parte 2; até lá `especieId` é sempre string e o grupo "Sem espécie" nunca aparece.)

- [ ] **Step 3:** `cd web && npm run build && npm run lint` → ok (componentes ainda não usados; build passa).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/care/PlantasPicker.tsx web/src/components/care/AtividadeChips.tsx
git commit -m "feat(web): seletor de várias plantas (todas, por espécie, busca) e chips de cuidado"
```

---

### Task 4: Novo sheet de agendar

**Files:**
- Modify: `web/src/components/care/ScheduleCareSheet.tsx`

**Interfaces:**
- Consumes: `PlantasCampo`, `AtividadeChips` (Task 3), `atalhosDeData` (Task 2), `agendasApi.createLote` (Task 2).

- [ ] **Step 1: Reescrever `ScheduleCareSheet.tsx`:**

```tsx
import { useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { AtividadeChips } from './AtividadeChips';
import { PlantasCampo } from './PlantasPicker';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { atalhosDeData } from '@/lib/estacoes';
import { daquiADias, dataNumerica, fromDateInput, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda } from '@/types';

/** Agendar cuidados para uma ou várias plantas — ou reagendar uma tarefa existente (quando `agenda` vem preenchida). */
export function ScheduleCareSheet({
  open,
  onClose,
  plantaId: plantaInicial,
  agenda,
}: {
  open: boolean;
  onClose: () => void;
  plantaId?: string;
  agenda?: Agenda;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [plantaIds, setPlantaIds] = useState<string[]>(plantaInicial ? [plantaInicial] : []);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [detalhes, setDetalhes] = useState('');
  const [data, setData] = useState(() => toDateInput(agenda?.dataAgendada ?? daquiADias(1)));
  const [salvando, setSalvando] = useState(false);
  const atalhos = useMemo(() => atalhosDeData(), []);

  const total = plantaIds.length * atividadeIds.length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!agenda && (!plantaIds.length || !atividadeIds.length)) return toast('Escolha as plantas e o tipo de cuidado.', 'error');
    setSalvando(true);
    try {
      if (agenda) {
        await agendasApi.update(agenda.id, { dataAgendada: fromDateInput(data) });
      } else {
        await agendasApi.createLote({
          plantaIds,
          atividadeIds,
          dataAgendada: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast(agenda ? 'Tarefa reagendada' : total > 1 ? `${total} cuidados agendados` : 'Cuidado agendado');
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={agenda ? 'Reagendar tarefa' : 'Agendar cuidado'}>
      <form onSubmit={submit} className="space-y-5 pb-2">
        {agenda ? (
          <p className="text-sm text-muted">
            {agenda.atividade?.nome} · {agenda.planta?.nome || 'planta'}
          </p>
        ) : (
          <>
            <PlantasCampo ids={plantaIds} onChange={setPlantaIds} />
            <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} />
            <Field label="Observação (opcional)">
              <textarea
                className="input min-h-16"
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                placeholder="Ex.: usar adubo Bioplant"
              />
            </Field>
          </>
        )}
        <div>
          <Field label="Data">
            <input type="date" className="input" value={data} min={toDateInput()} onChange={(e) => setData(e.target.value)} required />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            {atalhos.map((a) => (
              <button
                type="button"
                key={a.label}
                className={`chip py-1.5 text-xs ${data === a.data ? 'chip-active' : ''}`}
                onClick={() => setData(a.data)}
              >
                {a.label} <span className="opacity-60">· {dataNumerica(fromDateInput(a.data)).slice(0, 5)}</span>
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" block loading={salvando}>
          {agenda ? 'Salvar nova data' : total > 1 ? `Agendar ${total} cuidados` : 'Agendar'}
        </Button>
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 2:** `cd web && npm run build && npm run lint` → ok.

- [ ] **Step 3: Navegador.** `cd web && npm run dev` (API local via `docker compose up`), conta de teste, viewport 390px: botão + → Agendar; escolher "Todas", desmarcar uma espécie, 2 cuidados, observação, chip "Final da primavera" → toast "N cuidados agendados"; conferir tarefas na Bancada.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/care/ScheduleCareSheet.tsx
git commit -m "feat(web): agendar para várias plantas com observação e atalhos de estação"
```

---

### Task 5: Mostrar a observação do agendamento

**Files:**
- Modify: `web/src/components/BenchTaskCard.tsx`
- Modify: `web/src/components/TaskCard.tsx`
- Modify: `web/src/pages/TarefaPage.tsx`
- Modify: `web/src/pages/ConcluirPage.tsx`

- [ ] **Step 1: `BenchTaskCard.tsx`** — importar `StickyNote` de `lucide-react` e, logo após o `<p>` da data (dentro do botão de texto):

```tsx
          {agenda.detalhes && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-primary-dark">
              <StickyNote size={12} className="shrink-0" /> <span className="truncate">{agenda.detalhes}</span>
            </p>
          )}
```

- [ ] **Step 2: `TaskCard.tsx`** — mesmo bloco (com `StickyNote`) depois do `<p>` com planta · data, mas só para pendentes: `{agenda.status === 'PENDENTE' && agenda.detalhes && (...)}`.

- [ ] **Step 3: `TarefaPage.tsx`** — importar `StickyNote`; logo após o `<p>` de status (`{rotuloStatus} · ...`):

```tsx
        {pendente && agenda.detalhes && (
          <div className="mt-4 flex gap-2.5 rounded-2xl bg-primary-light p-3 text-sm text-primary-dark">
            <StickyNote size={18} className="mt-0.5 shrink-0" />
            <p className="whitespace-pre-line">{agenda.detalhes}</p>
          </div>
        )}
```

- [ ] **Step 4: `ConcluirPage.tsx`** — no card de cada planta, abaixo do nome (`{t.planta?.identificador && t.planta?.nome && ...}`):

```tsx
                      {t.detalhes && (
                        <p className="truncate text-xs text-primary-dark" title={t.detalhes}>
                          Obs.: {t.detalhes}
                        </p>
                      )}
```

e mudar o hint do campo "Descrição (opcional)" para: `<Field label="Descrição (opcional)" hint="Se preencher, substitui a observação do agendamento.">`.

- [ ] **Step 5:** `cd web && npm run build && npm run lint` → ok. No navegador, conferir a observação na Bancada, na tarefa e no concluir.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/BenchTaskCard.tsx web/src/components/TaskCard.tsx web/src/pages/TarefaPage.tsx web/src/pages/ConcluirPage.tsx
git commit -m "feat(web): mostrar a observação do agendamento na bancada, tarefa e conclusão"
```

---

## Parte 2 — Planta só com código + foto

### Task 6: Espécie opcional no backend

**Files:**
- Create: `server/prisma/migrations/20261005130000_planta_especie_opcional/migration.sql`
- Modify: `server/prisma/schema.prisma` (model `Planta`)
- Modify: `server/src/modules/planta/planta.schema.ts`
- Modify: `server/src/modules/planta/types/planta.types.ts`
- Modify: `server/src/modules/planta/use-cases/create-planta.use-case.ts`
- Test: `server/src/modules/planta/use-cases/create-planta.use-case.test.ts`

**Interfaces:**
- Produces: `POST /plantas` aceita body sem `especieId` (ex.: `{ identificador: '42', fotoCapaUrl: 'https://...' }`); `Planta.especieId`/`especie` podem ser `null`.

- [ ] **Step 1: Teste falhando.** Em `create-planta.use-case.test.ts`, dentro do `describe('execute')`:

```ts
    it('deve criar uma planta sem espécie (só código e capa)', async () => {
      // Arrange
      const dto: CreatePlantaRequestDTO = {
        usuarioId: 'user-123',
        identificador: '42',
        fotoCapaUrl: 'https://r2.example.com/capa.webp',
      };
      mockPlantaRepository.create.mockResolvedValue({ ...mockCreatedPlanta, especieId: null, especie: null });

      // Act
      const result = await createPlantaUseCase.execute(dto);

      // Assert
      expect(mockEspecieRepository.existsById).not.toHaveBeenCalled();
      expect(mockPlantaRepository.create).toHaveBeenCalledWith(dto);
      expect(result.especie).toBeNull();
    });
```

- [ ] **Step 2:** `cd server && npm test -- create-planta` → FAIL de tipo (`especieId` obrigatório).

- [ ] **Step 3: Tipos** (`planta.types.ts`): `especieId?: string;` em `CreatePlantaRequestDTO` e `CreatePlantaDTO`; em `PlantaWithEspecie`: `especieId: string | null;` e `especie: { nomeCientifico: string | null; nomeComum: string | null } | null;`.

- [ ] **Step 4: Use case** (`create-planta.use-case.ts`), trocar a validação por:

```ts
    // Espécie é opcional (planta criada só com código + foto); se vier, precisa existir
    if (data.especieId && !(await this.especieRepository.existsById(data.especieId))) {
      throw new Error('Espécie não encontrada');
    }
```

- [ ] **Step 5: Schema Zod** (`planta.schema.ts`): `especieId: z.string().uuid({ message: 'ID de espécie inválido.' }).optional(),` no `createPlantaSchema`.

- [ ] **Step 6: Prisma.** Em `model Planta`: `especieId String?` e `especie Especie? @relation(fields: [especieId], references: [id])`. Migration `server/prisma/migrations/20261005130000_planta_especie_opcional/migration.sql`:

```sql
-- Planta pode existir sem espécie (criada só com código + foto); o usuário completa depois
ALTER TABLE "Planta" ALTER COLUMN "especieId" DROP NOT NULL;
```

Rodar `cd server && npm run prisma:generate`.

- [ ] **Step 7:** `cd server && npm test && npm run build` → PASS. Se o build acusar acesso a `planta.especie.x` sem `?.` em outro módulo, corrigir com `?.`.

- [ ] **Step 8: Aplicar no banco local:** `docker compose exec api npx prisma migrate deploy` (ou reiniciar o container — o `entrypoint.sh` aplica). Produção (Neon) recebe no deploy, como as migrations anteriores (ver `docs/DEPLOY.md`).

- [ ] **Step 9: Commit**

```bash
git add server/prisma server/src/modules/planta
git commit -m "feat(api): espécie opcional na planta (criar só com código e foto)"
```

---

### Task 7: Web aceita planta sem espécie; Coleção destaca no topo

**Files:**
- Modify: `web/src/types.ts`, `web/src/lib/endpoints.ts` (`PlantaInput`)
- Modify: `web/src/pages/CollectionPage.tsx`
- Modify: `web/src/pages/PlantDetailPage.tsx`
- Modify: `web/src/pages/EditPlantPage.tsx`

- [ ] **Step 1: Tipos.** `types.ts` → `Planta.especieId: string | null;` e `especie: (Pick<Especie, 'nomeCientifico' | 'nomeComum'> & Partial<Especie>) | null;`. `endpoints.ts` → `PlantaInput.especieId?: string;`.

- [ ] **Step 2:** `cd web && npm run build` e corrigir cada erro com `?.`/`??` (ex.: `CollectionPage` usa `p.especieId` como chave de mapa).

- [ ] **Step 3: Coleção.** Em `CollectionPage.tsx`:
  - filtro de espécie: no `useMemo` `especies`, pular `!p.especieId`; adicionar `<option value="sem">Sem espécie</option>` logo após "Todas as espécies" quando houver alguma; no filtro: `if (especie === 'sem' ? !!p.especieId : especie && p.especieId !== especie) return false;`
  - ordenação: sem espécie sempre primeiro:

```ts
    const semEspecieAntes = (a: Planta, b: Planta) => Number(!!a.especieId) - Number(!!b.especieId);
    return filtradas.sort(
      (a, b) =>
        semEspecieAntes(a, b) ||
        (ordem === 'alfabetica'
          ? plantaTitulo(a).localeCompare(plantaTitulo(b), 'pt-BR')
          : ordem === 'tarefa'
            ? porTarefa(a).localeCompare(porTarefa(b))
            : b.createdAt.localeCompare(a.createdAt)),
    );
```

  - grade: dentro do `<div className="relative">`, `{!p.especieId && <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-danger text-sm font-bold text-white ring-2 ring-white" aria-label="Sem espécie">!</span>}`; e o subtítulo: `{p.especieId ? especieNome(p.especie) : <span className="font-medium text-danger">Sem espécie · completar</span>}` (mesma troca na lista; na lista o "!" vai antes do texto, `size-5`, inline).

- [ ] **Step 4: Detalhe.** Em `PlantDetailPage.tsx`, logo após o bloco do nome da espécie:

```tsx
        {!p.especieId && (
          <Link
            to={`/plantas/${p.id}/editar`}
            className="mt-3 flex items-center gap-2 rounded-2xl bg-danger/10 p-3 text-sm font-medium text-danger"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-danger font-bold text-white">!</span>
            Planta sem espécie — toque para completar o cadastro
          </Link>
        )}
```

(importar `Link` de `react-router` se ainda não estiver).

- [ ] **Step 5: Edição.** Em `EditPlantPage.tsx`: `useState(p.especieId ?? '')`; no update `especieId: especieId || undefined,`; o botão de espécie mostra `especieId ? especieNome(especie) : 'Escolher espécie'`.

- [ ] **Step 6:** `cd web && npm run build && npm run lint` → ok.

- [ ] **Step 7: Commit**

```bash
git add web/src
git commit -m "feat(web): plantas sem espécie no topo da coleção com alerta para completar"
```

---

### Task 8: Triagem compartilhada com "Criar planta #X"

**Files:**
- Create: `web/src/lib/loteFotos.ts` (hook `useLoteFotos`)
- Create: `web/src/components/FilePreview.tsx` (`FilePreview`, `Miniaturas`)
- Create: `web/src/components/TriagemFotos.tsx`
- Modify: `web/src/pages/BatchPhotosPage.tsx` (usar os três acima)

**Interfaces:**
- Produces (`loteFotos.ts`):

```ts
export const MAX_FOTOS_LOTE: number;
export interface ItemFoto { key: string; file: File; upload: 'fila' | 'enviando' | 'ok' | 'erro'; url?: string; dataCaptura?: string; plantaId?: string | null }
export interface Alvo { id: string; identificador?: string | null; nome?: string | null; fotoCapaUrl?: string | null; especie?: Planta['especie']; nova?: boolean }
export const normalizarCodigo: (codigo: string) => string;
export const ehNova: (id?: string | null) => boolean;
export function useLoteFotos(plantas: Planta[] | undefined, filesIniciais?: File[]): {
  items: ItemFoto[];
  porCodigo: Map<string, Alvo>;
  porId: Map<string, Alvo>;
  trocarArquivos(files: File[], plantaId?: string): void;
  atribuir(key: string, plantaId: string | null): void;
  criarNova(codigo: string): Alvo;
  enviados: number; enviaveis: number;
  uploadsPendentes: boolean;
  falhas: ItemFoto[];
  reenviarFalhas(): void;
  criarPlantasNovas(): Promise<Map<string, string>>; // id provisório → id real
};
```

- Produces (`TriagemFotos.tsx`): `TriagemFotos({ lote, inicio, voltarDireto, onFim, onSair })` — `lote` = retorno de `useLoteFotos`; `inicio` = índice inicial; `voltarDireto` = ao atribuir, chama `onFim` em vez de ir para a próxima foto; `onFim()` ao passar da última; `onSair()` após confirmar saída.
- Produces (`FilePreview.tsx`): `FilePreview({ file, alt, className })`, `Miniaturas({ fotos: { item: ItemFoto; i: number }[], onClick(i: number) })`.

- [ ] **Step 1: `FilePreview.tsx`** — mover `FilePreview` e `Miniaturas` de `BatchPhotosPage.tsx` para cá, exportados, trocando o tipo `Item` por `ItemFoto` (import de `@/lib/loteFotos`).

- [ ] **Step 2: `loteFotos.ts`:**

```ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { plantasApi } from './endpoints';
import { keys } from './queries';
import { dataCapturaDe, MAX_FOTOS_POR_VEZ, uploadImage } from './upload';
import type { Planta } from '@/types';

export const MAX_FOTOS_LOTE = MAX_FOTOS_POR_VEZ;
const CONCORRENCIA = 3;
/** Id provisório de planta criada na triagem — só vira planta de verdade no salvar. */
const PREFIXO_NOVA = 'nova:';
export const ehNova = (id?: string | null) => !!id?.startsWith(PREFIXO_NOVA);

export interface ItemFoto {
  key: string;
  file: File;
  upload: 'fila' | 'enviando' | 'ok' | 'erro';
  url?: string;
  dataCaptura?: string;
  /** undefined = ainda não triada · null = pulada */
  plantaId?: string | null;
}

/** Planta que pode receber fotos: existente ou nova (pendente, criada no salvar). */
export interface Alvo {
  id: string;
  identificador?: string | null;
  nome?: string | null;
  fotoCapaUrl?: string | null;
  especie?: Planta['especie'];
  nova?: boolean;
}

/** "007" e "7" apontam para a mesma planta. */
export const normalizarCodigo = (codigo: string) => codigo.trim().replace(/^0+(?=\d)/, '');

function criarItens(files: File[], plantaId?: string): ItemFoto[] {
  return files.slice(0, MAX_FOTOS_LOTE).map((file, i) => ({
    key: `${Date.now()}-${i}-${file.name}`,
    file,
    upload: 'fila',
    ...(plantaId ? { plantaId } : {}),
  }));
}

/** Estado de um lote de fotos: triagem por código, plantas novas pendentes e upload em segundo plano. */
export function useLoteFotos(plantas: Planta[] | undefined, filesIniciais: File[] = []) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ItemFoto[]>(() => criarItens(filesIniciais));
  const [novas, setNovas] = useState<string[]>([]);
  const iniciados = useRef(new Set<string>());
  /** id provisório → id real; sobrevive a novas tentativas de salvar (não duplica planta). */
  const criadas = useRef(new Map<string, string>());

  const alvos = useMemo<Alvo[]>(
    () => [...(plantas ?? []), ...novas.map((c) => ({ id: PREFIXO_NOVA + c, identificador: c, nova: true }))],
    [plantas, novas],
  );
  const porCodigo = useMemo(() => {
    const mapa = new Map<string, Alvo>();
    for (const a of alvos) if (a.identificador) mapa.set(normalizarCodigo(a.identificador), a);
    return mapa;
  }, [alvos]);
  const porId = useMemo(() => new Map(alvos.map((a) => [a.id, a])), [alvos]);

  const atualizar = (key: string, patch: Partial<ItemFoto>) =>
    setItems((lista) => lista.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  // Fila de upload: começa assim que a foto tem planta (puladas não sobem)
  useEffect(() => {
    const ativos = items.filter((i) => i.upload === 'enviando').length;
    const proximos = items
      .filter((i) => i.upload === 'fila' && i.plantaId != null && !iniciados.current.has(i.key))
      .slice(0, Math.max(0, CONCORRENCIA - ativos));
    for (const item of proximos) {
      iniciados.current.add(item.key);
      atualizar(item.key, { upload: 'enviando' });
      Promise.all([uploadImage(item.file), dataCapturaDe(item.file)])
        .then(([url, { data: dataCaptura }]) => atualizar(item.key, { upload: 'ok', url, dataCaptura }))
        .catch(() => atualizar(item.key, { upload: 'erro' }));
    }
  }, [items]);

  const comPlanta = items.filter((i) => i.plantaId);

  return {
    items,
    porCodigo,
    porId,
    trocarArquivos(files: File[], plantaId?: string) {
      iniciados.current.clear();
      setItems(criarItens(files, plantaId));
    },
    atribuir: (key: string, plantaId: string | null) => atualizar(key, { plantaId }),
    criarNova(codigo: string): Alvo {
      const c = normalizarCodigo(codigo);
      setNovas((n) => (n.includes(c) ? n : [...n, c]));
      return { id: PREFIXO_NOVA + c, identificador: c, nova: true };
    },
    enviados: items.filter((i) => i.upload === 'ok').length,
    enviaveis: comPlanta.length,
    uploadsPendentes: comPlanta.some((i) => i.upload === 'fila' || i.upload === 'enviando'),
    falhas: comPlanta.filter((i) => i.upload === 'erro'),
    reenviarFalhas() {
      for (const i of items) {
        if (i.plantaId && i.upload === 'erro') {
          iniciados.current.delete(i.key);
          atualizar(i.key, { upload: 'fila' });
        }
      }
    },
    /** Cria as plantas novas que receberam fotos (capa = primeira foto enviada). */
    async criarPlantasNovas(): Promise<Map<string, string>> {
      let criou = false;
      for (const codigo of novas) {
        const provisorio = PREFIXO_NOVA + codigo;
        if (criadas.current.has(provisorio)) continue;
        const fotos = items.filter((i) => i.plantaId === provisorio);
        if (!fotos.length) continue;
        const planta = await plantasApi.create({ identificador: codigo, fotoCapaUrl: fotos.find((f) => f.url)?.url });
        criadas.current.set(provisorio, planta.id);
        criou = true;
      }
      if (criou) queryClient.invalidateQueries({ queryKey: keys.plantas });
      return criadas.current;
    },
  };
}

export type LoteFotos = ReturnType<typeof useLoteFotos>;
```

- [ ] **Step 3: `TriagemFotos.tsx`** — mover para cá o bloco "Triagem" de `BatchPhotosPage` (header escuro, foto, painel, teclado), com o estado local `indice`, `digitado`, `anterior`, `confirmarSaida`:

```tsx
import { useState } from 'react';
import { ArrowLeft, CloudUpload, Plus, Repeat, SkipForward, X } from 'lucide-react';
import { PlantThumb } from '@/components/ui';
import { NumericKeypad } from '@/components/NumericKeypad';
import { FilePreview } from '@/components/FilePreview';
import { especieNome, plantaTitulo } from '@/lib/format';
import { normalizarCodigo, type Alvo, type LoteFotos } from '@/lib/loteFotos';

/** Tela cheia: uma foto por vez, digita o código da planta (ou cria uma planta nova com esse código). */
export function TriagemFotos({
  lote,
  inicio = 0,
  voltarDireto = false,
  onFim,
  onSair,
}: {
  lote: LoteFotos;
  inicio?: number;
  voltarDireto?: boolean;
  onFim: () => void;
  onSair: () => void;
}) {
  const { items, porCodigo, porId } = lote;
  const [indice, setIndice] = useState(inicio);
  const [digitado, setDigitado] = useState(() => {
    const pid = items[inicio]?.plantaId;
    return pid ? (porId.get(pid)?.identificador ?? '') : '';
  });
  const [anterior, setAnterior] = useState<string | null>(null);
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  const item = items[indice];
  const proximo = items[indice + 1];
  const match = digitado ? porCodigo.get(normalizarCodigo(digitado)) : undefined;
  const plantaAnterior = anterior ? porCodigo.get(normalizarCodigo(anterior)) : undefined;

  function irPara(i: number) {
    setIndice(i);
    const pid = items[i]?.plantaId;
    setDigitado(pid ? (porId.get(pid)?.identificador ?? '') : '');
  }

  function atribuir(alvo: Alvo | null) {
    lote.atribuir(item.key, alvo ? alvo.id : null);
    if (alvo?.identificador) setAnterior(alvo.identificador);
    if (voltarDireto || indice + 1 >= items.length) onFim();
    else irPara(indice + 1);
  }

  if (!item) return null;

  return (
    <div className="flex h-dvh flex-col bg-ink">
      {/* Topo */}
      <header className="pt-safe text-white">
        <div className="flex h-12 items-center gap-2 px-2">
          <button
            onClick={() => (confirmarSaida ? onSair() : setConfirmarSaida(true))}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Sair"
          >
            <X size={22} />
          </button>
          <p className="flex-1 text-center text-sm font-semibold">
            {indice + 1} de {items.length}
          </p>
          <span className="flex w-16 items-center justify-end gap-1 pr-2 text-xs text-white/70" title="Fotos enviadas">
            <CloudUpload size={14} /> {lote.enviados}/{lote.enviaveis}
          </span>
        </div>
        {confirmarSaida && (
          <div className="flex items-center gap-2 bg-danger px-4 py-2 text-sm">
            <span className="flex-1">Sair e descartar estas fotos?</span>
            <button className="font-semibold underline" onClick={onSair}>
              Sair
            </button>
            <button className="font-semibold" onClick={() => setConfirmarSaida(false)}>
              Ficar
            </button>
          </div>
        )}
      </header>

      {/* Foto */}
      <div className="relative min-h-0 flex-1">
        <FilePreview key={item.key} file={item.file} alt={`Foto ${indice + 1}`} className="absolute inset-0 size-full object-contain" />
        {proximo && <FilePreview key={proximo.key} file={proximo.file} alt="" className="hidden" />}
        {item.upload === 'erro' && (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
            Falha no envio
          </span>
        )}
      </div>

      {/* Painel inferior */}
      <div className="rounded-t-3xl bg-bg px-3 pt-3">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex h-14 items-center gap-3 rounded-2xl bg-white px-3">
            <span className="min-w-14 text-2xl font-semibold tabular-nums text-primary-dark">
              {digitado ? `#${digitado}` : <span className="text-base font-normal text-muted">#</span>}
            </span>
            {match ? (
              <>
                <PlantThumb url={match.fotoCapaUrl} className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{match.nova ? `Planta nova #${match.identificador}` : plantaTitulo(match)}</p>
                  <p className="truncate text-xs text-muted">{match.nova ? 'Será criada ao salvar' : especieNome(match.especie)}</p>
                </div>
              </>
            ) : digitado ? (
              <button
                onClick={() => atribuir(lote.criarNova(digitado))}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-light py-2 text-sm font-semibold text-primary-dark"
              >
                <Plus size={16} /> Criar planta #{normalizarCodigo(digitado)}
              </button>
            ) : (
              <p className="flex-1 text-sm text-muted">Digite o código da planta</p>
            )}
          </div>

          <div className="mb-2 grid grid-cols-3 gap-2">
            <button
              onClick={() => irPara(indice - 1)}
              disabled={indice === 0}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-white/60 text-sm font-medium text-ink disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              onClick={() => plantaAnterior && atribuir(plantaAnterior)}
              disabled={!plantaAnterior}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-primary-light text-sm font-semibold text-primary-dark disabled:opacity-40"
            >
              <Repeat size={16} /> {anterior ? `#${anterior}` : 'Anterior'}
            </button>
            <button
              onClick={() => atribuir(null)}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-white/60 text-sm font-medium text-muted"
            >
              Pular <SkipForward size={16} />
            </button>
          </div>

          <NumericKeypad
            value={digitado}
            onChange={setDigitado}
            onConfirm={() => match && atribuir(match)}
            confirmDisabled={!match}
          />
        </div>
        <div className="h-3" />
        <div className="pb-safe" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `BatchPhotosPage.tsx`** — refatorar para usar o hook e o componente:
  - remover `Item`, `criarItens`, `normalizar`, `CONCORRENCIA`, fila de upload, `porCodigo`/`porId`, `irPara`/`avancar`/`atribuir`, `digitado`/`anterior`/`confirmarSaida`, o bloco de JSX da triagem, `FilePreview`/`Miniaturas` locais;
  - `const lote = useLoteFotos(plantas.data, filesIniciais);` e estado `const [triagem, setTriagem] = useState<{ inicio: number; voltarDireto: boolean }>({ inicio: 0, voltarDireto: false });` + `const [registros, setRegistros] = useState<Record<string, 'ok' | 'erro'>>({});`
  - `adicionarArquivos(files)` → `lote.trocarArquivos(lista)`, `setTriagem({ inicio: 0, voltarDireto: false })`, `setEtapa('triagem')`;
  - etapa `triagem` renderiza `<TriagemFotos key={`${triagem.inicio}-${triagem.voltarDireto}`} lote={lote} inicio={triagem.inicio} voltarDireto={triagem.voltarDireto} onFim={() => setEtapa('revisao')} onSair={() => navigate(-1)} />`;
  - na revisão, `Miniaturas onClick={(i) => { setTriagem({ inicio: i, voltarDireto: true }); setEtapa('triagem'); }}`; o "Voltar" do header usa `{ inicio: lote.items.length - 1, voltarDireto: false }`; o cabeçalho de cada grupo usa `lote.porId.get(pid)` e mostra "Nova" (`<span className="chip py-0.5 text-xs">Nova</span>`) quando `ehNova(pid)`;
  - efeito de salvar (substitui o atual):

```ts
  const salvandoRef = useRef(false);
  useEffect(() => {
    if (etapa !== 'salvando' || salvandoRef.current || lote.uploadsPendentes) return;
    salvandoRef.current = true;
    (async () => {
      let mapa = new Map<string, string>();
      try {
        mapa = await lote.criarPlantasNovas();
      } catch (error) {
        toast(errorMessage(error, 'Não foi possível criar a planta nova.'), 'error');
        salvandoRef.current = false;
        setEtapa('revisao');
        return;
      }
      const real = (pid: string) => mapa.get(pid) ?? pid;
      const pendentes = lote.items.filter((i) => i.plantaId && i.upload === 'ok' && registros[i.key] !== 'ok');
      const resultados = await Promise.all(
        pendentes.map((i) =>
          fotosApi
            .create({ caminhoArquivo: i.url!, plantaId: real(i.plantaId!), dataCaptura: i.dataCaptura })
            .then(() => [i.key, 'ok'] as const)
            .catch(() => [i.key, 'erro'] as const),
        ),
      );
      setRegistros((r) => ({ ...r, ...Object.fromEntries(resultados) }));
      new Set(pendentes.map((i) => real(i.plantaId!))).forEach((id) =>
        queryClient.invalidateQueries({ queryKey: keys.fotos(id) }),
      );
      salvandoRef.current = false;
      setEtapa('fim');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, lote.uploadsPendentes]);
```

  - `tentarDeNovo()` → `lote.reenviarFalhas(); setEtapa('salvando');`
  - tela de fim: `salvas = aSalvar.filter((i) => registros[i.key] === 'ok')`, `falhas = aSalvar.filter((i) => registros[i.key] === 'erro' || i.upload === 'erro')`, `nPlantas` igual; texto extra quando houve plantas novas: `${n} planta(s) nova(s) criada(s) — complete a espécie na Coleção.` (n = quantos ids de `aSalvar` são `ehNova`).
  - importar `errorMessage` de `@/lib/api`.

- [ ] **Step 5:** `cd web && npm run build && npm run lint` → ok.

- [ ] **Step 6: Navegador** (conta de teste, imagens de `test-assets/`): Coleção → Fotos → 3 fotos; foto 1 código existente; foto 2 código inexistente → "Criar planta #X"; foto 3 "Anterior" (#X); revisar (grupo "Nova"); salvar → planta #X aparece no topo da Coleção com "!" e capa = 1ª foto, com 2 fotos na galeria. Sair no meio do lote não cria planta.

- [ ] **Step 7: Commit**

```bash
git add web/src
git commit -m "feat(web): criar planta pelo código na triagem de fotos (triagem compartilhada)"
```

---

## Parte 3 — Registrar cuidado começando pela foto

### Task 9: Extrair "próximos passos + revisão automática" para um helper

**Files:**
- Create: `server/src/modules/agenda/use-cases/planejar-seguimento.ts`
- Test: `server/src/modules/agenda/use-cases/planejar-seguimento.test.ts`
- Modify: `server/src/modules/agenda/use-cases/concluir-agendas.use-case.ts`

**Interfaces:**
- Produces:

```ts
export interface Seguimento {
  criarPendentes: { plantaId: string; atividadeId: string; dataAgendada: Date }[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
}
export function planejarSeguimento(
  repo: Pick<ConclusaoRepository, 'getRevisaoDias' | 'proximaPendente'>,
  args: { usuarioId: string; plantas: string[]; proximos: { atividadeId: string; dataAgendada: string }[]; excluir: string[] },
): Promise<Seguimento>;
```

- [ ] **Step 1: Teste falhando** (`planejar-seguimento.test.ts`):

```ts
import { planejarSeguimento } from './planejar-seguimento';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');

describe('planejarSeguimento', () => {
  const repo = { getRevisaoDias: jest.fn(), proximaPendente: jest.fn() };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo.getRevisaoDias.mockReset().mockResolvedValue(30);
    repo.proximaPendente.mockReset().mockResolvedValue(null);
  });
  afterEach(() => jest.useRealTimers());

  it('cria os próximos passos em cada planta e nenhuma revisão', async () => {
    const r = await planejarSeguimento(repo, {
      usuarioId: 'u',
      plantas: ['p1', 'p2'],
      proximos: [{ atividadeId: 'at', dataAgendada: '2026-11-01T12:00:00.000Z' }],
      excluir: [],
    });

    expect(r.criarPendentes).toEqual([
      { plantaId: 'p1', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
      { plantaId: 'p2', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
    ]);
    expect(r.revisoes).toEqual([]);
    expect(repo.getRevisaoDias).not.toHaveBeenCalled();
  });

  it('sem próximos, agenda revisão só para quem não tem tarefa próxima', async () => {
    repo.proximaPendente.mockImplementation(async (plantaId: string) =>
      plantaId === 'p1' ? new Date(AGORA.getTime() + 10 * DIA) : null,
    );

    const r = await planejarSeguimento(repo, { usuarioId: 'u', plantas: ['p1', 'p2'], proximos: [], excluir: ['ag-1'] });

    expect(repo.proximaPendente).toHaveBeenCalledWith('p1', AGORA, ['ag-1']);
    expect(r.revisoes).toEqual([{ plantaId: 'p2', dataAgendada: new Date(AGORA.getTime() + 30 * DIA) }]);
  });

  it('revisão desligada (0 dias) não agenda nada', async () => {
    repo.getRevisaoDias.mockResolvedValue(0);

    const r = await planejarSeguimento(repo, { usuarioId: 'u', plantas: ['p1'], proximos: [], excluir: [] });

    expect(r).toEqual({ criarPendentes: [], revisoes: [] });
  });
});
```

- [ ] **Step 2:** `cd server && npm test -- planejar-seguimento` → FAIL (módulo não existe).

- [ ] **Step 3: `planejar-seguimento.ts`:**

```ts
import { ConclusaoRepository } from '../agenda.types';

const DIA = 86_400_000;
/** Folga além do intervalo da revisão: uma pendente até N + 30 dias já "cuida" da planta. */
const MARGEM_REVISAO_DIAS = 30;

export interface Seguimento {
  criarPendentes: { plantaId: string; atividadeId: string; dataAgendada: Date }[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
}

/** O que vem depois de um cuidado: os próximos passos informados ou, sem eles, a Revisão geral automática. */
export async function planejarSeguimento(
  repo: Pick<ConclusaoRepository, 'getRevisaoDias' | 'proximaPendente'>,
  {
    usuarioId,
    plantas,
    proximos,
    excluir,
  }: { usuarioId: string; plantas: string[]; proximos: { atividadeId: string; dataAgendada: string }[]; excluir: string[] },
): Promise<Seguimento> {
  const criarPendentes = plantas.flatMap((plantaId) =>
    proximos.map((p) => ({ plantaId, atividadeId: p.atividadeId, dataAgendada: new Date(p.dataAgendada) })),
  );
  const revisoes: Seguimento['revisoes'] = [];

  if (proximos.length === 0) {
    const dias = await repo.getRevisaoDias(usuarioId);
    if (dias > 0) {
      const agora = new Date();
      const limite = agora.getTime() + (dias + MARGEM_REVISAO_DIAS) * DIA;
      for (const plantaId of plantas) {
        const proxima = await repo.proximaPendente(plantaId, agora, excluir);
        if (proxima && proxima.getTime() <= limite) continue;
        revisoes.push({ plantaId, dataAgendada: new Date(agora.getTime() + dias * DIA) });
      }
    }
  }

  return { criarPendentes, revisoes };
}
```

- [ ] **Step 4: Usar em `ConcluirAgendasUseCase`:** remover `DIA`/`MARGEM_REVISAO_DIAS`, `criarPendentes` e o bloco `if (proximos.length === 0) {...}`; montar o plano com:

```ts
    const seguimento = await planejarSeguimento(this.repo, { usuarioId, plantas, proximos, excluir: ids });
    const plano: PlanoConclusao = {
      usuarioId,
      dataConcluida,
      atualizacoes: /* igual */,
      fotos: /* igual */,
      criarConcluidas: /* igual */,
      ...seguimento,
    };
    return this.repo.executar(plano);
```

- [ ] **Step 5:** `cd server && npm test -- agenda` → todos PASS (incluindo os 11 de `concluir-agendas`, sem alteração).

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/agenda/use-cases
git commit -m "refactor(api): helper planejarSeguimento (próximos passos + revisão automática)"
```

---

### Task 10: `POST /agendas/registrar`

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts`
- Create: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.ts`
- Test: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.test.ts`
- Modify: `server/src/modules/agenda/use-cases/index.ts`
- Modify: `server/src/modules/agenda/use-cases/concluir-agendas.use-case.test.ts` (mock ganha 2 métodos)
- Modify: `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts`
- Modify: `server/src/modules/agenda/agenda.schema.ts`, `agenda.controller.ts`, `agenda.router.ts`

**Interfaces:**
- Consumes: `planejarSeguimento` (Task 9).
- Produces: `POST /api/agendas/registrar` com body `RegistrarCuidadosDTO` → `ResultadoConclusao` (`{ concluidas, criadas, revisoes }`).

```ts
export interface RegistrarCuidadosDTO {
  data: string;
  plantas: {
    plantaId: string;
    atividadeIds: string[];
    detalhes?: string;
    observacaoFutura?: string;
    fotos?: { caminhoArquivo: string; dataCaptura?: string }[];
  }[];
  proximos?: { atividadeId: string; dataAgendada: string }[];
}
```

- [ ] **Step 1: Tipos** (`agenda.types.ts`): adicionar `RegistrarCuidadosDTO` (acima) e

```ts
export interface PlanoRegistro {
  usuarioId: string;
  data: Date;
  /** Uma entrada por planta; detalhes/obs. e fotos vão no primeiro cuidado dela. */
  cuidados: {
    plantaId: string;
    atividadeIds: string[];
    detalhes?: string;
    observacaoFutura?: string;
    fotos: { caminhoArquivo: string; dataCaptura: Date }[];
  }[];
  criarPendentes: { plantaId: string; atividadeId: string; dataAgendada: Date }[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
}
```

e em `ConclusaoRepository`:

```ts
  /** Quantas das plantas informadas são do usuário. */
  contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>;
  registrar(plano: PlanoRegistro): Promise<ResultadoConclusao>;
```

- [ ] **Step 2: Mock do concluir.** Em `concluir-agendas.use-case.test.ts`, no objeto `repo` do `beforeEach`, adicionar `contarPlantasDoUsuario: jest.fn(), registrar: jest.fn(),`.

- [ ] **Step 3: Teste falhando** (`registrar-cuidados.use-case.test.ts`):

```ts
import { RegistrarCuidadosUseCase } from './registrar-cuidados.use-case';
import { ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');

describe('RegistrarCuidadosUseCase', () => {
  let repo: jest.Mocked<ConclusaoRepository>;
  let useCase: RegistrarCuidadosUseCase;

  const base: RegistrarCuidadosDTO = {
    data: AGORA.toISOString(),
    plantas: [{ plantaId: 'p1', atividadeIds: ['at-1'] }],
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      findPendentesDoUsuario: jest.fn(),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      getRevisaoDias: jest.fn().mockResolvedValue(30),
      proximaPendente: jest.fn().mockResolvedValue(null),
      executar: jest.fn(),
      contarPlantasDoUsuario: jest.fn().mockResolvedValue(1),
      registrar: jest.fn().mockResolvedValue({ concluidas: [], criadas: [], revisoes: [] }),
    };
    useCase = new RegistrarCuidadosUseCase(repo);
  });
  afterEach(() => jest.useRealTimers());

  const plano = () => repo.registrar.mock.calls[0][0];

  it('registra os cuidados de cada planta com fotos, nota e obs.', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(2);

    await useCase.execute(
      {
        data: AGORA.toISOString(),
        plantas: [
          {
            plantaId: 'p1',
            atividadeIds: ['at-1', 'at-2', 'at-1'],
            detalhes: 'podei',
            observacaoFutura: 'olhar o ápice',
            fotos: [{ caminhoArquivo: 'u1', dataCaptura: '2026-10-04T10:00:00.000Z' }, { caminhoArquivo: 'u2' }],
          },
          { plantaId: 'p2', atividadeIds: ['at-2'] },
        ],
      },
      'user-1',
    );

    expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');
    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-1', 'at-2']);
    expect(plano().usuarioId).toBe('user-1');
    expect(plano().data).toEqual(AGORA);
    expect(plano().cuidados).toEqual([
      {
        plantaId: 'p1',
        atividadeIds: ['at-1', 'at-2'],
        detalhes: 'podei',
        observacaoFutura: 'olhar o ápice',
        fotos: [
          { caminhoArquivo: 'u1', dataCaptura: new Date('2026-10-04T10:00:00.000Z') },
          { caminhoArquivo: 'u2', dataCaptura: AGORA },
        ],
      },
      { plantaId: 'p2', atividadeIds: ['at-2'], detalhes: undefined, observacaoFutura: undefined, fotos: [] },
    ]);
  });

  it('com próximos passos, cria as pendentes e não agenda revisão', async () => {
    await useCase.execute(
      { ...base, proximos: [{ atividadeId: 'at-9', dataAgendada: '2026-11-05T12:00:00.000Z' }] },
      'user-1',
    );

    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-1', 'at-9']);
    expect(plano().criarPendentes).toEqual([
      { plantaId: 'p1', atividadeId: 'at-9', dataAgendada: new Date('2026-11-05T12:00:00.000Z') },
    ]);
    expect(plano().revisoes).toEqual([]);
  });

  it('sem próximos, agenda a Revisão geral automática', async () => {
    await useCase.execute(base, 'user-1');

    expect(repo.proximaPendente).toHaveBeenCalledWith('p1', AGORA, []);
    expect(plano().revisoes).toEqual([{ plantaId: 'p1', dataAgendada: new Date(AGORA.getTime() + 30 * DIA) }]);
  });

  it('lança erro quando alguma planta não é do usuário', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(0);

    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Acesso negado. A planta não pertence a si.');
    expect(repo.registrar).not.toHaveBeenCalled();
  });

  it('lança erro com planta repetida', async () => {
    await expect(
      useCase.execute({ ...base, plantas: [base.plantas[0], base.plantas[0]] }, 'user-1'),
    ).rejects.toThrow('Plantas repetidas na lista.');
  });

  it('lança erro quando uma planta fica sem cuidado', async () => {
    await expect(
      useCase.execute({ ...base, plantas: [{ plantaId: 'p1', atividadeIds: [] }] }, 'user-1'),
    ).rejects.toThrow('Informe ao menos um cuidado por planta.');
  });

  it('lança erro com atividade inexistente', async () => {
    repo.atividadesExistem.mockResolvedValue(false);

    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Atividade não encontrada.');
    expect(repo.registrar).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4:** `cd server && npm test -- registrar-cuidados` → FAIL (módulo não existe).

- [ ] **Step 5: Use case** (`registrar-cuidados.use-case.ts`):

```ts
import { ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';
import { planejarSeguimento } from './planejar-seguimento';

/** Registra cuidados já feitos (com fotos) em várias plantas e agenda o que vem depois. */
export class RegistrarCuidadosUseCase {
  constructor(private repo: ConclusaoRepository) {}

  async execute(dto: RegistrarCuidadosDTO, usuarioId: string) {
    const plantas = dto.plantas.map((p) => p.plantaId);
    if (new Set(plantas).size !== plantas.length) throw new Error('Plantas repetidas na lista.');
    if (dto.plantas.some((p) => !p.atividadeIds.length)) throw new Error('Informe ao menos um cuidado por planta.');

    if ((await this.repo.contarPlantasDoUsuario(plantas, usuarioId)) !== plantas.length) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }

    const proximos = dto.proximos ?? [];
    const atividadeIds = [...new Set([...dto.plantas.flatMap((p) => p.atividadeIds), ...proximos.map((p) => p.atividadeId)])];
    if (!(await this.repo.atividadesExistem(atividadeIds))) throw new Error('Atividade não encontrada.');

    const data = new Date(dto.data);
    const seguimento = await planejarSeguimento(this.repo, { usuarioId, plantas, proximos, excluir: [] });

    return this.repo.registrar({
      usuarioId,
      data,
      cuidados: dto.plantas.map((p) => ({
        plantaId: p.plantaId,
        atividadeIds: [...new Set(p.atividadeIds)],
        detalhes: p.detalhes,
        observacaoFutura: p.observacaoFutura,
        fotos: (p.fotos ?? []).map((f) => ({
          caminhoArquivo: f.caminhoArquivo,
          dataCaptura: f.dataCaptura ? new Date(f.dataCaptura) : data,
        })),
      })),
      ...seguimento,
    });
  }
}
```

e exportar em `use-cases/index.ts`: `export { RegistrarCuidadosUseCase } from './registrar-cuidados.use-case';`

- [ ] **Step 6:** `cd server && npm test -- agenda` → PASS.

- [ ] **Step 7: Repositório** (`prisma-conclusao.repository.ts`): importar `PlanoRegistro`; extrair a criação de revisões de `executar` para um método privado e reutilizar:

```ts
  private async criarRevisoes(tx: Prisma.TransactionClient, revisoes: { plantaId: string; dataAgendada: Date }[]) {
    if (!revisoes.length) return [];
    // Garante a atividade mesmo se o seed não tiver rodado no ambiente
    const revisao = await tx.atividade.upsert({
      where: { nome: ATIVIDADE_REVISAO },
      update: {},
      create: { nome: ATIVIDADE_REVISAO, descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
    });
    const criadas = [];
    for (const r of revisoes) {
      criadas.push(await tx.agenda.create({ data: { plantaId: r.plantaId, atividadeId: revisao.id, dataAgendada: r.dataAgendada } }));
    }
    return criadas;
  }

  async contarPlantasDoUsuario(plantaIds: string[], usuarioId: string) {
    return prisma.planta.count({ where: { id: { in: plantaIds }, usuarioId } });
  }

  async registrar(plano: PlanoRegistro): Promise<ResultadoConclusao> {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const concluidas = [];
        for (const c of plano.cuidados) {
          for (const [i, atividadeId] of c.atividadeIds.entries()) {
            const agenda = await tx.agenda.create({
              data: {
                plantaId: c.plantaId,
                atividadeId,
                dataAgendada: plano.data,
                dataConcluida: plano.data,
                status: 'CONCLUIDO',
                // Nota e obs. só no primeiro cuidado: no histórico os cuidados do dia aparecem juntos
                ...(i === 0 ? { detalhes: c.detalhes, observacaoFutura: c.observacaoFutura } : {}),
              },
              include: { atividade: { select: { id: true, nome: true } } },
            });
            if (i === 0 && c.fotos.length) {
              await tx.foto.createMany({
                data: c.fotos.map((f) => ({
                  caminhoArquivo: f.caminhoArquivo,
                  dataCaptura: f.dataCaptura,
                  plantaId: c.plantaId,
                  agendaId: agenda.id,
                  usuarioId: plano.usuarioId,
                  titulo: agenda.atividade.nome,
                })),
              });
            }
            concluidas.push(agenda);
          }
        }
        const criadas = [];
        for (const p of plano.criarPendentes) criadas.push(await tx.agenda.create({ data: p }));
        const revisoes = await this.criarRevisoes(tx, plano.revisoes);
        return { concluidas, criadas, revisoes };
      },
      { timeout: 20_000 },
    );
  }
```

  e em `executar`, trocar o bloco `const revisoes = []; if (plano.revisoes.length) {...}` por `const revisoes = await this.criarRevisoes(tx, plano.revisoes);`.

- [ ] **Step 8: Schema** (`agenda.schema.ts`):

```ts
export const registrarCuidadosSchema = z.object({
  body: z.object({
    data: z.string().datetime({ message: 'Data inválida.' }),
    plantas: z
      .array(
        z.object({
          plantaId: z.string().uuid({ message: 'ID de planta inválido.' }),
          atividadeIds: z
            .array(z.string().uuid({ message: 'ID de atividade inválido.' }))
            .min(1, { message: 'Informe ao menos um cuidado por planta.' })
            .max(20, { message: 'Máximo de 20 cuidados por planta.' }),
          detalhes: z.string().max(2000).optional(),
          observacaoFutura: z.string().max(2000).optional(),
          fotos: z
            .array(z.object({ caminhoArquivo: z.string().url(), dataCaptura: z.string().datetime().optional() }))
            .max(50, { message: 'Máximo de 50 fotos por planta.' })
            .optional(),
        }),
      )
      .min(1, { message: 'Informe ao menos uma planta.' })
      .max(200, { message: 'Máximo de 200 plantas por vez.' }),
    proximos: z
      .array(z.object({ atividadeId: z.string().uuid(), dataAgendada: z.string().datetime() }))
      .max(10)
      .optional(),
  }),
});
```

- [ ] **Step 9: Controller + rota.** Em `agenda.controller.ts`: importar `registrarCuidadosSchema`, `RegistrarCuidadosUseCase`, `RegistrarCuidadosDTO`; campo `private registrarCuidadosUseCase: RegistrarCuidadosUseCase;`; no construtor reaproveitar o repositório: `const conclusaoRepository = new PrismaConclusaoRepository();` usado por `ConcluirAgendasUseCase` e `RegistrarCuidadosUseCase`; método:

```ts
  async registrar(req: Request, res: Response) {
    try {
      const { body } = registrarCuidadosSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const resultado = await this.registrarCuidadosUseCase.execute(body as RegistrarCuidadosDTO, usuarioId);
      res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message ?? 'Dados inválidos' });
      }
      if (error instanceof Error && error.message === 'Acesso negado. A planta não pertence a si.') {
        return res.status(403).json({ error: error.message });
      }
      if (
        error instanceof Error &&
        ['Atividade não encontrada.', 'Plantas repetidas na lista.', 'Informe ao menos um cuidado por planta.'].includes(error.message)
      ) {
        return res.status(400).json({ error: error.message });
      }

      console.error('Erro ao registrar cuidados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
```

Em `agenda.router.ts`, após a linha do `/concluir`: `agendaRouter.post('/registrar', agendaController.registrar.bind(agendaController));`

- [ ] **Step 10:** `cd server && npm test && npm run build` → PASS / ok.

- [ ] **Step 11: Smoke local** (API no Docker, token da conta local no header): `POST /api/agendas/registrar` com 1 planta, 2 atividades, 1 foto (URL qualquer `https://exemplo.com/a.webp`) → 201, 2 `concluidas`, foto com `agendaId` da primeira. Apagar a planta de teste depois.

- [ ] **Step 12: Commit**

```bash
git add server/src/modules/agenda
git commit -m "feat(api): registrar cuidados feitos em várias plantas com fotos (POST /agendas/registrar)"
```

---

### Task 11: Extrair `ProximosPassos` da tela de concluir

**Files:**
- Create: `web/src/components/care/ProximosPassos.tsx`
- Modify: `web/src/pages/ConcluirPage.tsx`

**Interfaces:**
- Produces: `export interface Proximo { atividadeId: string; data: string /* AAAA-MM-DD */ }`; `ProximosPassos({ value: Proximo[]; onChange(v: Proximo[]): void })` — usa `useAtividadesOrdenadas` e `useRevisaoDias` internamente (mostra o aviso da Revisão geral quando vazio).

- [ ] **Step 1:** Criar `ProximosPassos.tsx` movendo de `ConcluirPage` a interface `Proximo`, a constante `ATALHOS` (+1 sem/+2 sem/+1 mês) e todo o `<section>` "Próximos passos", trocando `proximos`/`setProximos` por `value`/`onChange` (as atualizações viram `onChange(value.map(...))`, `onChange(value.filter(...))`, `onChange([...value, { atividadeId: '', data: toDateInput(daquiADias(7)) }])`). Imports: `Plus`, `X` (lucide), `Button`, `daquiADias`, `toDateInput`, `useAtividadesOrdenadas`, `useRevisaoDias`.

- [ ] **Step 2:** Em `ConcluirPage`, `import { ProximosPassos, type Proximo } from '@/components/care/ProximosPassos';` e substituir a seção por `<ProximosPassos value={proximos} onChange={setProximos} />`; remover `ATALHOS`, `Proximo`, `useRevisaoDias` e imports que sobrarem.

- [ ] **Step 3:** `cd web && npm run build && npm run lint` → ok; no navegador, concluir uma tarefa com um próximo passo continua funcionando.

- [ ] **Step 4: Commit**

```bash
git add web/src
git commit -m "refactor(web): componente ProximosPassos compartilhado"
```

---

### Task 12: Página `/registrar`

**Files:**
- Create: `web/src/pages/RegistrarPage.tsx`
- Modify: `web/src/App.tsx` (rota), `web/src/context/CareContext.tsx`, `web/src/lib/endpoints.ts`
- Delete: `web/src/components/care/RegisterCareSheet.tsx`, `web/src/components/care/PlantaAtividadeFields.tsx`

**Interfaces:**
- Consumes: `useLoteFotos`, `ehNova`, `TriagemFotos`, `FilePreview`/`Miniaturas` (Task 8), `PlantasPicker` (Task 3), `AtividadeChips` (Task 3), `ProximosPassos` (Task 11), `POST /agendas/registrar` (Task 10).
- Produces: rota `/registrar?planta=<id>`; `agendasApi.registrar(body: RegistrarInput): Promise<ConcluirResultado>`.

- [ ] **Step 1: Endpoint** (`endpoints.ts`), remover `registrarFeito` e adicionar:

```ts
export interface RegistrarInput {
  data: string;
  plantas: {
    plantaId: string;
    atividadeIds: string[];
    detalhes?: string;
    observacaoFutura?: string;
    fotos?: { caminhoArquivo: string; dataCaptura?: string }[];
  }[];
  proximos?: { atividadeId: string; dataAgendada: string }[];
}
```

e em `agendasApi`: `registrar: (body: RegistrarInput) => data<ConcluirResultado>(api.post('/agendas/registrar', body)),`

- [ ] **Step 2: `RegistrarPage.tsx`:**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronDown, ImagePlus } from 'lucide-react';
import { Button, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { FilePreview, Miniaturas } from '@/components/FilePreview';
import { TriagemFotos } from '@/components/TriagemFotos';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { PlantasPicker } from '@/components/care/PlantasPicker';
import { ProximosPassos, type Proximo } from '@/components/care/ProximosPassos';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fromDateInput, plantaTitulo, toDateInput } from '@/lib/format';
import { ehNova, useLoteFotos } from '@/lib/loteFotos';
import { keys, usePlantas } from '@/lib/queries';

interface Ajuste {
  /** undefined = segue os tipos gerais */
  atividadeIds?: string[];
  detalhes: string;
  observacaoFutura: string;
}
const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '' };

type Fase = 'inicio' | 'triagem' | 'detalhes' | 'salvando';

/** Registrar cuidado: fotos primeiro → planta de cada foto → o que foi feito (geral ou por planta). */
export function RegistrarPage() {
  const [params] = useSearchParams();
  const plantaFixa = params.get('planta') ?? undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const lote = useLoteFotos(plantas.data);

  const [fase, setFase] = useState<Fase>('inicio');
  const [triagem, setTriagem] = useState({ inicio: 0, voltarDireto: false });
  const [semFoto, setSemFoto] = useState<string[] | null>(null);
  const [escolherPlantas, setEscolherPlantas] = useState(false);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [aberta, setAberta] = useState<string | null>(null);
  const [proximos, setProximos] = useState<Proximo[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);

  // Plantas tocadas: as das fotos (na ordem da 1ª foto) ou as escolhidas sem foto
  const tocadas = semFoto ?? [...new Set(lote.items.map((i) => i.plantaId).filter((p): p is string => !!p))];
  const fotosDe = (pid: string) => lote.items.map((item, i) => ({ item, i })).filter(({ item }) => item.plantaId === pid);
  const ajuste = (pid: string) => ajustes[pid] ?? AJUSTE_VAZIO;
  const setAjuste = (pid: string, patch: Partial<Ajuste>) => setAjustes((a) => ({ ...a, [pid]: { ...ajuste(pid), ...patch } }));
  const tiposDe = (pid: string) => ajuste(pid).atividadeIds ?? atividadeIds;

  function escolherArquivos(files: FileList | null) {
    const lista = [...(files ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!lista.length) return;
    setSemFoto(null);
    lote.trocarArquivos(lista, plantaFixa);
    if (plantaFixa) setFase('detalhes');
    else {
      setTriagem({ inicio: 0, voltarDireto: false });
      setFase('triagem');
    }
  }

  function registrarSemFoto() {
    if (plantaFixa) {
      setSemFoto([plantaFixa]);
      setFase('detalhes');
    } else setEscolherPlantas(true);
  }

  function salvar() {
    if (!tocadas.length) return toast('Nenhuma planta escolhida.', 'error');
    if (tocadas.some((pid) => !tiposDe(pid).length)) return toast('Escolha o que foi feito em cada planta.', 'error');
    if (!data || data > toDateInput()) return toast('A data não pode ser no futuro.', 'error');
    if (proximos.some((p) => !p.atividadeId || !p.data)) return toast('Complete os próximos passos.', 'error');
    setFase('salvando');
  }

  // Salvar: espera os uploads, cria plantas novas e registra tudo numa chamada
  const enviandoRef = useRef(false);
  useEffect(() => {
    if (fase !== 'salvando' || enviandoRef.current || lote.uploadsPendentes) return;
    if (lote.falhas.length) {
      toast(`${lote.falhas.length} foto(s) não foram enviadas.`, 'error');
      setFase('detalhes');
      return;
    }
    enviandoRef.current = true;
    (async () => {
      try {
        const mapa = await lote.criarPlantasNovas();
        const real = (pid: string) => mapa.get(pid) ?? pid;
        const hoje = data === toDateInput();
        const resultado = await agendasApi.registrar({
          data: hoje ? new Date().toISOString() : fromDateInput(data),
          plantas: tocadas.map((pid) => ({
            plantaId: real(pid),
            atividadeIds: tiposDe(pid),
            detalhes: (ajuste(pid).detalhes || detalhes).trim() || undefined,
            observacaoFutura: (ajuste(pid).observacaoFutura || observacaoFutura).trim() || undefined,
            fotos: fotosDe(pid)
              .filter(({ item }) => item.url)
              .map(({ item }) => ({ caminhoArquivo: item.url!, dataCaptura: item.dataCaptura })),
          })),
          proximos: proximos.length
            ? proximos.map((p) => ({ atividadeId: p.atividadeId, dataAgendada: fromDateInput(p.data) }))
            : undefined,
        });
        queryClient.invalidateQueries({ queryKey: keys.agendas });
        queryClient.invalidateQueries({ queryKey: ['fotos'] });
        queryClient.invalidateQueries({ queryKey: keys.plantas });
        const n = resultado.revisoes.length;
        toast(
          `Cuidado registrado 🌿${tocadas.length > 1 ? ` em ${tocadas.length} plantas` : ''}${
            n ? ` · ${n === 1 ? 'Revisão geral agendada' : `${n} revisões agendadas`}` : ''
          }`,
        );
        navigate(-1);
      } catch (error) {
        toast(errorMessage(error), 'error');
        setFase('detalhes');
      } finally {
        enviandoRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, lote.uploadsPendentes]);

  if (plantas.isLoading) return <Spinner />;

  // ───────────── Triagem ─────────────
  if (fase === 'triagem') {
    return (
      <TriagemFotos
        key={`${triagem.inicio}-${triagem.voltarDireto}`}
        lote={lote}
        inicio={triagem.inicio}
        voltarDireto={triagem.voltarDireto}
        onFim={() => setFase('detalhes')}
        onSair={() => navigate(-1)}
      />
    );
  }

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ''; }} />
      <input ref={galeriaRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ''; }} />
    </>
  );

  // ───────────── Início ─────────────
  if (fase === 'inicio') {
    const fixa = plantas.data?.find((p) => p.id === plantaFixa);
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Registrar cuidado" back />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-6 pb-16">
          {fixa && <p className="mb-2 text-center text-sm text-muted">{plantaTitulo(fixa)}</p>}
          <p className="mb-2 text-center text-lg font-semibold">Comece pelas fotos</p>
          <Button block onClick={() => cameraRef.current?.click()}>
            <Camera size={18} /> Tirar foto
          </Button>
          <Button block variant="secondary" onClick={() => galeriaRef.current?.click()}>
            <ImagePlus size={18} /> Escolher da galeria
          </Button>
          <button onClick={registrarSemFoto} className="mt-4 text-sm font-medium text-primary underline">
            Registrar sem foto
          </button>
        </div>
        {inputs}
        <PlantasPicker
          open={escolherPlantas}
          onClose={() => setEscolherPlantas(false)}
          selecionadas={[]}
          titulo="Em quais plantas?"
          onConfirmar={(ids) => {
            setEscolherPlantas(false);
            setSemFoto(ids);
            setFase('detalhes');
          }}
        />
      </div>
    );
  }

  // ───────────── O que foi feito ─────────────
  return (
    <div className="min-h-dvh pb-32">
      <PageHeader title="O que foi feito" back />
      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
        <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} label={tocadas.length > 1 ? 'Em todas as plantas' : 'Tipos de cuidado'} />

        <Field label="Quando">
          <input type="date" className="input" value={data} max={toDateInput()} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Nota (opcional)">
          <textarea className="input min-h-20" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="O que foi feito" />
        </Field>
        <Field label="Obs. para o futuro (opcional)" hint="Aparece em destaque no histórico da planta.">
          <textarea className="input min-h-16" value={observacaoFutura} onChange={(e) => setObservacaoFutura(e.target.value)} placeholder="Ex.: arame apertado no galho da esquerda" />
        </Field>

        <section>
          <span className="label">{tocadas.length > 1 ? `Plantas (${tocadas.length})` : 'Planta'}</span>
          <div className="space-y-2">
            {tocadas.map((pid) => {
              const alvo = lote.porId.get(pid);
              const fotos = fotosDe(pid);
              const aj = ajuste(pid);
              const proprio = !!(aj.atividadeIds || aj.detalhes || aj.observacaoFutura);
              return (
                <div key={pid} className="card overflow-hidden">
                  <button type="button" onClick={() => setAberta(aberta === pid ? null : pid)} className="flex w-full items-center gap-3 p-2.5 text-left" aria-expanded={aberta === pid}>
                    {fotos[0] ? (
                      <FilePreview file={fotos[0].item.file} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <PlantThumb url={alvo?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {alvo?.identificador ? `#${alvo.identificador} · ` : ''}
                        {alvo?.nova ? 'Planta nova' : plantaTitulo(alvo)}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {fotos.length ? `${fotos.length} foto(s)` : 'Sem foto'}
                        {ehNova(pid) && ' · será criada ao salvar'}
                      </span>
                      {proprio && <span className="text-xs font-medium text-primary">Com ajuste próprio</span>}
                    </span>
                    <ChevronDown size={20} className={`shrink-0 text-muted transition ${aberta === pid ? 'rotate-180' : ''}`} />
                  </button>
                  {aberta === pid && (
                    <div className="space-y-3 border-t border-line p-3">
                      <AtividadeChips value={tiposDe(pid)} onChange={(ids) => setAjuste(pid, { atividadeIds: ids })} label="O que foi feito nesta" />
                      {aj.atividadeIds && (
                        <button type="button" className="text-xs font-medium text-primary" onClick={() => setAjuste(pid, { atividadeIds: undefined })}>
                          Usar os cuidados gerais
                        </button>
                      )}
                      <Field label="Nota desta planta">
                        <textarea className="input min-h-16" value={aj.detalhes} onChange={(e) => setAjuste(pid, { detalhes: e.target.value })} placeholder={detalhes || 'Substitui a nota geral'} />
                      </Field>
                      <Field label="Obs. desta planta">
                        <textarea className="input min-h-16" value={aj.observacaoFutura} onChange={(e) => setAjuste(pid, { observacaoFutura: e.target.value })} placeholder={observacaoFutura || 'Substitui a obs. geral'} />
                      </Field>
                      {!!fotos.length && !plantaFixa && (
                        <Miniaturas
                          fotos={fotos}
                          onClick={(i) => {
                            setTriagem({ inicio: i, voltarDireto: true });
                            setFase('triagem');
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {lote.items.some((i) => i.plantaId === null) && (
            <p className="mt-2 text-xs text-muted">{lote.items.filter((i) => i.plantaId === null).length} foto(s) puladas não serão salvas.</p>
          )}
        </section>

        <ProximosPassos value={proximos} onChange={setProximos} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto mb-3 max-w-2xl space-y-2">
          {lote.falhas.length > 0 && fase !== 'salvando' && (
            <Button block variant="secondary" onClick={() => { lote.reenviarFalhas(); setFase('salvando'); }}>
              Reenviar {lote.falhas.length} foto(s) e salvar
            </Button>
          )}
          <Button block onClick={salvar} loading={fase === 'salvando'}>
            {fase === 'salvando' && lote.uploadsPendentes ? `Enviando fotos… ${lote.enviados}/${lote.enviaveis}` : 'Registrar'}
          </Button>
        </div>
      </div>
      {inputs}
    </div>
  );
}
```

- [ ] **Step 3: Rota** (`App.tsx`): `import { RegistrarPage } from '@/pages/RegistrarPage';` e, junto de `/concluir`: `<Route path="/registrar" element={<Privada><RegistrarPage /></Privada>} />`.

- [ ] **Step 4: `CareContext.tsx`:** `registrarCuidado: (plantaId?: string) => navigate(plantaId ? `/registrar?planta=${plantaId}` : '/registrar')`; remover o tipo `'registrar'` de `Aberto`, o import e o render de `RegisterCareSheet`. Apagar `RegisterCareSheet.tsx` e `PlantaAtividadeFields.tsx` (`git rm`). Conferir com `grep -rn "PlantaAtividadeFields\|RegisterCareSheet\|registrarFeito" web/src` → nada.

- [ ] **Step 5:** `cd web && npm run build && npm run lint` → ok.

- [ ] **Step 6: Navegador** (conta de teste, 390px):
  1. Bancada → Registrar: 3 fotos da galeria; foto 1 `#código existente A`, foto 2 `#novo` → Criar planta, foto 3 Anterior. Em "O que foi feito": geral = Rega; abrir a planta nova → chips já com Rega marcada; marcar Poda; nota própria. Registrar → toast; histórico da planta A com Rega + foto; planta nova no topo da Coleção com "!", capa, 2 fotos ligadas ao cuidado; Revisão geral agendada.
  2. Detalhe da planta → Registrar cuidado → câmera/galeria pula a triagem.
  3. "Registrar sem foto" → picker por espécie → registrar.

- [ ] **Step 7: Commit**

```bash
git add -A web/src
git commit -m "feat(web): registrar cuidado começando pelas fotos, com ajuste por planta"
```

---

### Task 13: Fechamento

**Files:**
- Modify: `CLAUDE.md` (seção do frontend: `RegistrarPage /registrar`, `TriagemFotos`/`useLoteFotos`, `POST /api/agendas/registrar`, lote com `plantaIds`; TODO "Register multiple tasks" → DONE)

- [ ] **Step 1:** `cd server && npm test && npm run build` e `cd web && npm run build && npm run lint` → tudo ok (colar a saída resumida no relatório).
- [ ] **Step 2:** Atualizar `CLAUDE.md` como acima.
- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md com registrar/agendar em lote e triagem compartilhada"
```

- [ ] **Step 4:** Usar superpowers:finishing-a-development-branch (não fazer push/merge na `main` sem o usuário pedir — o deploy de produção sai da `main`).
