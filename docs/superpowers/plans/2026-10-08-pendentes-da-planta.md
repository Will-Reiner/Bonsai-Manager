# Pendentes da planta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A página `/tarefas/:id` de uma tarefa pendente mostra a planta, o último cuidado e todas as pendentes da planta, com seleção múltipla para concluir, reagendar (nova data ou adiar N dias) e excluir.

**Architecture:** Regras puras em `web/src/lib/tarefasDaPlanta.ts` (testadas). A página pendente vira `components/tarefa/PendentesDaPlanta.tsx`; `TarefaPage` só escolhe entre ela e a visão concluída (inalterada). `ReagendarSheet` passa a receber várias tarefas e ganha as abas "Nova data"/"Adiar". Lote no cliente com `Promise.allSettled`; sem mudança no servidor.

**Tech Stack:** React 19 + Vite + TypeScript, TanStack Query, Tailwind v4, vitest, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-08-pendentes-da-planta-design.md`

## Global Constraints

- Textos de UI, comentários e nomes em português.
- Sem mudança no `server/`.
- Página da tarefa concluída/cancelada não muda.
- `CareContext.reagendar` passa a receber `Agenda[]` (único chamador é a página da tarefa) — ajuste em relação ao spec, que dizia "continua com uma".
- Adiar: inteiro de 1 a 3650 dias.

## Review Focus

- Excluir a tarefa da URL junto com outras → volta para a tela anterior, sem piscar "Tarefa não encontrada" como estado final.
- Falha parcial no lote (1 de 3 falha) → toast "2 de 3 …" como erro e lista recarregada; nenhuma ok → mensagem do erro e sheet aberto.
- Adiar com campo vazio/0/negativo → botão salvar desativado, prévia mostra "—".
- Seleção com tarefa que deixou de ser pendente (concluída em outra aba / após refetch) → ignorada nas ações (`selecionadas` filtra pelas pendentes atuais).
- Adiar preserva o horário local (meio-dia) ao cruzar mês/horário de verão → `adiarData` usa `setDate` (testado na virada de mês).

---

### Task 1: Regras puras `tarefasDaPlanta`

**Files:**
- Create: `web/src/lib/tarefasDaPlanta.ts`
- Test: `web/src/lib/tarefasDaPlanta.test.ts`

**Interfaces:**
- Produces:
  - `pendentesDaPlanta(agendas: Agenda[], plantaId: string): Agenda[]`
  - `ultimoCuidado(agendas: Agenda[], plantaId: string): Agenda | undefined`
  - `adiarData(iso: string, dias: number): string`
  - `diasDeAdiamento(texto: string): number | null` — inteiro 1–3650 ou null
  - `emLote<T>(itens: T[], fn: (item: T) => Promise<unknown>): Promise<ResultadoLote<T>>` com `ResultadoLote<T> = { feitos: T[]; total: number; erro?: unknown }`
  - `textoResultadoLote(feitos: number, total: number, acao: 'reagendada' | 'excluída'): string`

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adiarData, diasDeAdiamento, emLote, pendentesDaPlanta, textoResultadoLote, ultimoCuidado } from './tarefasDaPlanta';
import type { Agenda } from '@/types';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
});
afterEach(() => vi.useRealTimers());

const emDias = (d: number) => new Date(2026, 9, 7 + d, 12).toISOString();
let seq = 0;
function ag(atividade: string, dias: number, extra: Partial<Agenda> = {}): Agenda {
  seq += 1;
  return { id: `a${seq}`, plantaId: 'p1', atividadeId: atividade, atividade: { id: atividade, nome: atividade }, dataAgendada: emDias(dias), status: 'PENDENTE', ...extra };
}

describe('pendentesDaPlanta', () => {
  it('só as pendentes da planta, da mais antiga para a mais nova', () => {
    const agendas = [
      ag('poda', 5),
      ag('rega', -2),
      ag('adubo', 1, { status: 'CONCLUIDO' }),
      ag('transplante', 120),
      ag('rega', 0, { plantaId: 'p2' }),
    ];
    expect(pendentesDaPlanta(agendas, 'p1').map((a) => a.atividadeId)).toEqual(['rega', 'poda', 'transplante']);
  });
});

describe('ultimoCuidado', () => {
  it('a concluída mais recente da planta (pela data de conclusão)', () => {
    const agendas = [
      ag('poda', -10, { status: 'CONCLUIDO', dataConcluida: emDias(-3) }),
      ag('adubo', -5, { status: 'CONCLUIDO' }),
      ag('rega', -1, { status: 'CONCLUIDO', plantaId: 'p2' }),
      ag('rega', -1),
    ];
    expect(ultimoCuidado(agendas, 'p1')?.atividadeId).toBe('poda');
  });

  it('nenhuma concluída → undefined', () => {
    expect(ultimoCuidado([ag('poda', 1)], 'p1')).toBeUndefined();
  });
});

describe('adiarData', () => {
  it('soma dias mantendo o horário local, inclusive na virada do mês', () => {
    const r = new Date(adiarData(new Date(2026, 9, 28, 12).toISOString(), 7));
    expect([r.getFullYear(), r.getMonth(), r.getDate(), r.getHours()]).toEqual([2026, 10, 4, 12]);
  });
});

describe('diasDeAdiamento', () => {
  it('inteiro de 1 a 3650; o resto é null', () => {
    expect(diasDeAdiamento('7')).toBe(7);
    expect(diasDeAdiamento(' 30 ')).toBe(30);
    for (const t of ['', '0', '-3', '2.5', 'abc', '3651']) expect(diasDeAdiamento(t)).toBeNull();
  });
});

describe('emLote', () => {
  it('separa as que deram certo e guarda o primeiro erro', async () => {
    const erro = new Error('falhou');
    const r = await emLote([1, 2, 3], (n) => (n === 2 ? Promise.reject(erro) : Promise.resolve()));
    expect(r).toEqual({ feitos: [1, 3], total: 3, erro });
  });
});

describe('textoResultadoLote', () => {
  it('uma, várias e parcial', () => {
    expect(textoResultadoLote(1, 1, 'excluída')).toBe('Tarefa excluída');
    expect(textoResultadoLote(3, 3, 'reagendada')).toBe('3 tarefas reagendadas');
    expect(textoResultadoLote(2, 3, 'reagendada')).toBe('2 de 3 reagendadas');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd web && npx vitest run src/lib/tarefasDaPlanta.test.ts`
Expected: FAIL — módulo `./tarefasDaPlanta` não existe.

- [ ] **Step 3: Implement**

```ts
import type { Agenda } from '@/types';

const dataFeita = (a: Agenda) => a.dataConcluida ?? a.dataAgendada;

/** Pendentes da planta, da data mais antiga para a mais nova. */
export function pendentesDaPlanta(agendas: Agenda[], plantaId: string): Agenda[] {
  return agendas
    .filter((a) => a.plantaId === plantaId && a.status === 'PENDENTE')
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));
}

/** Cuidado concluído mais recente da planta. */
export function ultimoCuidado(agendas: Agenda[], plantaId: string): Agenda | undefined {
  let ultimo: Agenda | undefined;
  for (const a of agendas) {
    if (a.plantaId !== plantaId || a.status !== 'CONCLUIDO') continue;
    if (!ultimo || dataFeita(a) > dataFeita(ultimo)) ultimo = a;
  }
  return ultimo;
}

/** Data + N dias, mantendo o horário local. */
export function adiarData(iso: string, dias: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

/** Dias digitados no "Adiar": inteiro de 1 a 3650, senão null. */
export function diasDeAdiamento(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= 3650 ? n : null;
}

export interface ResultadoLote<T> {
  feitos: T[];
  total: number;
  /** Primeiro erro, se algum falhou. */
  erro?: unknown;
}

/** Roda a ação em todos ao mesmo tempo; uma falha não impede as outras. */
export async function emLote<T>(itens: T[], fn: (item: T) => Promise<unknown>): Promise<ResultadoLote<T>> {
  const res = await Promise.allSettled(itens.map(fn));
  const falha = res.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  return { feitos: itens.filter((_, i) => res[i].status === 'fulfilled'), total: itens.length, ...(falha && { erro: falha.reason }) };
}

/** "Tarefa excluída", "3 tarefas reagendadas", "2 de 3 reagendadas". */
export function textoResultadoLote(feitos: number, total: number, acao: 'reagendada' | 'excluída'): string {
  if (feitos < total) return `${feitos} de ${total} ${acao}s`;
  return total === 1 ? `Tarefa ${acao}` : `${total} tarefas ${acao}s`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd web && npx vitest run src/lib/tarefasDaPlanta.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/tarefasDaPlanta.ts web/src/lib/tarefasDaPlanta.test.ts
git commit -m "feat(web): regras das pendentes da planta (ordem, último cuidado, adiar, lote)"
```

---

### Task 2: `ReagendarSheet` para várias tarefas, com "Nova data" e "Adiar"

**Files:**
- Modify: `web/src/components/care/ReagendarSheet.tsx` (reescrita)
- Modify: `web/src/context/CareContext.tsx` (`reagendar: (agendas: Agenda[]) => void`)
- Modify: `web/src/pages/TarefaPage.tsx:163` (`reagendar([agenda])`, provisório até a Task 3)

**Interfaces:**
- Consumes: `adiarData`, `diasDeAdiamento`, `emLote`, `textoResultadoLote` (Task 1).
- Produces: `ReagendarSheet({ agendas: Agenda[]; onClose: () => void })`; `useCare().reagendar(agendas: Agenda[])`; `avisarLote(toast, resultado, acao)` em `web/src/components/tarefa/avisarLote.ts` (usado também na Task 3):

```ts
import { errorMessage } from '@/lib/api';
import { textoResultadoLote, type ResultadoLote } from '@/lib/tarefasDaPlanta';

/** Toast do resultado de um lote: tudo ok, parcial (erro) ou nenhuma (mensagem do erro). */
export function avisarLote(
  toast: (texto: string, tipo?: 'success' | 'error') => void,
  r: ResultadoLote<unknown>,
  acao: 'reagendada' | 'excluída',
) {
  if (!r.feitos.length) toast(errorMessage(r.erro), 'error');
  else toast(textoResultadoLote(r.feitos.length, r.total, acao), r.feitos.length < r.total ? 'error' : 'success');
}
```

- [ ] **Step 1: Create `web/src/components/tarefa/avisarLote.ts`** com o código acima.

- [ ] **Step 2: Rewrite `ReagendarSheet.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { avisarLote } from '@/components/tarefa/avisarLote';
import { AgendaDaPlanta } from './AgendaDaPlanta';
import { DataFuturaCampo } from './DataFuturaCampo';
import { useToast } from '@/context/ToastContext';
import { agendasApi } from '@/lib/endpoints';
import { dataNumerica, fromDateInput, plantaCodigoNome, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import { adiarData, diasDeAdiamento, emLote } from '@/lib/tarefasDaPlanta';
import type { Agenda } from '@/types';

const ATALHOS_ADIAR = [1, 3, 7, 14, 30];
const diaMes = (iso: string) => dataNumerica(iso).slice(0, 5);

/** Reagendar uma ou várias tarefas: todas numa nova data, ou cada uma adiada N dias. */
export function ReagendarSheet({ agendas, onClose }: { agendas: Agenda[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modo, setModo] = useState<'data' | 'adiar'>('data');
  const [data, setData] = useState(() => toDateInput(agendas[0].dataAgendada));
  const [diasTexto, setDiasTexto] = useState('7');
  const [salvando, setSalvando] = useState(false);

  const unica = agendas.length === 1 ? agendas[0] : null;
  const dias = diasDeAdiamento(diasTexto);
  const novaData = (a: Agenda) => (modo === 'data' ? fromDateInput(data) : dias ? adiarData(a.dataAgendada, dias) : null);
  const invalido = modo === 'adiar' ? dias == null : !data;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (invalido) return;
    setSalvando(true);
    const r = await emLote(agendas, (a) => agendasApi.update(a.id, { dataAgendada: novaData(a)! }));
    queryClient.invalidateQueries({ queryKey: keys.agendas });
    queryClient.invalidateQueries({ queryKey: keys.rotinas });
    avisarLote(toast, r, 'reagendada');
    setSalvando(false);
    if (r.feitos.length) onClose();
  }

  return (
    <Sheet open onClose={onClose} title={unica ? 'Reagendar tarefa' : `Reagendar ${agendas.length} tarefas`}>
      <form onSubmit={submit} className="space-y-5 pb-2">
        <p className="text-sm text-muted">
          {unica ? `${unica.atividade?.nome ?? 'Tarefa'} · ` : ''}
          {plantaCodigoNome(agendas[0].planta)}
        </p>

        <div className="grid grid-cols-2 gap-2" role="tablist">
          {(
            [
              ['data', 'Nova data'],
              ['adiar', 'Adiar'],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={modo === valor}
              className={`chip justify-center ${modo === valor ? 'chip-active' : ''}`}
              onClick={() => setModo(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {modo === 'data' ? (
          <DataFuturaCampo value={data} onChange={setData} livre />
        ) : (
          <div>
            <Field label="Adiar quantos dias">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={3650}
                className="input w-28"
                value={diasTexto}
                onChange={(e) => setDiasTexto(e.target.value)}
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              {ATALHOS_ADIAR.map((d) => (
                <button
                  type="button"
                  key={d}
                  className={`chip py-1.5 text-xs ${dias === d ? 'chip-active' : ''}`}
                  onClick={() => setDiasTexto(String(d))}
                >
                  +{d} {d === 1 ? 'dia' : 'dias'}
                </button>
              ))}
            </div>
          </div>
        )}

        {unica && modo === 'data' ? (
          <AgendaDaPlanta
            plantaId={unica.plantaId}
            ignorarId={unica.id}
            data={data}
            atividadeIds={[unica.atividadeId]}
            rotuloNova={unica.atividade?.nome ?? 'Tarefa'}
            notaNova="nova data"
          />
        ) : (
          <ul className="space-y-1 rounded-2xl bg-card p-3 text-sm">
            {agendas.map((a) => {
              const nova = novaData(a);
              return (
                <li key={a.id} className="flex justify-between gap-3">
                  <span className="truncate">{a.atividade?.nome ?? 'Tarefa'}</span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {diaMes(a.dataAgendada)} → <span className="font-semibold text-ink">{nova ? diaMes(nova) : '—'}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <Button type="submit" block loading={salvando} disabled={invalido}>
          {unica ? 'Salvar nova data' : `Reagendar ${agendas.length} tarefas`}
        </Button>
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 3: `CareContext.tsx`** — interface `reagendar: (agendas: Agenda[]) => void`; estado `{ agendas: Agenda[]; versao: number }`; render `<ReagendarSheet key={reagendando.versao} agendas={reagendando.agendas} onClose={fechar} />`.

- [ ] **Step 4: `TarefaPage.tsx`** — `onClick={() => reagendar([agenda])}` (a Task 3 substitui a página pendente).

- [ ] **Step 5: Verify** — `cd web && npm run build && npm run lint` sem erros novos.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/care/ReagendarSheet.tsx web/src/components/tarefa/avisarLote.ts web/src/context/CareContext.tsx web/src/pages/TarefaPage.tsx
git commit -m "feat(web): reagendar várias tarefas, com nova data ou adiar N dias"
```

---

### Task 3: Página pendente `PendentesDaPlanta`

**Files:**
- Create: `web/src/components/tarefa/PendentesDaPlanta.tsx`
- Modify: `web/src/pages/TarefaPage.tsx` (ramo pendente → componente; remover código que só a pendente usava)

**Interfaces:**
- Consumes: `pendentesDaPlanta`, `ultimoCuidado`, `emLote` (Task 1); `avisarLote` (Task 2); `useCare().reagendar(agendas)` (Task 2); `tarefasDoDia` (`@/lib/linhaDoTempo`); `rotuloUltima`, `textoPrazo`, `textoIntervalo` (`@/lib/cuidados`).
- Produces: `PendentesDaPlanta({ agenda: Agenda; agendas: Agenda[] })`.

- [ ] **Step 1: Create `PendentesDaPlanta.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarClock, Check, MoreHorizontal, Repeat, Settings2, SkipForward, Trash2 } from 'lucide-react';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { RotinaSheet } from '@/components/care/RotinaSheet';
import { Button, PageHeader, PlantThumb } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { rotuloUltima, textoIntervalo, textoPrazo } from '@/lib/cuidados';
import { agendasApi } from '@/lib/endpoints';
import { diasAte, plantaCodigoNome, plantaNome, plantaRotulo } from '@/lib/format';
import { tarefasDoDia } from '@/lib/linhaDoTempo';
import { keys } from '@/lib/queries';
import { emLote, pendentesDaPlanta, ultimoCuidado } from '@/lib/tarefasDaPlanta';
import type { Agenda } from '@/types';
import { avisarLote } from './avisarLote';

/** Tarefa pendente: a planta, o último cuidado e todas as pendentes, com ações em lote. */
export function PendentesDaPlanta({ agenda, agendas }: { agenda: Agenda; agendas: Agenda[] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { reagendar } = useCare();
  const [marcadas, setMarcadas] = useState(() => new Set([agenda.id]));
  const [salvando, setSalvando] = useState<'excluir' | 'cancelar' | 'pular' | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const [rotinaAberta, setRotinaAberta] = useState<string | null>(null);

  const pendentes = useMemo(() => pendentesDaPlanta(agendas, agenda.plantaId), [agendas, agenda.plantaId]);
  const ultimo = useMemo(() => ultimoCuidado(agendas, agenda.plantaId), [agendas, agenda.plantaId]);
  const doUltimo = ultimo ? tarefasDoDia(agendas, ultimo) : [];
  const notaUltima = doUltimo.map((a) => (a.detalhes ?? a.observacaoFutura)?.trim()).find(Boolean);

  // Só as que ainda estão pendentes contam (uma marcada pode ter sido concluída noutro lugar)
  const selecionadas = pendentes.filter((a) => marcadas.has(a.id));
  const unica = selecionadas.length === 1 ? selecionadas[0] : null;

  const alternar = (id: string) =>
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: keys.agendas });
    queryClient.invalidateQueries({ queryKey: keys.rotinas });
  }

  /** A tarefa da página saiu das pendentes → volta; senão fica e limpa a seleção. */
  function depois(afetadas: Agenda[]) {
    if (afetadas.some((a) => a.id === agenda.id)) {
      if (window.history.state?.idx > 0) navigate(-1);
      else navigate('/', { replace: true });
    } else setMarcadas(new Set());
  }

  async function excluir() {
    setSalvando('excluir');
    const r = await emLote(selecionadas, (a) => agendasApi.remove(a.id));
    invalidar();
    avisarLote(toast, r, 'excluída');
    setSalvando(null);
    setConfirmarExclusao(false);
    if (r.feitos.length) depois(r.feitos);
  }

  async function cancelar() {
    if (!unica) return;
    setSalvando('cancelar');
    try {
      await agendasApi.update(unica.id, { status: 'CANCELADO' });
      invalidar();
      toast(unica.rotinaId ? 'Tarefa cancelada · rotina sem próxima' : 'Tarefa cancelada');
      setMaisAberto(false);
      depois([unica]);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(null);
    }
  }

  async function pular() {
    if (!unica) return;
    setSalvando('pular');
    try {
      const { proxima } = await agendasApi.pular(unica.id);
      invalidar();
      toast(proxima ? 'Pulada · próxima agendada' : 'Pulada · a rotina não tem próxima');
      setMaisAberto(false);
      depois([unica]);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(null);
    }
  }

  const n = selecionadas.length;
  const algumaDeRotina = selecionadas.some((a) => a.rotinaId);

  return (
    <div className="min-h-dvh pb-32">
      <PageHeader title={plantaCodigoNome(agenda.planta)} back />

      <div className="mx-auto max-w-2xl px-4">
        <Link to={`/plantas/${agenda.plantaId}`} className="relative mt-4 block overflow-hidden rounded-3xl">
          <PlantThumb url={agenda.planta?.fotoCapaUrl} className="aspect-[4/3] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
            <p className="text-3xl font-bold tracking-tight">{plantaRotulo(agenda.planta)}</p>
            {plantaNome(agenda.planta) && <p className="text-sm opacity-90">{plantaNome(agenda.planta)}</p>}
          </div>
        </Link>

        <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Último cuidado</h2>
        {ultimo ? (
          <Link to={`/tarefas/${ultimo.id}`} className="card flex items-start gap-3 p-3">
            <AtividadeIcone nome={ultimo.atividade?.nome ?? ''} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {doUltimo.map((a) => a.atividade?.nome ?? 'Cuidado').join(' + ')}
                <span className="font-normal text-muted"> · {rotuloUltima([ultimo.dataConcluida ?? ultimo.dataAgendada])}</span>
              </p>
              {notaUltima && <p className="line-clamp-2 text-sm text-muted">{notaUltima}</p>}
            </div>
          </Link>
        ) : (
          <p className="text-sm text-muted">Nenhum cuidado registrado ainda</p>
        )}

        <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Pendentes · {pendentes.length}</h2>
        <ul className="space-y-2">
          {pendentes.map((a) => {
            const marcada = marcadas.has(a.id);
            const atrasada = diasAte(a.dataAgendada) < 0;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={marcada}
                  onClick={() => alternar(a.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99] ${
                    a.id === agenda.id ? 'bg-primary-light' : 'bg-card'
                  }`}
                >
                  <span
                    className={`mt-2 flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      marcada ? 'border-primary bg-primary text-white' : 'border-line bg-white'
                    }`}
                    aria-hidden
                  >
                    {marcada && <Check size={14} strokeWidth={3} />}
                  </span>
                  <AtividadeIcone nome={a.atividade?.nome ?? ''} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.atividade?.nome ?? 'Tarefa'}</p>
                    <p className={`text-sm ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
                      {textoPrazo(a.dataAgendada)}
                      {a.rotina && (
                        <span className="text-muted">
                          {' · '}
                          <Repeat size={12} className="inline align-[-1px]" /> {textoIntervalo(a.rotina.intervaloDias)}
                          {a.rotina.pausada && ' (pausada)'}
                        </span>
                      )}
                    </p>
                    {a.detalhes?.trim() && <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm">{a.detalhes}</p>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2 pb-3">
          <Button className="flex-1" disabled={!n} onClick={() => navigate(`/concluir?ids=${selecionadas.map((a) => a.id).join(',')}`)}>
            <Check size={18} /> Concluir{n > 1 ? ` (${n})` : ''}
          </Button>
          <Button variant="secondary" disabled={!n} onClick={() => reagendar(selecionadas)} aria-label="Reagendar">
            <CalendarClock size={18} />
            <span className="max-[359px]:hidden">Reagendar</span>
          </Button>
          <Button variant="danger" disabled={!n} onClick={() => setConfirmarExclusao(true)} aria-label="Excluir" className="px-3.5">
            <Trash2 size={18} />
          </Button>
          <Button variant="secondary" disabled={!unica} onClick={() => setMaisAberto(true)} aria-label="Mais opções" className="px-3.5">
            <MoreHorizontal size={18} />
          </Button>
        </div>
      </div>

      <ConfirmSheet
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={excluir}
        loading={salvando === 'excluir'}
        title={n > 1 ? `Excluir ${n} tarefas?` : 'Excluir tarefa?'}
        text={
          'Some do histórico. Para manter o registro, use “Cancelar” em ⋯.' +
          (algumaDeRotina ? ' A rotina fica sem próxima tarefa — para só adiar, use “Pular esta vez”.' : '')
        }
      />

      <Sheet open={maisAberto && !!unica} onClose={() => setMaisAberto(false)} title={unica?.atividade?.nome ?? 'Tarefa'}>
        <div className="space-y-2 pb-safe">
          <Button block variant="secondary" onClick={cancelar} loading={salvando === 'cancelar'}>
            <Ban size={18} /> Cancelar tarefa
          </Button>
          {unica?.rotinaId && (
            <>
              <Button block variant="secondary" onClick={pular} loading={salvando === 'pular'}>
                <SkipForward size={18} /> Pular esta vez
              </Button>
              <Button
                block
                variant="secondary"
                onClick={() => {
                  setMaisAberto(false);
                  setRotinaAberta(unica.rotinaId!);
                }}
              >
                <Settings2 size={18} /> Editar rotina
              </Button>
            </>
          )}
        </div>
      </Sheet>

      <RotinaSheet rotinaId={rotinaAberta} onClose={() => setRotinaAberta(null)} />
    </div>
  );
}
```

- [ ] **Step 2: `TarefaPage.tsx`** — logo após os early returns, `if (agenda.status === 'PENDENTE') return <PendentesDaPlanta agenda={agenda} agendas={agendas.data ?? []} />;`. O resto da página fica só com a visão concluída/cancelada: remover `pular`, `acao`, `salvando`, `rotinaAberta`, `confirmarExclusao`, o bloco de ações pendentes, o `RotinaSheet`/`ConfirmSheet`, o ramo `pendente`/`atrasada`/`detalhes`, e imports que ficarem sem uso. Manter carrossel (concluída), status + fotos (cancelada) e o histórico.

- [ ] **Step 3: Verify** — `cd web && npx vitest run && npm run build && npm run lint` sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/tarefa/PendentesDaPlanta.tsx web/src/pages/TarefaPage.tsx
git commit -m "feat(web): tarefa pendente mostra a planta, o último cuidado e as pendentes com ações em lote"
```

---

### Task 4: Verificação no navegador e docs

- [ ] **Step 1:** `docker restart bonsai_api` não é necessário (sem mudança no server). Dev server em `localhost:5173`, conta local, iframe 390px.
- [ ] **Step 2:** Criar via API uma planta de teste com 3 pendentes (uma atrasada, uma de rotina) e 1 concluída. Abrir `/tarefas/:id` da atrasada. Conferir: foto, último cuidado, 3 pendentes com a atrasada marcada e destacada.
- [ ] **Step 3:** Marcar 2 → Reagendar → aba Adiar +7 → prévia correta → salvar → toast "2 tarefas reagendadas", datas atualizadas. Nova data em 1 → prévia `AgendaDaPlanta`.
- [ ] **Step 4:** ⋯ com a de rotina → opções Cancelar/Pular/Editar rotina. Excluir uma que não é a da URL → fica na página. Excluir a da URL → volta.
- [ ] **Step 5:** Concluir (2) → abre `/concluir?ids=a,b`.
- [ ] **Step 6:** Apagar dados de teste. Marcar o item no `docs/todo.md` com nota "Feito em 2026-10-08 (spec …)"; atualizar a menção de `TarefaPage` no `CLAUDE.md`.
- [ ] **Step 7: Commit** — `git commit -m "docs: página de pendentes da planta"`.
