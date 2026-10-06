# Tarefas inteligentes — Fase 3 (sazonalidade + Revisão geral como rotina) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rotinas respeitam estações do ano (pré-preenchidas pelo `GuiaSazonal` da espécie) e a Revisão geral deixa de ser caso especial: vira uma rotina de cada planta que qualquer cuidado remarca.

**Architecture:** `estacaoDe(data)` (hemisfério sul, datas fixas) num arquivo de domínio isolado; `proximaDataRotina` pula para o início da próxima estação ativa. Rotinas com `revisao = true` saem do avanço comum (`planejarProximas`) e passam por `remarcarRevisoes` em concluir/registrar. `planejarSeguimento` perde a lógica de revisão. Plantas novas ganham a rotina de revisão no `CreatePlantaUseCase`; plantas existentes, por migração SQL.

**Tech Stack:** Express + Zod + Prisma 5 (Postgres 14 local / Neon) + Jest; React 19 + TanStack Query + Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-10-05-tarefas-inteligentes-design.md` — regras 2, 3 (estações), 6, 7, 10; Interface (chips de estação pré-marcados pelo guia, Perfil); Migração item 2; Limitações conhecidas.

## Global Constraints

- Português em código/UI/commits; commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; branch `develop`; nunca commitar `docs/problemas_encontrados.md`.
- Estações, hemisfério sul, datas fixas de início: **Primavera 22/09, Verão 21/12, Outono 20/03, Inverno 21/06**. Calculadas em UTC (o app grava datas ao meio-dia de Brasília = 15h UTC). `estacoes` vazio (ou `null`) = ano todo. Toda lógica de estação fica em `estacaoDe`/`proximoInicioDeEstacao` (trocáveis no futuro).
- Fora da estação, a próxima vai para o **1º dia da próxima estação ativa** (15h UTC); depois aplica `dataFim`.
- Pré-preenchimento pelo guia: estações com `momentoIdeal = EVITAR` desmarcadas; sem guia → todas marcadas.
- Revisão geral: **qualquer cuidado concluído na planta** (tarefa, lote, registro, inclusive a própria revisão) remarca a pendente da rotina de revisão para `dataFeita + intervalo` (respeitando estações/pausa/fim); sem pendente, cria. Plantas novas recebem a rotina com intervalo = preferência `revisao_automatica_dias` (padrão 30; 0 = não cria) e a 1ª pendente em hoje + intervalo. O caso especial de revisão no `planejarSeguimento` deixa de existir.
- Migração: cria rotina de revisão para cada planta existente cujo dono tem preferência > 0 (padrão 30) e vincula a revisão pendente mais próxima, se houver; plantas sem revisão pendente ficam sem pendente até o próximo cuidado.
- `@prisma/client` é mockado nos testes: só imports de tipo em código testado.
- Container `bonsai_api` sem hot reload: `docker restart bonsai_api` após mudar `server/`.

---

### Task 1: Domínio — estações e remarcação da revisão

**Files:**
- Create: `server/src/modules/agenda/dominio/estacoes.ts`, `server/src/modules/agenda/dominio/estacoes.test.ts`
- Modify: `server/src/modules/agenda/dominio/rotina.ts`, `server/src/modules/agenda/dominio/rotina.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // estacoes.ts
  export type Estacao = 'PRIMAVERA' | 'VERAO' | 'OUTONO' | 'INVERNO';
  export const ESTACOES: Estacao[];
  export function estacaoDe(data: Date): Estacao;
  export function proximoInicioDeEstacao(ativas: Estacao[], aPartirDe: Date): Date;
  // rotina.ts
  RegraRotina ganha `estacoes?: Estacao[] | null`; RotinaEstado ganha `revisao?: boolean`;
  export interface RevisaoEstado extends RotinaBase { pendenteId: string | null }
  export interface Remarcacao { mover: { agendaId: string; dataAgendada: Date }[]; criar: ProximaDeRotina[] }
  export function remarcarRevisoes(revisoes: RevisaoEstado[], data: Date): Remarcacao;
  ```

- [ ] **Step 1: Testes que falham**

`server/src/modules/agenda/dominio/estacoes.test.ts`:
```ts
import { estacaoDe, proximoInicioDeEstacao } from './estacoes';

const d = (iso: string) => new Date(`${iso}T15:00:00.000Z`);

describe('estacaoDe (hemisfério sul)', () => {
  it.each([
    ['2026-09-21', 'INVERNO'],
    ['2026-09-22', 'PRIMAVERA'],
    ['2026-12-20', 'PRIMAVERA'],
    ['2026-12-21', 'VERAO'],
    ['2027-01-15', 'VERAO'],
    ['2027-03-19', 'VERAO'],
    ['2027-03-20', 'OUTONO'],
    ['2027-06-20', 'OUTONO'],
    ['2027-06-21', 'INVERNO'],
  ])('%s é %s', (data, estacao) => {
    expect(estacaoDe(d(data))).toBe(estacao);
  });
});

describe('proximoInicioDeEstacao', () => {
  it('vai para o início da próxima estação ativa no mesmo ano', () => {
    expect(proximoInicioDeEstacao(['PRIMAVERA', 'VERAO'], d('2026-05-10'))).toEqual(d('2026-09-22'));
  });

  it('passa para o ano seguinte quando preciso', () => {
    expect(proximoInicioDeEstacao(['VERAO'], d('2027-04-01'))).toEqual(d('2027-12-21'));
    expect(proximoInicioDeEstacao(['OUTONO'], d('2026-12-25'))).toEqual(d('2027-03-20'));
  });
});
```

Em `rotina.test.ts`, importar também `remarcarRevisoes` e `RevisaoEstado` e adicionar:
```ts
describe('proximaDataRotina com estações', () => {
  const MAIO = new Date('2026-05-01T15:00:00.000Z');

  it('dentro da estação ativa, só soma o intervalo', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: ['OUTONO'] }, MAIO)).toEqual(
      new Date('2026-05-15T15:00:00.000Z'),
    );
  });

  it('fora das estações ativas, pula para o início da próxima', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: ['PRIMAVERA', 'VERAO'] }, MAIO)).toEqual(
      new Date('2026-09-22T15:00:00.000Z'),
    );
  });

  it('a data final vale depois do salto de estação', () => {
    expect(
      proximaDataRotina({ intervaloDias: 14, dataFim: new Date('2026-08-01T00:00:00.000Z'), estacoes: ['PRIMAVERA'] }, MAIO),
    ).toBeNull();
  });

  it('estações vazias ou nulas = ano todo', () => {
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: [] }, MAIO)).toEqual(new Date('2026-05-15T15:00:00.000Z'));
    expect(proximaDataRotina({ intervaloDias: 14, dataFim: null, estacoes: null }, MAIO)).toEqual(new Date('2026-05-15T15:00:00.000Z'));
  });
});

describe('planejarProximas e a revisão', () => {
  it('rotina de revisão não avança por aqui (é remarcada à parte)', () => {
    expect(planejarProximas([rotina({ revisao: true })], [{ rotinaId: 'r1', data: BASE }])).toEqual([]);
  });
});

describe('remarcarRevisoes', () => {
  const rev = (over: Partial<RevisaoEstado> = {}): RevisaoEstado => ({
    id: 'rev1',
    plantaId: 'p1',
    atividadeId: 'revisao',
    intervaloDias: 30,
    dataFim: null,
    pausada: false,
    pendenteId: 'ag-r',
    ...over,
  });

  it('move a pendente para a data do cuidado + intervalo', () => {
    expect(remarcarRevisoes([rev()], BASE)).toEqual({ mover: [{ agendaId: 'ag-r', dataAgendada: dias(30) }], criar: [] });
  });

  it('sem pendente, cria', () => {
    expect(remarcarRevisoes([rev({ pendenteId: null })], BASE)).toEqual({
      mover: [],
      criar: [{ rotinaId: 'rev1', plantaId: 'p1', atividadeId: 'revisao', dataAgendada: dias(30) }],
    });
  });

  it('pausada ou após a data final não mexe em nada', () => {
    expect(remarcarRevisoes([rev({ pausada: true }), rev({ id: 'rev2', dataFim: dias(10) })], BASE)).toEqual({ mover: [], criar: [] });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `cd server && npm test -- dominio` → FAIL.

- [ ] **Step 3: Implementar**

`server/src/modules/agenda/dominio/estacoes.ts`:
```ts
/** Estações do hemisfério sul com datas fixas de início. Única fonte de "em que estação estamos" (trocável no futuro). */
export type Estacao = 'PRIMAVERA' | 'VERAO' | 'OUTONO' | 'INVERNO';

export const ESTACOES: Estacao[] = ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'];

/** Início de cada estação: [estação, mês (1-12), dia]. */
const INICIOS: [Estacao, number, number][] = [
  ['OUTONO', 3, 20],
  ['INVERNO', 6, 21],
  ['PRIMAVERA', 9, 22],
  ['VERAO', 12, 21],
];

/** Hora usada nas datas geradas: meio-dia de Brasília. */
const HORA_UTC = 15;

/** Estação da data (dia em UTC). */
export function estacaoDe(data: Date): Estacao {
  const md = (data.getUTCMonth() + 1) * 100 + data.getUTCDate();
  if (md >= 1221 || md < 320) return 'VERAO';
  if (md < 621) return 'OUTONO';
  if (md < 922) return 'INVERNO';
  return 'PRIMAVERA';
}

/** Primeiro início (15h UTC) de uma das estações ativas a partir de `aPartirDe`. */
export function proximoInicioDeEstacao(ativas: Estacao[], aPartirDe: Date): Date {
  const ano = aPartirDe.getUTCFullYear();
  const candidatos = [ano, ano + 1].flatMap((a) =>
    INICIOS.filter(([e]) => ativas.includes(e)).map(([, mes, dia]) => Date.UTC(a, mes - 1, dia, HORA_UTC)),
  );
  return new Date(Math.min(...candidatos.filter((t) => t >= aPartirDe.getTime())));
}
```

`rotina.ts`:
- `import { Estacao, estacaoDe, proximoInicioDeEstacao } from './estacoes';`
- `RegraRotina` ganha `/** Vazio ou null = ano todo. */ estacoes?: Estacao[] | null;`
- `RotinaEstado` ganha `/** Revisão geral da planta: remarcada por qualquer cuidado (ver `remarcarRevisoes`). */ revisao?: boolean;`
- `proximaDataRotina` passa a ser:
```ts
/** Rolante: a próxima é `base + intervalo`; fora das estações ativas, vai para o início da próxima; depois da data final não há próxima. */
export function proximaDataRotina(regra: RegraRotina, base: Date): Date | null {
  let data = new Date(base.getTime() + regra.intervaloDias * DIA_MS);
  if (regra.estacoes?.length && !regra.estacoes.includes(estacaoDe(data))) {
    data = proximoInicioDeEstacao(regra.estacoes, data);
  }
  return regra.dataFim && data > regra.dataFim ? null : data;
}
```
- em `planejarProximas`, trocar `if (!base || r.pausada || r.temPendente) return [];` por `if (!base || r.pausada || r.temPendente || r.revisao) return [];`
- adicionar:
```ts
export interface RevisaoEstado extends RotinaBase {
  /** Pendente atual (fora as concluídas agora). */
  pendenteId: string | null;
}

export interface Remarcacao {
  mover: { agendaId: string; dataAgendada: Date }[];
  criar: ProximaDeRotina[];
}

/** Qualquer cuidado na planta remarca a Revisão geral para `data + intervalo` (respeitando estações, pausa e fim). */
export function remarcarRevisoes(revisoes: RevisaoEstado[], data: Date): Remarcacao {
  const r: Remarcacao = { mover: [], criar: [] };
  for (const rev of revisoes) {
    if (rev.pausada) continue;
    const dataAgendada = proximaDataRotina(rev, data);
    if (!dataAgendada) continue;
    if (rev.pendenteId) r.mover.push({ agendaId: rev.pendenteId, dataAgendada });
    else r.criar.push({ rotinaId: rev.id, plantaId: rev.plantaId, atividadeId: rev.atividadeId, dataAgendada });
  }
  return r;
}
```

- [ ] **Step 4: Rodar** — `cd server && npm test -- dominio` → PASS. Depois `npm test && npm run build` → PASS.

- [ ] **Step 5: Commit**
```bash
git add server/src/modules/agenda/dominio
git commit -m "feat(api): estações do ano e remarcação da revisão nas regras de rotina

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Estações no CRUD de rotinas e no "repetir"

**Files:**
- Modify: `server/src/modules/rotina/rotina.types.ts`, `rotina.schema.ts`, `use-cases/criar-rotinas.use-case.ts`, `use-cases/atualizar-rotina.use-case.ts`, `use-cases/rotina.use-cases.test.ts`, `repositories/prisma-rotina.repository.ts`; `server/src/modules/agenda/agenda.types.ts`, `agenda.schema.ts`, `use-cases/planejar-seguimento.ts`, `use-cases/planejar-seguimento.test.ts`, `repositories/prisma-conclusao.repository.ts`

**Interfaces:**
- Consumes: `Estacao`, `ESTACOES` (Task 1).
- Produces: `CriarRotinasDTO.estacoes?: Estacao[]`, `AtualizarRotinaDTO.estacoes?: Estacao[]`, `NovaRotina.estacoes: Estacao[]`, `RotinaRepository.atualizar` aceita `estacoes` em `dados`; `Proximo.repetir.estacoes?: Estacao[]`; `NovaRotinaDePasso.estacoes: Estacao[]`. API: `estacoes?: ('PRIMAVERA'|'VERAO'|'OUTONO'|'INVERNO')[]` em `POST /rotinas`, `PUT /rotinas/:id` e `proximos[].repetir`. Respostas de rotina (`GET /rotinas`, etc.) já trazem `estacoes` (coluna da tabela).

- [ ] **Step 1: Testes que falham**

Em `rotina.use-cases.test.ts`:
- no teste `'cria uma rotina por planta+atividade, ...'`, o item esperado em `repo.criar` ganha `estacoes: []`;
- no teste `'usa a primeira data e a data final informadas'`, passar `estacoes: ['PRIMAVERA', 'VERAO', 'VERAO']` no DTO e esperar `estacoes: ['PRIMAVERA', 'VERAO']`;
- nos testes de `AtualizarRotinaUseCase`, os `dados` esperados em `repo.atualizar` ganham `estacoes: []` (o `info()` não tem estações → `[]`);
- adicionar em `describe('AtualizarRotinaUseCase')`:
```ts
    it('mudar as estações recalcula a próxima', async () => {
      // 2026-10-05 + 14 = 19/10 (primavera); só verão → 21/12
      await useCase().execute('r1', { estacoes: ['VERAO'] }, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith(
        'r1',
        { intervaloDias: 14, dataFim: null, estacoes: ['VERAO'] },
        { tipo: 'mover', agendaId: 'ag-1', data: new Date('2026-12-21T15:00:00.000Z') },
      );
    });
```
Em `planejar-seguimento.test.ts`, no teste `'próximo com repetir vira rotina ...'`, o 1º próximo ganha `estacoes: ['PRIMAVERA']` dentro de `repetir` e os itens esperados em `criarRotinas` ganham `estacoes: ['PRIMAVERA']` e `estacoes: []`, respectivamente.

Run: `cd server && npm test -- rotina.use-cases planejar-seguimento` → FAIL.

- [ ] **Step 2: Tipos**

`rotina.types.ts`: `import { Estacao } from '../agenda/dominio/estacoes';`; `CriarRotinasDTO` e `AtualizarRotinaDTO` ganham `estacoes?: Estacao[];`; `NovaRotina` ganha `estacoes: Estacao[];`; em `RotinaRepository.atualizar`, `dados` ganha `estacoes?: Estacao[];`.
`agenda.types.ts`: `import { Estacao } from './dominio/estacoes';`; `Proximo.repetir` vira `{ intervaloDias: number; dataFim?: string; estacoes?: Estacao[] }`; `NovaRotinaDePasso` ganha `estacoes: Estacao[];`.

- [ ] **Step 3: Schemas** — em `rotina.schema.ts`:
```ts
export const estacoesSchema = z
  .array(z.enum(['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'], { message: 'Estação inválida.' }))
  .max(4);
```
e `estacoes: estacoesSchema.optional(),` em `criarRotinasSchema.body` e em `atualizarRotinaSchema.body`. Em `agenda.schema.ts`, importar `estacoesSchema` de `../rotina/rotina.schema` e adicionar `estacoes: estacoesSchema.optional(),` ao objeto `repetir` do `proximoSchema`.

- [ ] **Step 4: Use cases**

`criar-rotinas.use-case.ts`: antes de `novas`, `const estacoes = [...new Set(dto.estacoes ?? [])];` e incluir `estacoes` no objeto de cada nova rotina (`{ plantaId, atividadeId, intervaloDias: dto.intervaloDias, dataFim, estacoes, primeiraData, detalhes }`).
`atualizar-rotina.use-case.ts`: `regra` ganha `estacoes: dto.estacoes ? [...new Set(dto.estacoes)] : (rotina.estacoes ?? []),`.
`planejar-seguimento.ts`: no objeto de `criarRotinas`, adicionar `estacoes: p.repetir.estacoes ?? [],`.

- [ ] **Step 5: Repositórios**

`prisma-rotina.repository.ts`:
- `criar`: `tx.rotina.create({ data: { ..., estacoes: n.estacoes } })`;
- `findDoUsuario`: incluir `estacoes: rotina.estacoes,` no objeto retornado;
- `findPendenteComRotina`: acrescentar `estacoes: true` ao `select` de `rotina`.
`prisma-conclusao.repository.ts`:
- `estadoRotinas`: acrescentar `estacoes: true, revisao: true` ao `select`;
- `criarComRotinas`: `tx.rotina.create({ data: { ..., estacoes: r.estacoes } })`.

- [ ] **Step 6: Rodar** — `cd server && npm test && npm run build` → PASS.

- [ ] **Step 7: Commit**
```bash
git add server/src/modules/rotina server/src/modules/agenda
git commit -m "feat(api): rotinas com estações do ano

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Revisão geral como rotina (concluir/registrar)

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts`, `use-cases/planejar-seguimento.ts`, `use-cases/planejar-seguimento.test.ts`, `use-cases/concluir-agendas.use-case.ts`, `use-cases/concluir-agendas.use-case.test.ts`, `use-cases/registrar-cuidados.use-case.ts`, `use-cases/registrar-cuidados.use-case.test.ts`, `repositories/prisma-conclusao.repository.ts`; `web/src/lib/endpoints.ts`, `web/src/pages/ConcluirPage.tsx`, `web/src/pages/RegistrarPage.tsx`, `web/src/components/care/ProximosPassos.tsx`

**Interfaces:**
- Consumes: `remarcarRevisoes`, `RevisaoEstado` (Task 1).
- Produces:
  - `planejarSeguimento(plantas: string[], proximos: Proximo[]): { criarPendentes: NovaPendente[]; criarRotinas: NovaRotinaDePasso[] }` (síncrona, sem repositório).
  - `ConclusaoRepository.revisoesDasPlantas(plantaIds: string[], excluirAgendaIds: string[]): Promise<RevisaoEstado[]>`; **removidos** `getRevisaoDias` e `proximasPendentes`.
  - `PlanoConclusao`/`PlanoRegistro`: **sem** `revisoes`; **com** `moverPendentes: { agendaId: string; dataAgendada: Date }[]`.
  - `ResultadoConclusao`: `{ concluidas: any[]; criadas: any[] }` (sem `revisoes`). Web: `ConcluirResultado` idem.

- [ ] **Step 1: Testes (reescrever os de revisão)**

a) Substituir `planejar-seguimento.test.ts` inteiro por:
```ts
import { planejarSeguimento } from './planejar-seguimento';

describe('planejarSeguimento', () => {
  it('cria os próximos passos em cada planta', () => {
    const r = planejarSeguimento(['p1', 'p2'], [{ atividadeId: 'at', dataAgendada: '2026-11-01T12:00:00.000Z' }]);

    expect(r.criarPendentes).toEqual([
      { plantaId: 'p1', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
      { plantaId: 'p2', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
    ]);
    expect(r.criarRotinas).toEqual([]);
  });

  it('sem próximos, não agenda nada', () => {
    expect(planejarSeguimento(['p1'], [])).toEqual({ criarPendentes: [], criarRotinas: [] });
  });

  it('próximo com repetir vira rotina (e não pendente avulsa)', () => {
    const r = planejarSeguimento(['p1'], [
      {
        atividadeId: 'at',
        dataAgendada: '2026-11-01T12:00:00.000Z',
        repetir: { intervaloDias: 14, dataFim: '2027-03-01T12:00:00.000Z', estacoes: ['PRIMAVERA'] },
      },
      { atividadeId: 'at2', dataAgendada: '2026-11-02T12:00:00.000Z', repetir: { intervaloDias: 7 } },
    ]);

    expect(r.criarPendentes).toEqual([]);
    expect(r.criarRotinas).toEqual([
      {
        plantaId: 'p1',
        atividadeId: 'at',
        intervaloDias: 14,
        dataFim: new Date('2027-03-01T12:00:00.000Z'),
        estacoes: ['PRIMAVERA'],
        dataAgendada: new Date('2026-11-01T12:00:00.000Z'),
      },
      { plantaId: 'p1', atividadeId: 'at2', intervaloDias: 7, dataFim: null, estacoes: [], dataAgendada: new Date('2026-11-02T12:00:00.000Z') },
    ]);
  });
});
```

b) `concluir-agendas.use-case.test.ts`:
- no objeto `repo`: remover `getRevisaoDias` e `proximasPendentes`; adicionar `revisoesDasPlantas: jest.fn().mockResolvedValue([]),`; o `executar` resolve `{ concluidas: [], criadas: [] }`;
- **apagar** os testes `'cria revisão em N dias quando a planta não tem pendente'`, `'não cria revisão se a próxima pendente está dentro de N + 30 dias'`, `'cria revisão se a próxima pendente está além de N + 30 dias'`, `'não cria revisão quando a preferência está desligada (0)'`, `'avalia a revisão uma vez por planta distinta'`;
- no teste `'cria próximos passos por planta e não cria revisão'`, renomear para `'cria próximos passos por planta'` e remover as linhas com `revisoes` e `getRevisaoDias`;
- no teste de rotina `'concluir tarefa de rotina ...'`, renomear para `'concluir tarefa de rotina agenda a próxima a partir da data feita'` e remover a linha `expect(plano().revisoes)...`;
- adicionar:
```ts
  describe('Revisão geral (rotina)', () => {
    const rev = { id: 'rev1', plantaId: 'pl-1', atividadeId: 'at-rev', intervaloDias: 30, dataFim: null, pausada: false };

    it('qualquer cuidado remarca a revisão pendente da planta para data feita + intervalo', async () => {
      repo.revisoesDasPlantas.mockResolvedValue([{ ...rev, pendenteId: 'ag-rev' }]);

      await useCase.execute(base, 'user-1');

      expect(repo.revisoesDasPlantas).toHaveBeenCalledWith(['pl-1'], ['ag-1']);
      expect(plano().moverPendentes).toEqual([{ agendaId: 'ag-rev', dataAgendada: emDias(30) }]);
      expect(plano().criarPendentes).toEqual([]);
    });

    it('concluir a própria revisão cria a próxima', async () => {
      repo.revisoesDasPlantas.mockResolvedValue([{ ...rev, pendenteId: null }]);

      await useCase.execute(base, 'user-1');

      expect(plano().moverPendentes).toEqual([]);
      expect(plano().criarPendentes).toEqual([
        { rotinaId: 'rev1', plantaId: 'pl-1', atividadeId: 'at-rev', dataAgendada: emDias(30) },
      ]);
    });

    it('consulta as revisões uma vez, com as plantas distintas', async () => {
      repo.findPendentesDoUsuario.mockResolvedValue([
        { id: 'ag-1', plantaId: 'pl-1', rotinaId: null },
        { id: 'ag-2', plantaId: 'pl-1', rotinaId: null },
      ]);
      await useCase.execute({ ...base, itens: [{ agendaId: 'ag-1' }, { agendaId: 'ag-2' }] }, 'user-1');
      expect(repo.revisoesDasPlantas).toHaveBeenCalledTimes(1);
      expect(repo.revisoesDasPlantas).toHaveBeenCalledWith(['pl-1'], ['ag-1', 'ag-2']);
    });
  });
```

c) `registrar-cuidados.use-case.test.ts`:
- no objeto `repo`: remover `getRevisaoDias` e `proximasPendentes`; adicionar `revisoesDasPlantas: jest.fn().mockResolvedValue([]),`; `registrar` resolve `{ concluidas: [], criadas: [] }`;
- teste `'com próximos passos, cria as pendentes e não agenda revisão'` → renomear para `'com próximos passos, cria as pendentes'` e remover a linha de `revisoes`;
- substituir o teste `'sem próximos, agenda a Revisão geral automática'` por:
```ts
  it('remarca a Revisão geral de cada planta para a data do registro + intervalo', async () => {
    repo.revisoesDasPlantas.mockResolvedValue([
      { id: 'rev1', plantaId: 'p1', atividadeId: 'at-rev', intervaloDias: 30, dataFim: null, pausada: false, pendenteId: 'ag-rev' },
    ]);

    await useCase.execute(base, 'user-1');

    expect(repo.revisoesDasPlantas).toHaveBeenCalledWith(['p1'], []);
    expect(plano().moverPendentes).toEqual([{ agendaId: 'ag-rev', dataAgendada: new Date(AGORA.getTime() + 30 * DIA) }]);
  });
```
- no teste `'tarefa de rotina concluída pelo registro agenda a próxima'`, remover a linha de `revisoes`;
- no teste `'a tarefa escolhida é absorvida pelo registro e não conta como próxima pendente'`, renomear para `'a tarefa escolhida é absorvida pelo registro'` e trocar a última linha (`proximasPendentes`) por `expect(repo.revisoesDasPlantas).toHaveBeenCalledWith(['p1'], ['ag-1']);`.

d) Remover qualquer outra asserção restante sobre `revisoes`, `getRevisaoDias` ou `proximasPendentes` nesses três arquivos de teste (`grep -n "revisoes\|getRevisaoDias\|proximasPendentes"`).

Run: `cd server && npm test -- planejar-seguimento concluir-agendas registrar-cuidados` → FAIL.

- [ ] **Step 2: Tipos** (`agenda.types.ts`)
- `import { RevisaoEstado, RotinaEstado } from './dominio/rotina';`
- em `PlanoConclusao` e `PlanoRegistro`: remover `revisoes`; adicionar
  ```ts
  /** Pendentes (Revisão geral) remarcadas para uma nova data. */
  moverPendentes: { agendaId: string; dataAgendada: Date }[];
  ```
- `ResultadoConclusao` = `{ concluidas: any[]; criadas: any[] }`.
- em `ConclusaoRepository`: remover `getRevisaoDias` e `proximasPendentes`; adicionar
  ```ts
  /** Rotinas de Revisão geral das plantas, com a pendente atual (ignorando `excluirAgendaIds`). */
  revisoesDasPlantas(plantaIds: string[], excluirAgendaIds: string[]): Promise<RevisaoEstado[]>;
  ```
- manter as constantes `ATIVIDADE_REVISAO` e `PREF_REVISAO_DIAS` (usadas na Task 4).

- [ ] **Step 3: `planejar-seguimento.ts`** — substituir o arquivo por:
```ts
import { NovaPendente, NovaRotinaDePasso, Proximo } from '../agenda.types';

export interface Seguimento {
  criarPendentes: NovaPendente[];
  criarRotinas: NovaRotinaDePasso[];
}

/** Próximos passos informados, em cada planta: avulsos viram pendentes; com `repetir`, rotinas. */
export function planejarSeguimento(plantas: string[], proximos: Proximo[]): Seguimento {
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
              estacoes: p.repetir.estacoes ?? [],
              dataAgendada: new Date(p.dataAgendada),
            },
          ]
        : [],
    ),
  );
  return { criarPendentes, criarRotinas };
}
```

- [ ] **Step 4: Use cases**

`concluir-agendas.use-case.ts`: importar `remarcarRevisoes` de `../dominio/rotina`; substituir a linha `const seguimento = await planejarSeguimento(this.repo, {...});` por:
```ts
    const seguimento = planejarSeguimento(plantas, proximos);
    // Qualquer cuidado na planta remarca a Revisão geral dela
    const revisoes = remarcarRevisoes(await this.repo.revisoesDasPlantas(plantas, ids), dataConcluida);
```
e, no `plano`, trocar `...seguimento, criarPendentes: [...seguimento.criarPendentes, ...rotinas],` por:
```ts
      ...seguimento,
      criarPendentes: [...seguimento.criarPendentes, ...rotinas, ...revisoes.criar],
      moverPendentes: revisoes.mover,
```
Atualizar o JSDoc da classe para `/** Conclui uma ou várias tarefas, avança rotinas, remarca a Revisão geral e agenda os próximos passos. */`.

`registrar-cuidados.use-case.ts`: importar `remarcarRevisoes`; trocar o comentário e o bloco `const seguimento = await planejarSeguimento(this.repo, {...});` por:
```ts
    // Pendentes concluídas/canceladas aqui avançam a rotina; qualquer cuidado remarca a Revisão geral
    const seguimento = planejarSeguimento(plantas, proximos);
    const revisoes = remarcarRevisoes(await this.repo.revisoesDasPlantas(plantas, concluirIds), data);
```
(mantendo a linha `const rotinas = await planejarRotinas(...)` acima dela) e, no `registrar({...})`, trocar `criarPendentes: [...seguimento.criarPendentes, ...rotinas],` por:
```ts
      criarPendentes: [...seguimento.criarPendentes, ...rotinas, ...revisoes.criar],
      moverPendentes: revisoes.mover,
```

- [ ] **Step 5: Repositório** (`prisma-conclusao.repository.ts`)
- remover `getRevisaoDias`, `proximasPendentes`, `criarRevisoes`, a constante `REVISAO_PADRAO_DIAS` e os imports que ficarem sem uso (`ATIVIDADE_REVISAO`, `PREF_REVISAO_DIAS`);
- adicionar:
```ts
  async revisoesDasPlantas(plantaIds: string[], excluirAgendaIds: string[]) {
    const rotinas = await prisma.rotina.findMany({
      where: { plantaId: { in: plantaIds }, revisao: true },
      select: {
        id: true,
        plantaId: true,
        atividadeId: true,
        intervaloDias: true,
        dataFim: true,
        pausada: true,
        estacoes: true,
        agendas: {
          where: { status: 'PENDENTE', id: { notIn: excluirAgendaIds } },
          select: { id: true },
          orderBy: { dataAgendada: 'asc' },
          take: 1,
        },
      },
    });
    return rotinas.map(({ agendas, ...r }) => ({ ...r, pendenteId: agendas[0]?.id ?? null }));
  }

  /** Remarca pendentes (Revisão geral); revalida PENDENTE para não mexer em tarefa já resolvida. */
  private async moverPendentes(tx: Prisma.TransactionClient, itens: { agendaId: string; dataAgendada: Date }[]) {
    for (const m of itens) {
      await tx.agenda.updateMany({ where: { id: m.agendaId, status: 'PENDENTE' }, data: { dataAgendada: m.dataAgendada } });
    }
  }
```
- em `registrar` e `executar`: trocar `const revisoes = await this.criarRevisoes(tx, plano.revisoes); return { concluidas, criadas, revisoes };` por:
```ts
        await this.moverPendentes(tx, plano.moverPendentes);
        return { concluidas, criadas };
```

- [ ] **Step 6: Frontend que lia `revisoes`**
- `web/src/lib/endpoints.ts`: em `ConcluirResultado`, remover `revisoes: Agenda[];`.
- `ConcluirPage.tsx`: trocar o bloco `const n = resultado.revisoes.length; toast(n ? ... : ...);` por `toast(\`${marcadas.length > 1 ? \`${marcadas.length} tarefas concluídas\` : 'Tarefa concluída'} 🌿\`);` — se `resultado` ficar sem uso, chamar `await agendasApi.concluir({...})` sem atribuir.
- `RegistrarPage.tsx`: remover `const n = resultado.revisoes.length;` e a linha do `n ?` no array `extras` (fica só a de `k`); se `resultado` ficar sem uso, não atribuir.
- `ProximosPassos.tsx`: substituir o parágrafo `Sem próximos passos, será criada uma Revisão geral em {revisaoDias} dias (...)` por:
```tsx
        {value.length === 0 && revisaoDias > 0 && (
          <p className="text-xs text-muted">A Revisão geral da planta é remarcada automaticamente a cada cuidado.</p>
        )}
```

- [ ] **Step 7: Rodar** — `cd server && npm test && npm run build` e `cd web && npm run build && npm run lint` → tudo limpo.

- [ ] **Step 8: Commit**
```bash
git add server/src/modules/agenda web/src/lib/endpoints.ts web/src/pages/ConcluirPage.tsx web/src/pages/RegistrarPage.tsx web/src/components/care/ProximosPassos.tsx
git commit -m "feat: Revisão geral vira rotina remarcada por qualquer cuidado

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Revisão nas plantas novas + migração das existentes

**Files:**
- Create: `server/src/modules/rotina/repositories/prisma-revisao-inicial.repository.ts`, `server/prisma/migrations/<timestamp>_revisao_como_rotina/migration.sql`
- Modify: `server/src/modules/planta/types/planta.types.ts`, `server/src/modules/planta/use-cases/create-planta.use-case.ts`, `server/src/modules/planta/use-cases/create-planta.use-case.test.ts`, `server/src/modules/planta/planta.controller.ts`

**Interfaces:**
- Produces: `RevisaoInicialRepository { getRevisaoDias(usuarioId: string): Promise<number>; criarRevisao(plantaId: string, intervaloDias: number, primeiraData: Date): Promise<void> }` (em `planta.types.ts`); `CreatePlantaUseCase(plantaRepository, especieRepository, revisaoRepository)`.

- [ ] **Step 1: Testes que falham** — em `create-planta.use-case.test.ts`:
- declarar `let mockRevisao: jest.Mocked<RevisaoInicialRepository>;` (importar o tipo de `../types/planta.types`); no `beforeEach`: `mockRevisao = { getRevisaoDias: jest.fn().mockResolvedValue(30), criarRevisao: jest.fn().mockResolvedValue(undefined) };` e construir `new CreatePlantaUseCase(mockPlantaRepository, mockEspecieRepository, mockRevisao)`;
- adicionar:
```ts
  describe('Revisão geral da planta nova', () => {
    const AGORA = new Date('2026-10-05T12:00:00.000Z');
    beforeEach(() => jest.useFakeTimers().setSystemTime(AGORA));
    afterEach(() => jest.useRealTimers());

    it('cria a rotina de revisão com o intervalo da preferência', async () => {
      mockPlantaRepository.create.mockResolvedValue({ id: 'planta-1' } as PlantaWithEspecie);

      await createPlantaUseCase.execute({ usuarioId: 'user-123' } as CreatePlantaRequestDTO);

      expect(mockRevisao.getRevisaoDias).toHaveBeenCalledWith('user-123');
      expect(mockRevisao.criarRevisao).toHaveBeenCalledWith('planta-1', 30, new Date('2026-11-04T12:00:00.000Z'));
    });

    it('preferência 0 não cria revisão', async () => {
      mockRevisao.getRevisaoDias.mockResolvedValue(0);
      mockPlantaRepository.create.mockResolvedValue({ id: 'planta-1' } as PlantaWithEspecie);

      await createPlantaUseCase.execute({ usuarioId: 'user-123' } as CreatePlantaRequestDTO);

      expect(mockRevisao.criarRevisao).not.toHaveBeenCalled();
    });

    it('falha ao criar a revisão não impede a planta', async () => {
      const erro = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockRevisao.criarRevisao.mockRejectedValue(new Error('db'));
      mockPlantaRepository.create.mockResolvedValue({ id: 'planta-1' } as PlantaWithEspecie);

      await expect(createPlantaUseCase.execute({ usuarioId: 'user-123' } as CreatePlantaRequestDTO)).resolves.toEqual({ id: 'planta-1' });
      expect(erro).toHaveBeenCalled();
      erro.mockRestore();
    });
  });
```
Run: `cd server && npm test -- create-planta` → FAIL.

- [ ] **Step 2: Tipo + use case**

`planta.types.ts`, depois de `EspecieRepository`:
```ts
/** Rotina de Revisão geral criada junto com cada planta nova. */
export interface RevisaoInicialRepository {
  /** Preferência `revisao_automatica_dias` (padrão 30, 0 = desligada). */
  getRevisaoDias(usuarioId: string): Promise<number>;
  criarRevisao(plantaId: string, intervaloDias: number, primeiraData: Date): Promise<void>;
}
```
`create-planta.use-case.ts`: importar `RevisaoInicialRepository`; constructor ganha `private revisaoRepository: RevisaoInicialRepository`; trocar `return await this.plantaRepository.create(createData);` por:
```ts
    const planta = await this.plantaRepository.create(createData);
    await this.criarRevisao(planta.id, data.usuarioId);
    return planta;
  }

  /** Toda planta nova ganha a rotina de Revisão geral; se falhar, a planta continua criada (o usuário cria a rotina depois). */
  private async criarRevisao(plantaId: string, usuarioId: string) {
    try {
      const dias = await this.revisaoRepository.getRevisaoDias(usuarioId);
      if (dias > 0) await this.revisaoRepository.criarRevisao(plantaId, dias, new Date(Date.now() + dias * 86_400_000));
    } catch (error) {
      console.error('Erro ao criar a Revisão geral da planta nova:', error);
    }
```
(o `}` final da classe permanece).

- [ ] **Step 3: Repositório** — `server/src/modules/rotina/repositories/prisma-revisao-inicial.repository.ts`:
```ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { ATIVIDADE_REVISAO, PREF_REVISAO_DIAS } from '../../agenda/agenda.types';
import { RevisaoInicialRepository } from '../../planta/types/planta.types';

const REVISAO_PADRAO_DIAS = 30;

export class PrismaRevisaoInicialRepository implements RevisaoInicialRepository {
  async getRevisaoDias(usuarioId: string) {
    const pref = await prisma.preferenciaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave: PREF_REVISAO_DIAS } },
    });
    const dias = pref ? parseInt(pref.valor, 10) : REVISAO_PADRAO_DIAS;
    if (Number.isNaN(dias)) return REVISAO_PADRAO_DIAS;
    return Math.min(3650, Math.max(0, dias));
  }

  async criarRevisao(plantaId: string, intervaloDias: number, primeiraData: Date) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Garante a atividade mesmo se o seed não tiver rodado no ambiente
      const atividade = await tx.atividade.upsert({
        where: { nome: ATIVIDADE_REVISAO },
        update: {},
        create: { nome: ATIVIDADE_REVISAO, descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
      });
      const rotina = await tx.rotina.create({
        data: { plantaId, atividadeId: atividade.id, intervaloDias, revisao: true },
      });
      await tx.agenda.create({
        data: { plantaId, atividadeId: atividade.id, dataAgendada: primeiraData, rotinaId: rotina.id },
      });
    });
  }
}
```
`planta.controller.ts`: importar `PrismaRevisaoInicialRepository` de `../rotina/repositories/prisma-revisao-inicial.repository` e construir `new CreatePlantaUseCase(plantaRepository, especieRepository, new PrismaRevisaoInicialRepository())`.

- [ ] **Step 4: Migração de dados**

Run (raiz): `docker compose exec api npx prisma migrate dev --create-only --name revisao_como_rotina` (se pedir reset/drift: **BLOCKED**, não resetar). Preencher o `migration.sql` gerado (vazio) com:
```sql
-- Revisão geral vira rotina: uma por planta (intervalo = preferência do dono; padrão 30; 0 = sem rotina)
INSERT INTO "Rotina" ("id", "intervaloDias", "revisao", "plantaId", "atividadeId", "updatedAt")
SELECT gen_random_uuid()::text,
       LEAST(COALESCE(CASE WHEN pref."valor" ~ '^\s*\d+\s*$' THEN trim(pref."valor")::int END, 30), 3650),
       true,
       p."id",
       a."id",
       CURRENT_TIMESTAMP
FROM "Planta" p
JOIN "Atividade" a ON a."nome" = 'Revisão geral'
LEFT JOIN "PreferenciaUsuario" pref ON pref."usuarioId" = p."usuarioId" AND pref."chave" = 'revisao_automatica_dias'
WHERE COALESCE(CASE WHEN pref."valor" ~ '^\s*\d+\s*$' THEN trim(pref."valor")::int END, 30) > 0
ON CONFLICT ("plantaId", "atividadeId") DO UPDATE SET "revisao" = true;

-- Vincula a revisão pendente mais próxima de cada planta à rotina (se a rotina ainda não tem pendente)
UPDATE "Agenda" ag
SET "rotinaId" = r."id"
FROM "Rotina" r
WHERE r."revisao" = true
  AND ag."id" = (
    SELECT x."id" FROM "Agenda" x
    WHERE x."plantaId" = r."plantaId" AND x."atividadeId" = r."atividadeId" AND x."status" = 'PENDENTE'
    ORDER BY x."dataAgendada" ASC
    LIMIT 1
  )
  AND NOT EXISTS (SELECT 1 FROM "Agenda" y WHERE y."rotinaId" = r."id" AND y."status" = 'PENDENTE');
```
Aplicar: `docker compose exec api npx prisma migrate dev` → aplicada sem erros. Conferir: `docker exec bonsai_db psql -U bonsai_user -d <db> -c 'select count(*) from "Rotina" where revisao'` (descobrir o nome do banco com `docker exec bonsai_db sh -c 'echo $POSTGRES_DB'`) → número > 0 se houver plantas.

- [ ] **Step 5: Rodar** — `cd server && npx prisma generate && npm test && npm run build && docker restart bonsai_api` → tudo PASS; API 200 em `/api/docs/`.

- [ ] **Step 6: Commit**
```bash
git add server/src/modules/planta server/src/modules/rotina/repositories/prisma-revisao-inicial.repository.ts server/prisma/migrations
git commit -m "feat(api): Revisão geral como rotina em plantas novas e existentes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Frontend — estações nas rotinas, guia sazonal e Perfil

**Files:**
- Modify: `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/cuidados.ts`, `web/src/components/care/RepetirCampo.tsx`, `web/src/components/care/ScheduleCareSheet.tsx`, `web/src/components/care/RotinaSheet.tsx`, `web/src/pages/PlantDetailPage.tsx`, `web/src/pages/ProfilePages.tsx`

**Interfaces:**
- Consumes: API das Tasks 2–4 (`estacoes` em rotinas e `repetir`; `GET /api/guias-sazonais/especie/:especieId` → `{ especieId, atividadeId, estacao, momentoIdeal: 'DEVE_FAZER'|'PODE_FAZER'|'EVITAR', observacoes }[]`).
- Produces: `Estacao`, `ESTACOES_LISTA`, `textoEstacoes(estacoes)`, `estacoesDoGuia(guias, atividadeId)`; `RepetirValor.estacoes: Estacao[]`; `RepetirCampo` prop `estacoesSugeridas?: Estacao[] | null`; `guiasSazonaisApi.porEspecie`.

- [ ] **Step 1: Tipos e API**

`types.ts`:
```ts
export type Estacao = 'PRIMAVERA' | 'VERAO' | 'OUTONO' | 'INVERNO';
export type MomentoIdeal = 'DEVE_FAZER' | 'PODE_FAZER' | 'EVITAR';
export interface GuiaSazonal {
  especieId: string;
  atividadeId: string;
  estacao: Estacao;
  momentoIdeal: MomentoIdeal;
  observacoes?: string | null;
}
```
(se `Estacao` já existir em `types.ts`, reutilizar) e `Rotina` ganha `estacoes?: Estacao[] | null;`.
`endpoints.ts`: importar `Estacao, GuiaSazonal`; `Repetir` ganha `estacoes?: Estacao[];`; `rotinasApi.create` body ganha `estacoes?: Estacao[];`; `rotinasApi.update` body ganha `estacoes?: Estacao[];`; adicionar:
```ts
export const guiasSazonaisApi = {
  porEspecie: (especieId: string) => data<GuiaSazonal[]>(api.get(`/guias-sazonais/especie/${especieId}`)),
};
```

- [ ] **Step 2: Helpers** (`cuidados.ts`)
```ts
export const ESTACOES_LISTA: { valor: Estacao; nome: string; curto: string }[] = [
  { valor: 'PRIMAVERA', nome: 'Primavera', curto: 'Prim' },
  { valor: 'VERAO', nome: 'Verão', curto: 'Ver' },
  { valor: 'OUTONO', nome: 'Outono', curto: 'Out' },
  { valor: 'INVERNO', nome: 'Inverno', curto: 'Inv' },
];

/** "" para ano todo; senão "Prim/Ver". */
export function textoEstacoes(estacoes?: Estacao[] | null): string {
  if (!estacoes?.length || estacoes.length === 4) return '';
  return ESTACOES_LISTA.filter((e) => estacoes.includes(e.valor)).map((e) => e.curto).join('/');
}

/** Estações sugeridas pelo guia sazonal para a atividade: todas menos as "evitar"; sem guia → null. */
export function estacoesDoGuia(guias: GuiaSazonal[] | undefined, atividadeId: string): Estacao[] | null {
  const daAtividade = (guias ?? []).filter((g) => g.atividadeId === atividadeId);
  if (!daAtividade.length) return null;
  const evitar = new Set(daAtividade.filter((g) => g.momentoIdeal === 'EVITAR').map((g) => g.estacao));
  return ESTACOES_LISTA.map((e) => e.valor).filter((e) => !evitar.has(e));
}
```
(importar `Estacao, GuiaSazonal` de `@/types`).

- [ ] **Step 3: `RepetirCampo`**
- `RepetirValor` ganha `/** Selecionadas; as 4 = ano todo. */ estacoes: Estacao[];`
- `TODAS: Estacao[] = ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO']`; o valor inicial ao tocar em Repetir: `{ intervaloDias: sugestao ?? 14, dataFim: '', estacoes: TODAS }`;
- `repetirValido` exige também `v.estacoes.length >= 1`;
- `repetirParaApi` envia `estacoes: v.estacoes.length === 4 ? [] : v.estacoes`;
- nova prop `estacoesSugeridas?: Estacao[] | null`; dentro do bloco `value && (...)`, depois do "até (opcional)":
```tsx
          <div>
            <span className="text-sm">em quais estações</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {ESTACOES_LISTA.map((e) => {
                const ativa = value.estacoes.includes(e.valor);
                return (
                  <button
                    type="button"
                    key={e.valor}
                    className={`chip py-1.5 text-xs ${ativa ? 'chip-active' : ''}`}
                    aria-pressed={ativa}
                    onClick={() =>
                      onChange({ ...value, estacoes: ativa ? value.estacoes.filter((x) => x !== e.valor) : [...value.estacoes, e.valor] })
                    }
                  >
                    {e.nome}
                  </button>
                );
              })}
            </div>
            {!!estacoesSugeridas && textoEstacoes(estacoesSugeridas) !== textoEstacoes(value.estacoes) && (
              <button type="button" className="mt-1 text-xs font-medium text-primary" onClick={() => onChange({ ...value, estacoes: estacoesSugeridas })}>
                Guia da espécie: {textoEstacoes(estacoesSugeridas) || 'ano todo'} — usar
              </button>
            )}
          </div>
```
(importar `ESTACOES_LISTA, textoEstacoes` de `@/lib/cuidados` e o tipo `Estacao`). Na primeira vez que o usuário toca em "Repetir", se houver `estacoesSugeridas`, usar elas no valor inicial: `estacoes: estacoesSugeridas ?? TODAS`.

- [ ] **Step 4: `ScheduleCareSheet`** — sugestão do guia quando há 1 planta e 1 atividade:
```tsx
  const plantas = usePlantas();
  const especieId = plantaIds.length === 1 ? plantas.data?.find((p) => p.id === plantaIds[0])?.especieId : undefined;
  const guias = useQuery({
    queryKey: ['guias-sazonais', especieId],
    queryFn: () => guiasSazonaisApi.porEspecie(especieId!),
    enabled: !!especieId,
    staleTime: 5 * 60_000,
  });
  const estacoesSugeridas = atividadeIds.length === 1 && especieId ? estacoesDoGuia(guias.data, atividadeIds[0]) : null;
```
(imports: `useQuery` de `@tanstack/react-query`, `usePlantas` de `@/lib/queries`, `guiasSazonaisApi`, `estacoesDoGuia`) e passar `estacoesSugeridas={estacoesSugeridas}` ao `<RepetirCampo>`.

- [ ] **Step 5: `RotinaSheet` e seção Rotinas**
- `RotinaSheet`/`RotinaForm`: estado `const [estacoes, setEstacoes] = useState<Estacao[]>(rotina.estacoes?.length ? rotina.estacoes : ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO']);`; chips das 4 estações (mesmo markup do Step 3) entre "Até (opcional)" e "Salvar"; em `salvar`, se `estacoes.length === 0` → `toast('Escolha ao menos uma estação.', 'error')`; enviar `estacoes: estacoes.length === 4 ? [] : estacoes` no `rotinasApi.update`; na linha de resumo, depois de `textoIntervalo(...)`, acrescentar `{textoEstacoes(rotina.estacoes) && \` · ${textoEstacoes(rotina.estacoes)}\`}`.
- `PlantDetailPage` (seção Rotinas): no texto da direita, depois de `textoIntervalo(r.intervaloDias)`, acrescentar `{textoEstacoes(r.estacoes) && \` · ${textoEstacoes(r.estacoes)}\`}`.

- [ ] **Step 6: Perfil** — em `ProfilePages.tsx` (`RevisaoAutomatica`): JSDoc → `/** Intervalo da rotina de Revisão geral criada em cada planta nova. */`; `label="Revisão geral das plantas novas"`; `hint="Cada planta nova ganha uma rotina de Revisão geral com este intervalo, remarcada a cada cuidado. Para mudar numa planta, use a seção Rotinas dela."`.

- [ ] **Step 7: Build + lint** — `cd web && npm run build && npm run lint` → sem erros/warnings novos.

- [ ] **Step 8: Commit**
```bash
git add web/src
git commit -m "feat(web): estações nas rotinas, sugestão do guia sazonal e texto da revisão

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Verificação no navegador + docs

- [ ] **Step 1:** `docker restart bonsai_api`; navegador em `localhost:5173` (conta local, iframe 390px).
- [ ] **Step 2: Cenários** (dados via API, ids anotados):
  1. Criar planta nova → seção Rotinas mostra "Revisão geral · a cada 30 dias · <data>" e existe pendente de revisão.
  2. Registrar Rega na planta → a revisão pendente passa para hoje + 30.
  3. Concluir a revisão → nova revisão em hoje + 30 (uma só pendente).
  4. Planta com espécie que tem guia sazonal de Adubação com "Evitar" no inverno: Agendar → Adubação → Repetir → chips já sem Inverno (ou link "Guia da espécie: … — usar").
  5. Rotina só Primavera/Verão concluída em data cuja próxima cairia no outono → próxima vai para 22/09 (testar via API com `dataConcluida` adequada ou conferindo o cálculo nos testes).
  6. Perfil mostra o novo texto.
- [ ] **Step 3:** limpar dados de teste.
- [ ] **Step 4: Docs** — spec: abaixo das notas das fases 1–2, `> **Fase 3 (implementada):** estações por datas fixas (hemisfério sul) em \`dominio/estacoes.ts\`; Revisão geral = rotina \`revisao=true\` remarcada por qualquer cuidado (\`remarcarRevisoes\`); plantas novas recebem a rotina no \`CreatePlantaUseCase\`; migração \`revisao_como_rotina\` cria as das plantas existentes (sem criar pendente nova).` `CLAUDE.md`: trocar "conclusão em lote + Revisão geral automática, preferência `revisao_automatica_dias`" por "conclusão em lote; Revisão geral é rotina por planta (`revisao=true`) remarcada por qualquer cuidado; preferência `revisao_automatica_dias` = intervalo em plantas novas".
- [ ] **Step 5: Commit**
```bash
git add CLAUDE.md docs/superpowers/specs/2026-10-05-tarefas-inteligentes-design.md
git commit -m "docs: fase 3 das tarefas inteligentes (estações e revisão como rotina)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
