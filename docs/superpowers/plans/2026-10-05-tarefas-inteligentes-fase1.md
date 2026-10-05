# Tarefas inteligentes — Fase 1 (reconciliação + "última vez") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao registrar um cuidado, oferecer (pré-marcadas) as tarefas pendentes compatíveis para serem concluídas pelo registro, e mostrar "última vez há X dias" no registrar, no agendar e na página da planta.

**Architecture:** O backend ganha `concluirAgendaIds[]` em `POST /api/agendas/registrar`: uma função pura `reconciliar` casa as pendentes com os cuidados (a mais antiga de cada planta+atividade "absorve" o registro, as repetidas são canceladas) e o repositório atualiza essas agendas em vez de criar novas. No frontend, candidatas e "última vez" são calculadas no cliente a partir de `GET /api/agendas` (que já traz todo o histórico e já está em cache via `useAgendas`) — sem endpoints de leitura novos nesta fase.

**Tech Stack:** Express + Zod + Prisma + Jest (server/), React 19 + TanStack Query + Tailwind v4 (web/).

**Spec:** `docs/superpowers/specs/2026-10-05-tarefas-inteligentes-design.md` (seções "Regras de domínio" item 8, "Interface", "Fases de entrega" fase 1)

## Global Constraints

- Idioma de código, comentários, UI e commits: **português**.
- Janela da reconciliação: pendentes **atrasadas (qualquer idade) + vencendo em até 90 dias**.
- Textos de prazo: "agendada daqui 12 dias", "agendada para hoje", "atrasada há 5 dias".
- Reconciliação é **perguntada**: lista todas as candidatas, todas pré-marcadas; desmarcar mantém a tarefa pendente.
- Backend: Clean Architecture do projeto (controller → schema → use case → repository); regras só em use cases / funções puras; testes AAA com repositório mockado.
- Frontend: `web/` não tem test runner; verificação via `npm run build`, `npm run lint` e navegador (conta local `teste.web@bonsai.test` em localhost:5173).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; branch `develop`.

## Desvio do spec (registrado)

O spec previa `GET /agendas/candidatas` e `GET /agendas/ultimas`. Como `GET /agendas` já devolve o histórico completo do usuário e o app já o mantém em cache, a fase 1 calcula ambos no cliente (`web/src/lib/cuidados.ts`). Endpoints dedicados ficam para quando o volume justificar. O spec é atualizado na Task 6.

## Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `server/src/modules/agenda/dominio/reconciliar.ts` | Criar | Função pura: pendentes escolhidas → `absorver` / `cancelar` |
| `server/src/modules/agenda/dominio/reconciliar.test.ts` | Criar | Testes da função |
| `server/src/modules/agenda/agenda.types.ts` | Modificar | DTO, `PlanoRegistro`, método novo do `ConclusaoRepository` |
| `server/src/modules/agenda/agenda.schema.ts` | Modificar | `concluirAgendaIds` no schema do registrar |
| `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.ts` | Modificar | Valida e reconcilia |
| `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.test.ts` | Modificar | Casos novos |
| `server/src/modules/agenda/use-cases/concluir-agendas.use-case.test.ts` | Modificar | Mock ganha o método novo |
| `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts` | Modificar | Busca pendentes + absorver/cancelar na transação |
| `server/src/modules/agenda/agenda.controller.ts` | Modificar | Mapear erros novos para 404/400 |
| `web/src/lib/cuidados.ts` | Criar | `ultimasPorPlanta`, `rotuloUltima`, `textoPrazo`, `candidatasReconciliacao` |
| `web/src/lib/endpoints.ts` | Modificar | `RegistrarInput.concluirAgendaIds` |
| `web/src/components/care/AtividadeChips.tsx` | Modificar | Prop `dica` |
| `web/src/components/care/ScheduleCareSheet.tsx` | Modificar | "há X dias" nos chips |
| `web/src/pages/PlantDetailPage.tsx` | Modificar | Seção "Últimos cuidados" |
| `web/src/pages/RegistrarPage.tsx` | Modificar | "há X dias" + bloco "Tarefas que serão concluídas" |

---

### Task 1: Função pura `reconciliar`

**Files:**
- Create: `server/src/modules/agenda/dominio/reconciliar.ts`
- Test: `server/src/modules/agenda/dominio/reconciliar.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface PendenteReconciliavel { id: string; plantaId: string; atividadeId: string; dataAgendada: Date }
  export interface Reconciliacao {
    absorver: { agendaId: string; plantaId: string; atividadeId: string }[];
    cancelar: string[];
  }
  export function reconciliar(
    cuidados: { plantaId: string; atividadeIds: string[] }[],
    pendentes: PendenteReconciliavel[],
  ): Reconciliacao; // lança 'Tarefa não corresponde ao cuidado registrado.'
  ```

- [ ] **Step 1: Escrever o teste que falha**

`server/src/modules/agenda/dominio/reconciliar.test.ts`:
```ts
import { reconciliar } from './reconciliar';

const pendente = (id: string, plantaId: string, atividadeId: string, data: string) => ({
  id,
  plantaId,
  atividadeId,
  dataAgendada: new Date(data),
});

describe('reconciliar', () => {
  const cuidados = [
    { plantaId: 'p1', atividadeIds: ['adubo', 'poda'] },
    { plantaId: 'p2', atividadeIds: ['adubo'] },
  ];

  it('sem pendentes, não absorve nem cancela nada', () => {
    expect(reconciliar(cuidados, [])).toEqual({ absorver: [], cancelar: [] });
  });

  it('cada pendente compatível é absorvida pelo cuidado da sua planta', () => {
    const r = reconciliar(cuidados, [
      pendente('a1', 'p1', 'adubo', '2026-10-10T12:00:00.000Z'),
      pendente('a2', 'p2', 'adubo', '2026-10-01T12:00:00.000Z'),
      pendente('a3', 'p1', 'poda', '2026-12-01T12:00:00.000Z'),
    ]);

    expect(r.absorver).toEqual([
      { agendaId: 'a2', plantaId: 'p2', atividadeId: 'adubo' },
      { agendaId: 'a1', plantaId: 'p1', atividadeId: 'adubo' },
      { agendaId: 'a3', plantaId: 'p1', atividadeId: 'poda' },
    ]);
    expect(r.cancelar).toEqual([]);
  });

  it('com duas pendentes do mesmo cuidado na mesma planta, absorve a mais antiga e cancela a outra', () => {
    const r = reconciliar(cuidados, [
      pendente('tarde', 'p1', 'adubo', '2026-11-01T12:00:00.000Z'),
      pendente('cedo', 'p1', 'adubo', '2026-10-01T12:00:00.000Z'),
    ]);

    expect(r.absorver).toEqual([{ agendaId: 'cedo', plantaId: 'p1', atividadeId: 'adubo' }]);
    expect(r.cancelar).toEqual(['tarde']);
  });

  it('lança erro quando a pendente é de um cuidado não registrado na planta', () => {
    expect(() => reconciliar(cuidados, [pendente('a1', 'p2', 'poda', '2026-10-10T12:00:00.000Z')])).toThrow(
      'Tarefa não corresponde ao cuidado registrado.',
    );
  });

  it('lança erro quando a pendente é de uma planta fora do registro', () => {
    expect(() => reconciliar(cuidados, [pendente('a1', 'p9', 'adubo', '2026-10-10T12:00:00.000Z')])).toThrow(
      'Tarefa não corresponde ao cuidado registrado.',
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npm test -- reconciliar`
Expected: FAIL — `Cannot find module './reconciliar'`

- [ ] **Step 3: Implementar**

`server/src/modules/agenda/dominio/reconciliar.ts`:
```ts
export interface PendenteReconciliavel {
  id: string;
  plantaId: string;
  atividadeId: string;
  dataAgendada: Date;
}

export interface Reconciliacao {
  /** Pendentes que viram o registro do cuidado (em vez de criar agenda nova). */
  absorver: { agendaId: string; plantaId: string; atividadeId: string }[];
  /** Pendentes repetidas do mesmo cuidado na mesma planta: já foram feitas pelo registro. */
  cancelar: string[];
}

/** Casa as pendentes escolhidas com os cuidados registrados: a mais antiga de cada (planta, atividade) absorve o registro. */
export function reconciliar(
  cuidados: { plantaId: string; atividadeIds: string[] }[],
  pendentes: PendenteReconciliavel[],
): Reconciliacao {
  const feitos = new Set(cuidados.flatMap((c) => c.atividadeIds.map((a) => `${c.plantaId}|${a}`)));
  const usados = new Set<string>();
  const r: Reconciliacao = { absorver: [], cancelar: [] };

  for (const p of [...pendentes].sort((a, b) => a.dataAgendada.getTime() - b.dataAgendada.getTime())) {
    const par = `${p.plantaId}|${p.atividadeId}`;
    if (!feitos.has(par)) throw new Error('Tarefa não corresponde ao cuidado registrado.');
    if (usados.has(par)) {
      r.cancelar.push(p.id);
    } else {
      usados.add(par);
      r.absorver.push({ agendaId: p.id, plantaId: p.plantaId, atividadeId: p.atividadeId });
    }
  }
  return r;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd server && npm test -- reconciliar`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/agenda/dominio
git commit -m "feat(api): função pura para reconciliar pendentes com cuidados registrados

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `POST /agendas/registrar` aceita `concluirAgendaIds`

**Files:**
- Modify: `server/src/modules/agenda/agenda.types.ts`
- Modify: `server/src/modules/agenda/agenda.schema.ts` (schema `registrarCuidadosSchema`)
- Modify: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.ts`
- Modify: `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts`
- Modify: `server/src/modules/agenda/agenda.controller.ts` (método `registrar`)
- Test: `server/src/modules/agenda/use-cases/registrar-cuidados.use-case.test.ts`
- Test: `server/src/modules/agenda/use-cases/concluir-agendas.use-case.test.ts` (só o mock)

**Interfaces:**
- Consumes: `reconciliar`, `PendenteReconciliavel` (Task 1)
- Produces:
  - `RegistrarCuidadosDTO.concluirAgendaIds?: string[]`
  - `PlanoRegistro.absorver: { agendaId; plantaId; atividadeId }[]`, `PlanoRegistro.cancelar: string[]`
  - `ConclusaoRepository.findPendentesParaReconciliar(ids: string[], usuarioId: string): Promise<PendenteReconciliavel[]>`
  - Body da API: `concluirAgendaIds?: string[]` (uuid, máx. 400)
  - Erros: `'Acesso negado ou agendamento não encontrado.'` → 404; `'Tarefa não corresponde ao cuidado registrado.'` → 400

- [ ] **Step 1: Escrever os testes que falham**

Em `registrar-cuidados.use-case.test.ts`, no objeto `repo` do `beforeEach`, adicionar:
```ts
      findPendentesParaReconciliar: jest.fn().mockResolvedValue([]),
```
Em `concluir-agendas.use-case.test.ts`, no objeto `repo` do `beforeEach`, adicionar:
```ts
      findPendentesParaReconciliar: jest.fn(),
```
No fim do `describe` de `registrar-cuidados.use-case.test.ts`, adicionar:
```ts
  describe('concluir tarefas pendentes pelo registro', () => {
    const pendente = { id: 'ag-1', plantaId: 'p1', atividadeId: 'at-1', dataAgendada: new Date('2026-10-20T12:00:00.000Z') };

    it('sem tarefas escolhidas, não busca pendentes', async () => {
      await useCase.execute(base, 'user-1');

      expect(repo.findPendentesParaReconciliar).not.toHaveBeenCalled();
      expect(plano().absorver).toEqual([]);
      expect(plano().cancelar).toEqual([]);
    });

    it('a tarefa escolhida é absorvida pelo registro e não conta como próxima pendente', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([pendente]);

      await useCase.execute({ ...base, concluirAgendaIds: ['ag-1', 'ag-1'] }, 'user-1');

      expect(repo.findPendentesParaReconciliar).toHaveBeenCalledWith(['ag-1'], 'user-1');
      expect(plano().absorver).toEqual([{ agendaId: 'ag-1', plantaId: 'p1', atividadeId: 'at-1' }]);
      expect(plano().cancelar).toEqual([]);
      expect(repo.proximasPendentes).toHaveBeenCalledWith(['p1'], AGORA, ['ag-1']);
    });

    it('lança erro quando a tarefa não é do usuário ou não está mais pendente', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([]);

      await expect(useCase.execute({ ...base, concluirAgendaIds: ['ag-1'] }, 'user-1')).rejects.toThrow(
        'Acesso negado ou agendamento não encontrado.',
      );
      expect(repo.registrar).not.toHaveBeenCalled();
    });

    it('lança erro quando a tarefa é de outro cuidado', async () => {
      repo.findPendentesParaReconciliar.mockResolvedValue([{ ...pendente, atividadeId: 'at-2' }]);

      await expect(useCase.execute({ ...base, concluirAgendaIds: ['ag-1'] }, 'user-1')).rejects.toThrow(
        'Tarefa não corresponde ao cuidado registrado.',
      );
      expect(repo.registrar).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npm test -- registrar-cuidados`
Expected: FAIL — erro de tipo (`findPendentesParaReconciliar` não existe em `ConclusaoRepository` / `concluirAgendaIds` não existe no DTO)

- [ ] **Step 3: Tipos**

Em `agenda.types.ts`:
- no topo, adicionar `import { PendenteReconciliavel } from './dominio/reconciliar';`
- em `RegistrarCuidadosDTO`, depois de `proximos?`, adicionar:
  ```ts
  /** Pendentes que este registro conclui (escolhidas na tela). */
  concluirAgendaIds?: string[];
  ```
- em `PlanoRegistro`, depois de `cuidados`, adicionar:
  ```ts
  /** Pendentes que viram o registro do cuidado (em vez de criar agenda nova). */
  absorver: { agendaId: string; plantaId: string; atividadeId: string }[];
  /** Pendentes repetidas do mesmo cuidado: canceladas. */
  cancelar: string[];
  ```
- em `ConclusaoRepository`, depois de `findPendentesDoUsuario`, adicionar:
  ```ts
  /** Agendas PENDENTE do usuário dentre os ids, com planta, atividade e data. */
  findPendentesParaReconciliar(ids: string[], usuarioId: string): Promise<PendenteReconciliavel[]>;
  ```

- [ ] **Step 4: Use case**

Substituir `registrar-cuidados.use-case.ts` inteiro por:
```ts
import { ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';
import { reconciliar } from '../dominio/reconciliar';
import { planejarSeguimento } from './planejar-seguimento';

/** Folga para o fuso do aparelho: registra o que já foi feito, não o futuro. */
const FOLGA_FUTURO_MS = 86_400_000;

/** Registra cuidados já feitos (com fotos) em várias plantas, conclui as pendentes escolhidas e agenda o que vem depois. */
export class RegistrarCuidadosUseCase {
  constructor(private repo: ConclusaoRepository) {}

  async execute(dto: RegistrarCuidadosDTO, usuarioId: string) {
    const plantas = dto.plantas.map((p) => p.plantaId);
    if (new Set(plantas).size !== plantas.length) throw new Error('Plantas repetidas na lista.');
    if (dto.plantas.some((p) => !p.atividadeIds.length)) throw new Error('Informe ao menos um cuidado por planta.');
    if (new Date(dto.data).getTime() > Date.now() + FOLGA_FUTURO_MS) throw new Error('A data não pode ser no futuro.');

    if ((await this.repo.contarPlantasDoUsuario(plantas, usuarioId)) !== plantas.length) {
      throw new Error('Acesso negado. A planta não pertence a si.');
    }

    const proximos = dto.proximos ?? [];
    const atividadeIds = [...new Set([...dto.plantas.flatMap((p) => p.atividadeIds), ...proximos.map((p) => p.atividadeId)])];
    if (!(await this.repo.atividadesExistem(atividadeIds))) throw new Error('Atividade não encontrada.');

    const data = new Date(dto.data);
    const cuidados = dto.plantas.map((p) => ({
      plantaId: p.plantaId,
      atividadeIds: [...new Set(p.atividadeIds)],
      detalhes: p.detalhes,
      observacaoFutura: p.observacaoFutura,
      fotos: (p.fotos ?? []).map((f) => ({
        caminhoArquivo: f.caminhoArquivo,
        dataCaptura: f.dataCaptura ? new Date(f.dataCaptura) : data,
      })),
    }));

    const concluirIds = [...new Set(dto.concluirAgendaIds ?? [])];
    const pendentes = concluirIds.length ? await this.repo.findPendentesParaReconciliar(concluirIds, usuarioId) : [];
    if (pendentes.length !== concluirIds.length) throw new Error('Acesso negado ou agendamento não encontrado.');
    const { absorver, cancelar } = reconciliar(cuidados, pendentes);

    // As pendentes concluídas aqui não podem "segurar" a Revisão geral
    const seguimento = await planejarSeguimento(this.repo, { usuarioId, plantas, proximos, excluir: concluirIds });

    return this.repo.registrar({ usuarioId, data, cuidados, absorver, cancelar, ...seguimento });
  }
}
```

- [ ] **Step 5: Rodar os testes do use case**

Run: `cd server && npm test -- registrar-cuidados concluir-agendas`
Expected: PASS (todos, incluindo os 4 novos)

- [ ] **Step 6: Schema**

Em `agenda.schema.ts`, no `registrarCuidadosSchema`, depois de `proximos: ...optional(),` adicionar:
```ts
    concluirAgendaIds: z
      .array(z.string().uuid({ message: 'ID de tarefa inválido.' }))
      .max(400, { message: 'Máximo de 400 tarefas por vez.' })
      .optional(),
```

- [ ] **Step 7: Repositório**

Em `prisma-conclusao.repository.ts`:

a) Depois de `findPendentesDoUsuario`, adicionar:
```ts
  async findPendentesParaReconciliar(ids: string[], usuarioId: string) {
    return prisma.agenda.findMany({
      where: { id: { in: ids }, status: 'PENDENTE', planta: { usuarioId } },
      select: { id: true, plantaId: true, atividadeId: true, dataAgendada: true },
    });
  }
```

b) Em `registrar`, substituir o bloco que cria `concluidas` (do comentário `// Poucas idas ao banco...` até o `});` do `createManyAndReturn`) por:
```ts
        // Poucas idas ao banco, independente do número de plantas (lotes grandes estouravam o tempo)
        const absorvidos = new Set(plano.absorver.map((a) => `${a.plantaId}|${a.atividadeId}`));
        const novas = plano.cuidados.flatMap((c) =>
          c.atividadeIds.flatMap((atividadeId, i) =>
            absorvidos.has(`${c.plantaId}|${atividadeId}`)
              ? []
              : [
                  {
                    plantaId: c.plantaId,
                    atividadeId,
                    dataAgendada: plano.data,
                    dataConcluida: plano.data,
                    status: 'CONCLUIDO' as const,
                    // Nota e obs. só no primeiro cuidado: no histórico os cuidados do dia aparecem juntos
                    ...(i === 0 ? { detalhes: c.detalhes, observacaoFutura: c.observacaoFutura } : {}),
                  },
                ],
          ),
        );
        const criadasAgora = novas.length ? await tx.agenda.createManyAndReturn({ data: novas }) : [];

        // Pendentes escolhidas na tela viram o registro; revalida PENDENTE (envio duplo não conclui duas vezes)
        const cuidadoDe = new Map(plano.cuidados.map((c) => [c.plantaId, c]));
        for (const a of plano.absorver) {
          const c = cuidadoDe.get(a.plantaId)!;
          const primeiro = c.atividadeIds[0] === a.atividadeId;
          const { count } = await tx.agenda.updateMany({
            where: { id: a.agendaId, status: 'PENDENTE' },
            data: {
              status: 'CONCLUIDO',
              dataConcluida: plano.data,
              // Sem nota no registro, mantém a instrução que veio do agendamento
              ...(primeiro && c.detalhes !== undefined ? { detalhes: c.detalhes } : {}),
              ...(primeiro && c.observacaoFutura !== undefined ? { observacaoFutura: c.observacaoFutura } : {}),
            },
          });
          if (count === 0) throw new Error('Acesso negado ou agendamento não encontrado.');
        }
        if (plano.cancelar.length) {
          await tx.agenda.updateMany({
            where: { id: { in: plano.cancelar }, status: 'PENDENTE' },
            data: { status: 'CANCELADO' },
          });
        }
        const absorvidas = plano.absorver.length
          ? await tx.agenda.findMany({ where: { id: { in: plano.absorver.map((a) => a.agendaId) } } })
          : [];
        const concluidas = [...criadasAgora, ...absorvidas];
```
O restante (`comFotos`, `agendaDe` construído a partir de `concluidas`, `criadas`, `revisoes`) fica igual — as fotos passam a ir para a agenda absorvida quando o primeiro cuidado da planta foi reconciliado.

- [ ] **Step 8: Controller**

Em `agenda.controller.ts`, método `registrar`, logo depois do `if` que trata `'Acesso negado. A planta não pertence a si.'`, adicionar:
```ts
      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
```
e incluir `'Tarefa não corresponde ao cuidado registrado.',` na lista de mensagens que respondem 400.

- [ ] **Step 9: Suite completa + build**

Run: `cd server && npm test && npm run build`
Expected: todos os testes PASS; build sem erros de tipo.

- [ ] **Step 10: Commit**

```bash
git add server/src/modules/agenda
git commit -m "feat(api): registrar cuidados conclui as tarefas pendentes escolhidas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Helpers do cliente (`web/src/lib/cuidados.ts`) + endpoint

**Files:**
- Create: `web/src/lib/cuidados.ts`
- Modify: `web/src/lib/endpoints.ts` (`RegistrarInput`)

**Interfaces:**
- Consumes: `diasAte` de `web/src/lib/format.ts`; tipo `Agenda` de `@/types`
- Produces:
  ```ts
  export const JANELA_RECONCILIACAO_DIAS = 90;
  export function ultimasPorPlanta(agendas: Agenda[]): Map<string, Map<string, string>>; // plantaId → atividadeId → ISO
  export function rotuloUltima(datas: (string | undefined)[]): string;
  export function textoPrazo(iso: string): string;
  export function candidatasReconciliacao(agendas: Agenda[], cuidados: { plantaId: string; atividadeIds: string[] }[]): Agenda[];
  ```
  e `RegistrarInput.concluirAgendaIds?: string[]`.

- [ ] **Step 1: Criar `web/src/lib/cuidados.ts`**

```ts
import type { Agenda } from '@/types';
import { diasAte } from './format';

/** Reconciliação: pendentes atrasadas (qualquer idade) ou que vencem em até 90 dias. */
export const JANELA_RECONCILIACAO_DIAS = 90;

/** Por planta → atividade, a data (ISO) da última vez que o cuidado foi feito. */
export function ultimasPorPlanta(agendas: Agenda[]): Map<string, Map<string, string>> {
  const mapa = new Map<string, Map<string, string>>();
  for (const a of agendas) {
    if (a.status !== 'CONCLUIDO') continue;
    const data = a.dataConcluida ?? a.dataAgendada;
    const daPlanta = mapa.get(a.plantaId) ?? new Map<string, string>();
    const atual = daPlanta.get(a.atividadeId);
    if (!atual || data > atual) daPlanta.set(a.atividadeId, data);
    mapa.set(a.plantaId, daPlanta);
  }
  return mapa;
}

const tempo = (dias: number) => (dias < 60 ? `${dias} dias` : `${Math.round(dias / 30)} meses`);
const haQuanto = (dias: number) => (dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${tempo(dias)}`);

/** Última vez numa ou em várias plantas: "hoje", "há 12 dias", "há 5 dias – há 2 meses", "nunca", "… · algumas nunca". */
export function rotuloUltima(datas: (string | undefined)[]): string {
  const dias = datas.filter((d): d is string => !!d).map((d) => Math.max(0, -diasAte(d)));
  if (!dias.length) return 'nunca';
  const min = Math.min(...dias);
  const max = Math.max(...dias);
  const base = min === max ? haQuanto(min) : `${haQuanto(min)} – ${haQuanto(max)}`;
  return dias.length < datas.length ? `${base} · algumas nunca` : base;
}

/** "atrasada há 4 dias", "agendada para hoje", "agendada daqui 12 dias". */
export function textoPrazo(iso: string): string {
  const d = diasAte(iso);
  if (d < 0) return `atrasada há ${-d} dia${d === -1 ? '' : 's'}`;
  if (d === 0) return 'agendada para hoje';
  return `agendada daqui ${d} dia${d === 1 ? '' : 's'}`;
}

/** Pendentes que um registro pode concluir: mesma planta e atividade, dentro da janela; mais antigas primeiro. */
export function candidatasReconciliacao(
  agendas: Agenda[],
  cuidados: { plantaId: string; atividadeIds: string[] }[],
): Agenda[] {
  const pares = new Set(cuidados.flatMap((c) => c.atividadeIds.map((a) => `${c.plantaId}|${a}`)));
  return agendas
    .filter(
      (a) =>
        a.status === 'PENDENTE' &&
        pares.has(`${a.plantaId}|${a.atividadeId}`) &&
        diasAte(a.dataAgendada) <= JANELA_RECONCILIACAO_DIAS,
    )
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));
}
```

- [ ] **Step 2: Endpoint**

Em `web/src/lib/endpoints.ts`, em `RegistrarInput`, depois de `proximos?`, adicionar:
```ts
  /** Pendentes que este registro conclui (escolhidas na tela). */
  concluirAgendaIds?: string[];
```

- [ ] **Step 3: Verificar tipos**

Run: `cd web && npx tsc -b`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/cuidados.ts web/src/lib/endpoints.ts
git commit -m "feat(web): helpers de última vez e candidatas à reconciliação

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: "Última vez" no Agendar e na página da planta

**Files:**
- Modify: `web/src/components/care/AtividadeChips.tsx`
- Modify: `web/src/components/care/ScheduleCareSheet.tsx`
- Modify: `web/src/pages/PlantDetailPage.tsx`

**Interfaces:**
- Consumes: `ultimasPorPlanta`, `rotuloUltima` (Task 3); `useAgendas` de `@/lib/queries`
- Produces: `AtividadeChips` aceita `dica?: (atividadeId: string) => string | undefined` (usada também na Task 5)

- [ ] **Step 1: Prop `dica` no `AtividadeChips`**

Na assinatura, adicionar `dica` aos props desestruturados e ao tipo:
```tsx
export function AtividadeChips({
  value,
  onChange,
  label = 'Tipos de cuidado',
  dica,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  /** Texto curto ao lado do nome (ex.: "há 12 dias"). */
  dica?: (atividadeId: string) => string | undefined;
}) {
```
e trocar `{a.nome}` dentro do botão por:
```tsx
              {a.nome}
              {dica?.(a.id) && <span className="ml-1 text-[11px] font-normal opacity-70">· {dica(a.id)}</span>}
```

- [ ] **Step 2: `ScheduleCareSheet`**

- Imports: trocar `import { keys } from '@/lib/queries';` por `import { keys, useAgendas } from '@/lib/queries';` e adicionar `import { rotuloUltima, ultimasPorPlanta } from '@/lib/cuidados';`.
- Depois de `const atalhos = useMemo(...)`, adicionar:
  ```tsx
  const agendas = useAgendas();
  const ultimas = useMemo(() => ultimasPorPlanta(agendas.data ?? []), [agendas.data]);
  const dica = plantaIds.length
    ? (atividadeId: string) => rotuloUltima(plantaIds.map((p) => ultimas.get(p)?.get(atividadeId)))
    : undefined;
  ```
- Trocar `<AtividadeChips value={atividadeIds} onChange={setAtividadeIds} />` por `<AtividadeChips value={atividadeIds} onChange={setAtividadeIds} dica={dica} />`.

- [ ] **Step 3: Seção "Últimos cuidados" no `PlantDetailPage`**

- Adicionar import `import { rotuloUltima, ultimasPorPlanta } from '@/lib/cuidados';`.
- Depois de `const linha = useMemo(...)`, adicionar:
  ```tsx
  const ultimos = useMemo(() => {
    const nomes = new Map(daPlanta.map((a) => [a.atividadeId, a.atividade?.nome ?? 'Cuidado']));
    return [...(ultimasPorPlanta(daPlanta).get(id) ?? [])]
      .map(([atividadeId, data]) => ({ atividadeId, data, nome: nomes.get(atividadeId) ?? 'Cuidado' }))
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [daPlanta, id]);
  ```
- Logo depois do `</Secao>` de "Histórico e cuidados", adicionar:
  ```tsx
        {ultimos.length > 0 && (
          <Secao titulo="Últimos cuidados">
            <div className="card divide-y divide-line">
              {ultimos.map((u) => (
                <div key={u.atividadeId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="font-medium">{u.nome}</span>
                  <span className="text-muted">{rotuloUltima([u.data])}</span>
                </div>
              ))}
            </div>
          </Secao>
        )}
  ```

- [ ] **Step 4: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros

- [ ] **Step 5: Commit**

```bash
git add web/src/components/care web/src/pages/PlantDetailPage.tsx
git commit -m "feat(web): última vez de cada cuidado no agendar e na página da planta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Registrar — "última vez" e "Tarefas que serão concluídas"

**Files:**
- Modify: `web/src/pages/RegistrarPage.tsx`

**Interfaces:**
- Consumes: `AtividadeChips.dica` (Task 4); `ultimasPorPlanta`, `rotuloUltima`, `textoPrazo`, `candidatasReconciliacao` (Task 3); `RegistrarInput.concluirAgendaIds` (Task 3); `concluirAgendaIds` na API (Task 2)

- [ ] **Step 1: Imports**

- `import { useEffect, useRef, useState } from 'react';` → `import { useEffect, useMemo, useRef, useState } from 'react';`
- `import { fromDateInput, plantaTitulo, toDateInput } from '@/lib/format';` → `import { diasAte, fromDateInput, plantaRotulo, plantaTitulo, toDateInput } from '@/lib/format';`
- `import { keys, usePlantas } from '@/lib/queries';` → `import { keys, useAgendas, usePlantas } from '@/lib/queries';`
- adicionar `import { candidatasReconciliacao, rotuloUltima, textoPrazo, ultimasPorPlanta } from '@/lib/cuidados';`

- [ ] **Step 2: Estado e derivados**

- Depois de `const lote = useLoteFotos(plantas.data);` adicionar `const agendas = useAgendas();`.
- Depois de `const [proximos, setProximos] = useState<Proximo[]>([]);` adicionar:
  ```tsx
  /** Candidatas que o usuário desmarcou (as demais são concluídas pelo registro). */
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);
  const ultimas = useMemo(() => ultimasPorPlanta(agendas.data ?? []), [agendas.data]);
  ```
- Depois de `const tiposDe = (pid: string) => ajuste(pid).atividadeIds ?? atividadeIds;` adicionar:
  ```tsx
  // Plantas novas (criadas só ao salvar) não têm histórico nem tarefas
  const reais = tocadas.filter((pid) => !ehNova(pid));
  const dicaPara = (pids: string[]) =>
    pids.length ? (aid: string) => rotuloUltima(pids.map((p) => ultimas.get(p)?.get(aid))) : undefined;
  const candidatas = candidatasReconciliacao(
    agendas.data ?? [],
    reais.map((pid) => ({ plantaId: pid, atividadeIds: tiposDe(pid) })),
  );
  const concluirAgendaIds = candidatas.filter((a) => !desmarcadas.includes(a.id)).map((a) => a.id);
  ```

- [ ] **Step 3: Enviar e avisar**

No `agendasApi.registrar({...})`, depois de `proximos: ...`, adicionar:
```tsx
          concluirAgendaIds: concluirAgendaIds.length ? concluirAgendaIds : undefined,
```
Trocar o bloco do toast (de `const n = resultado.revisoes.length;` até o `);` do `toast(...)`) por:
```tsx
        const n = resultado.revisoes.length;
        const k = concluirAgendaIds.length;
        const extras = [
          n ? (n === 1 ? 'Revisão geral agendada' : `${n} revisões agendadas`) : '',
          k ? (k === 1 ? '1 tarefa concluída' : `${k} tarefas concluídas`) : '',
        ].filter(Boolean);
        toast(`Cuidado registrado 🌿${tocadas.length > 1 ? ` em ${tocadas.length} plantas` : ''}${extras.map((e) => ` · ${e}`).join('')}`);
```

- [ ] **Step 4: Dicas nos chips**

- Chips gerais: `<AtividadeChips value={atividadeIds} onChange={setAtividadeIds} label={...} />` ganha `dica={dicaPara(reais)}`.
- Chips por planta: `<AtividadeChips value={tiposDe(pid)} onChange={...} label="O que foi feito nesta" />` ganha `dica={dicaPara(ehNova(pid) ? [] : [pid])}`.

- [ ] **Step 5: Bloco "Tarefas que serão concluídas"**

Imediatamente antes de `<ProximosPassos value={proximos} onChange={setProximos} />`, adicionar:
```tsx
        {candidatas.length > 0 && (
          <section>
            <span className="label">Tarefas que serão concluídas</span>
            <div className="space-y-2">
              {candidatas.map((a) => {
                const marcada = !desmarcadas.includes(a.id);
                return (
                  <label key={a.id} className="card flex cursor-pointer items-center gap-3 p-3">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={marcada}
                      onChange={() => setDesmarcadas((d) => (marcada ? [...d, a.id] : d.filter((x) => x !== a.id)))}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {a.atividade?.nome ?? 'Cuidado'} · {plantaRotulo(a.planta)}
                      </span>
                      <span className={`block text-xs ${diasAte(a.dataAgendada) < 0 ? 'font-semibold text-danger' : 'text-muted'}`}>
                        {textoPrazo(a.dataAgendada)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Desmarque se a tarefa ainda precisa ser feita.</p>
          </section>
        )}
```

- [ ] **Step 6: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
git add web/src/pages/RegistrarPage.tsx
git commit -m "feat(web): registrar mostra última vez e conclui as tarefas pendentes escolhidas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Verificação no navegador + docs

**Files:**
- Modify: `docs/superpowers/specs/2026-10-05-tarefas-inteligentes-design.md` (nota do desvio)
- Modify: `CLAUDE.md` (linha de estrutura do web: registrar conclui pendentes)

- [ ] **Step 1: Subir local**

Run (em background): `docker compose up --build` na raiz e `cd web && npm run dev`.
Abrir `http://localhost:5173` no Chrome (logado como `teste.web@bonsai.test`; ver memória `local-browser-testing`). Usar iframe de 390px para ver como no celular.

- [ ] **Step 2: Cenário principal**

Via API (`localStorage.bonsai_token`), anotar ids existentes e criar: uma planta de teste com **Adubação pendente daqui 12 dias** e **outra Adubação atrasada há 4 dias** numa segunda planta.
1. `/registrar` → registrar sem foto → escolher as 2 plantas → marcar Adubação.
   Esperado: chip "Adubação · nunca" (ou "há X dias"); bloco lista as 2 tarefas com "agendada daqui 12 dias" e "atrasada há 4 dias" (vermelho), ambas marcadas.
2. Desmarcar uma, registrar. Esperado: toast "· 1 tarefa concluída"; a marcada some da Bancada; a desmarcada continua pendente; o histórico da planta mostra a Adubação concluída hoje (sem duplicata).
3. Página da planta: seção "Últimos cuidados" com "Adubação · hoje".
4. Agendar cuidado na planta: chip "Adubação · hoje".
5. Pendente a 120 dias **não** aparece no bloco.

- [ ] **Step 3: Limpar dados de teste**

Apagar plantas/agendas criadas no Step 2 (pelos ids anotados).

- [ ] **Step 4: Docs**

No spec, na seção "API", logo abaixo da tabela do módulo `agenda`, adicionar:
```markdown
> **Fase 1 (implementada):** candidatas e "última vez" são calculadas no cliente a partir de `GET /api/agendas` (já traz o histórico completo, em cache via `useAgendas`) — `web/src/lib/cuidados.ts`. `GET /agendas/candidatas` e `/ultimas` só se o volume justificar.
```
No `CLAUDE.md`, na descrição de `RegistrarPage`, depois de `usa \`POST /api/agendas/registrar\``, acrescentar: `com \`concluirAgendaIds\` (pendentes da mesma planta+atividade, atrasadas ou ≤ 90 dias, escolhidas na tela, viram o registro — \`dominio/reconciliar.ts\`); "última vez" via \`src/lib/cuidados.ts\``.

- [ ] **Step 5: Commit**

```bash
git add docs CLAUDE.md
git commit -m "docs: fase 1 das tarefas inteligentes (reconciliação no cliente)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
