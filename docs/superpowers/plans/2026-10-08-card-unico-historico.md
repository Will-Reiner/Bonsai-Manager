# Card único no histórico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No histórico, tudo o que foi concluído na mesma planta no mesmo dia aparece num card único, com as notas apontando para a tarefa quando não valem para todas.

**Architecture:** Agrupamento só de exibição, numa função pura (`web/src/lib/linhaDoTempo.ts`) consumida pelas três telas de histórico; a página da tarefa concluída ganha um carrossel com as tarefas do dia. No backend, o registro passa a gravar descrição/obs. em todas as tarefas da planta (sem mudança de schema).

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4 + TanStack Query (web, testes com vitest); Express + Prisma (server, jest).

**Spec:** `docs/superpowers/specs/2026-10-08-card-unico-historico-design.md`

## Global Constraints

- Sem mudança no banco (sem campo novo, sem migration).
- Código, comentários e textos da UI em português.
- Dia = dia local do aparelho: `toDateInput(dataConcluida ?? dataAgendada)` (`web/src/lib/format.ts`).
- Título do card: nomes sem repetição unidos por `" + "`; nome ausente vira `'Cuidado'`.
- Nota sem rótulo (`atividades: null`) quando vale para todas as tarefas do card ou o card tem uma tarefa só.
- Pendentes/atrasadas continuam um card por tarefa.
- Comandos web rodam em `web/`; server em `server/`.

## Review Focus

- Tarefa concluída sem `atividade` carregada → título e rótulo usam `'Cuidado'` (teste na Task 1).
- Mesma atividade duas vezes no dia (dois registros separados) com textos diferentes → duas notas, cada uma com o rótulo, nada se perde (teste na Task 1).
- Texto só com espaços → ignorado, não vira nota vazia (teste na Task 1).
- Foto avulsa num dia que só tem tarefa pendente (nenhuma concluída) → continua item `fotos` (teste na Task 1).
- Abrir direto a URL da 2ª tarefa do dia → carrossel já abre no 2º painel, sem pular para o 1º (verificação no navegador, Task 4).

---

### Task 1: Agrupamento por dia + histórico da planta e histórico completo

**Files:**
- Modify: `web/src/lib/linhaDoTempo.ts`
- Create: `web/src/lib/linhaDoTempo.test.ts`
- Create: `web/src/components/NotasDoCuidado.tsx`
- Modify: `web/src/pages/PlantDetailPage.tsx` (`RodaLinhaDoTempo`, `CardLinha`)
- Modify: `web/src/pages/PlantHistoryPage.tsx`

**Interfaces:**
- Produces (em `@/lib/linhaDoTempo`):
  - `type FotoMini = { id: string; caminhoArquivo: string }`
  - `interface NotaCuidado { tipo: 'detalhes' | 'obs'; texto: string; atividades: string[] | null }`
  - `type ItemLinha = { tipo: 'tarefa'; data: string; agenda: Agenda; estado: 'futura' | 'atrasada' } | { tipo: 'cuidado'; data: string; agendas: Agenda[]; fotos: FotoMini[]; notas: NotaCuidado[] } | { tipo: 'fotos'; data: string; fotos: Foto[] }`
  - `tituloCuidado(agendas: Agenda[]): string`
  - `notasDoCuidado(agendas: Agenda[]): NotaCuidado[]`
  - `tarefasDoDia(agendas: Agenda[], agenda: Agenda): Agenda[]`
  - `linhaDoTempo(agendas: Agenda[], fotos?: Foto[]): { passado: ItemLinha[]; pendentes: ItemLinha[] }` (mesma assinatura)
  - `chaveItem(i: ItemLinha): string` (`t-<id>`, `c-<dia>`, `f-<data>`)
- Produces (em `@/components/NotasDoCuidado`): `NotasDoCuidado({ notas }: { notas: NotaCuidado[] })`

- [ ] **Step 1: Write the failing test** — `web/src/lib/linhaDoTempo.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chaveItem, linhaDoTempo, notasDoCuidado, tarefasDoDia, tituloCuidado } from './linhaDoTempo';
import type { Agenda, Foto } from '@/types';

// Hoje fixo: 8 de outubro de 2026, meio-dia local
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 8, 12));
});
afterEach(() => vi.useRealTimers());

const em = (dia: number, hora = 10, min = 0) => new Date(2026, 9, dia, hora, min).toISOString();

let seq = 0;
function feita(atividade: string, quando: string, extra: Partial<Agenda> = {}): Agenda {
  seq += 1;
  return {
    id: `a${seq}`,
    plantaId: 'p1',
    atividadeId: atividade,
    atividade: { id: atividade, nome: atividade },
    dataAgendada: quando,
    dataConcluida: quando,
    status: 'CONCLUIDO',
    ...extra,
  };
}
const pendente = (atividade: string, quando: string) =>
  feita(atividade, quando, { status: 'PENDENTE', dataConcluida: null });
const foto = (id: string, quando: string, extra: Partial<Foto> = {}): Foto => ({
  id,
  caminhoArquivo: `${id}.jpg`,
  createdAt: quando,
  dataCaptura: quando,
  usuarioId: 'u1',
  tipo: 'FOTO',
  plantaId: 'p1',
  ...extra,
});
const ids = (as: Agenda[]) => as.map((a) => a.id);

describe('linhaDoTempo — cuidados do dia', () => {
  it('junta as tarefas concluídas do mesmo dia num cuidado', () => {
    const a = feita('Adubação', em(7, 10));
    const b = feita('Desaramação', em(7, 10));
    const { passado } = linhaDoTempo([a, b]);
    expect(passado).toHaveLength(1);
    expect(passado[0]).toMatchObject({ tipo: 'cuidado', data: a.dataConcluida });
    expect(passado[0].tipo === 'cuidado' && ids(passado[0].agendas)).toEqual([a.id, b.id]);
  });

  it('separa dias diferentes, do mais antigo para o mais novo', () => {
    const novo = feita('Poda', em(7));
    const antigo = feita('Rega', em(5));
    const { passado } = linhaDoTempo([novo, antigo]);
    expect(passado.map((i) => i.tipo === 'cuidado' && ids(i.agendas))).toEqual([[antigo.id], [novo.id]]);
  });

  it('a virada do dia segue o fuso do aparelho', () => {
    const { passado } = linhaDoTempo([feita('Rega', em(7, 23, 50)), feita('Poda', em(8, 0, 10))]);
    expect(passado).toHaveLength(2);
  });

  it('ordena as tarefas do dia pela hora de conclusão', () => {
    const tarde = feita('Poda', em(7, 16));
    const manha = feita('Rega', em(7, 8));
    const { passado } = linhaDoTempo([tarde, manha]);
    expect(passado[0].tipo === 'cuidado' && ids(passado[0].agendas)).toEqual([manha.id, tarde.id]);
    expect(passado[0].data).toBe(manha.dataConcluida);
  });

  it('fotos das tarefas e fotos avulsas do dia entram no cuidado; dia sem cuidado fica como fotos', () => {
    const a = feita('Adubação', em(7), { fotos: [{ id: 'f1', caminhoArquivo: 'f1.jpg' }] });
    const fotos = [foto('f1', em(7), { agendaId: a.id }), foto('f2', em(7, 15)), foto('f3', em(6))];
    const { passado } = linhaDoTempo([a], fotos);
    expect(passado.map((i) => i.tipo)).toEqual(['fotos', 'cuidado']);
    expect(passado[1].tipo === 'cuidado' && passado[1].fotos.map((f) => f.id)).toEqual(['f1', 'f2']);
    expect(passado[0].tipo === 'fotos' && passado[0].fotos.map((f) => f.id)).toEqual(['f3']);
  });

  it('foto avulsa num dia com só tarefa pendente continua como fotos', () => {
    const { passado, pendentes } = linhaDoTempo([pendente('Poda', em(8, 9))], [foto('f9', em(8, 9))]);
    expect(passado.map((i) => i.tipo)).toEqual(['fotos']);
    expect(pendentes).toHaveLength(1);
  });

  it('pendentes continuam uma por tarefa, atrasadas antes das futuras', () => {
    const futura = pendente('Poda', em(10));
    const atrasada = pendente('Rega', em(3));
    const { pendentes } = linhaDoTempo([futura, atrasada, feita('Adubação', em(7))]);
    expect(pendentes.map((i) => i.tipo === 'tarefa' && [i.agenda.id, i.estado])).toEqual([
      [atrasada.id, 'atrasada'],
      [futura.id, 'futura'],
    ]);
  });

  it('chave do cuidado é o dia', () => {
    const { passado } = linhaDoTempo([feita('Rega', em(7))]);
    expect(chaveItem(passado[0])).toBe('c-2026-10-07');
  });
});

describe('tituloCuidado', () => {
  it('une os nomes sem repetir', () => {
    expect(tituloCuidado([feita('Adubação', em(7)), feita('Adubação', em(7)), feita('Poda', em(7))])).toBe('Adubação + Poda');
  });

  it('sem atividade carregada vira Cuidado', () => {
    expect(tituloCuidado([feita('Rega', em(7), { atividade: undefined })])).toBe('Cuidado');
  });
});

describe('notasDoCuidado', () => {
  it('texto igual em todas as tarefas aparece uma vez, sem rótulo', () => {
    const notas = notasDoCuidado([
      feita('Adubação', em(7), { detalhes: 'Dia de sol ' }),
      feita('Desaramação', em(7), { detalhes: 'Dia de sol' }),
    ]);
    expect(notas).toEqual([{ tipo: 'detalhes', texto: 'Dia de sol', atividades: null }]);
  });

  it('texto de parte das tarefas leva o nome delas; descrições antes das obs.', () => {
    const notas = notasDoCuidado([
      feita('Adubação', em(7), { detalhes: 'Bioform 5 ml/L' }),
      feita('Desaramação', em(7), { detalhes: 'Galho marcou', observacaoFutura: 'Reaplicar em 2 meses' }),
    ]);
    expect(notas).toEqual([
      { tipo: 'detalhes', texto: 'Bioform 5 ml/L', atividades: ['Adubação'] },
      { tipo: 'detalhes', texto: 'Galho marcou', atividades: ['Desaramação'] },
      { tipo: 'obs', texto: 'Reaplicar em 2 meses', atividades: ['Desaramação'] },
    ]);
  });

  it('card de uma tarefa não tem rótulo', () => {
    expect(notasDoCuidado([feita('Poda', em(7), { observacaoFutura: 'Ver brotação' })])).toEqual([
      { tipo: 'obs', texto: 'Ver brotação', atividades: null },
    ]);
  });

  it('mesma atividade duas vezes com textos diferentes mantém os dois', () => {
    const notas = notasDoCuidado([
      feita('Rega', em(7, 8), { detalhes: 'Manhã' }),
      feita('Rega', em(7, 18), { detalhes: 'Tarde' }),
    ]);
    expect(notas).toEqual([
      { tipo: 'detalhes', texto: 'Manhã', atividades: ['Rega'] },
      { tipo: 'detalhes', texto: 'Tarde', atividades: ['Rega'] },
    ]);
  });

  it('ignora texto só com espaços', () => {
    expect(notasDoCuidado([feita('Rega', em(7), { detalhes: '   ', observacaoFutura: null })])).toEqual([]);
  });
});

describe('tarefasDoDia', () => {
  it('as concluídas da mesma planta no mesmo dia, em ordem de conclusão', () => {
    const b = feita('Poda', em(7, 16));
    const a = feita('Rega', em(7, 8));
    const outroDia = feita('Rega', em(6));
    const outraPlanta = feita('Rega', em(7), { plantaId: 'p2' });
    const pend = pendente('Adubação', em(7));
    expect(ids(tarefasDoDia([b, a, outroDia, outraPlanta, pend], b))).toEqual([a.id, b.id]);
  });

  it('tarefa não concluída volta sozinha', () => {
    const p = pendente('Poda', em(9));
    expect(tarefasDoDia([p, feita('Rega', em(9))], p)).toEqual([p]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/linhaDoTempo.test.ts`
Expected: FAIL — `tituloCuidado`/`notasDoCuidado`/`tarefasDoDia` não exportados.

- [ ] **Step 3: Implement** — substituir `web/src/lib/linhaDoTempo.ts` por:

```ts
import { diasAte, toDateInput } from './format';
import type { Agenda, Foto } from '@/types';

export const dataDaFoto = (f: Foto) => f.dataCaptura ?? f.createdAt;

/** Só imagens, da mais nova para a mais antiga. */
export const fotosOrdenadas = (fotos: Foto[] = []) =>
  fotos.filter((f) => f.tipo !== 'VIDEO').sort((a, b) => dataDaFoto(b).localeCompare(dataDaFoto(a)));

export type FotoMini = { id: string; caminhoArquivo: string };

/** Descrição ou obs. de um cuidado do dia; `atividades` null = vale para todas as tarefas do card. */
export interface NotaCuidado {
  tipo: 'detalhes' | 'obs';
  texto: string;
  atividades: string[] | null;
}

export type ItemLinha =
  | { tipo: 'tarefa'; data: string; agenda: Agenda; estado: 'futura' | 'atrasada' }
  | { tipo: 'cuidado'; data: string; agendas: Agenda[]; fotos: FotoMini[]; notas: NotaCuidado[] }
  | { tipo: 'fotos'; data: string; fotos: Foto[] };

export const chaveItem = (i: ItemLinha) =>
  i.tipo === 'tarefa' ? `t-${i.agenda.id}` : i.tipo === 'cuidado' ? `c-${toDateInput(i.data)}` : `f-${i.data}`;

const dataFeita = (a: Agenda) => a.dataConcluida ?? a.dataAgendada;
const nomeDe = (a: Agenda) => a.atividade?.nome ?? 'Cuidado';

/** "Adubação + Desaramação" (sem repetir nomes). */
export const tituloCuidado = (agendas: Agenda[]) => [...new Set(agendas.map(nomeDe))].join(' + ');

/** Descrições e obs. do card, sem repetir texto; com o nome das tarefas só quando o texto não vale para todas. */
export function notasDoCuidado(agendas: Agenda[]): NotaCuidado[] {
  const notas: NotaCuidado[] = [];
  for (const tipo of ['detalhes', 'obs'] as const) {
    const donasDe = new Map<string, Agenda[]>();
    for (const a of agendas) {
      const texto = (tipo === 'detalhes' ? a.detalhes : a.observacaoFutura)?.trim();
      if (texto) donasDe.set(texto, [...(donasDe.get(texto) ?? []), a]);
    }
    for (const [texto, donas] of donasDe) {
      notas.push({ tipo, texto, atividades: donas.length === agendas.length ? null : [...new Set(donas.map(nomeDe))] });
    }
  }
  return notas;
}

/** Concluídas agrupadas por dia local, cada dia em ordem de conclusão. */
function porDiaDeConclusao(concluidas: Agenda[]) {
  const porDia = new Map<string, Agenda[]>();
  for (const a of [...concluidas].sort((x, y) => dataFeita(x).localeCompare(dataFeita(y)))) {
    const dia = toDateInput(dataFeita(a));
    porDia.set(dia, [...(porDia.get(dia) ?? []), a]);
  }
  return porDia;
}

/** Tarefas concluídas da mesma planta no mesmo dia da tarefa (ela inclusa), na ordem do card. */
export function tarefasDoDia(agendas: Agenda[], agenda: Agenda): Agenda[] {
  if (agenda.status !== 'CONCLUIDO') return [agenda];
  const concluidas = agendas.filter((a) => a.status === 'CONCLUIDO' && a.plantaId === agenda.plantaId);
  return porDiaDeConclusao(concluidas).get(toDateInput(dataFeita(agenda))) ?? [agenda];
}

/**
 * Linha do tempo da planta, da mais antiga para a mais nova:
 * `passado` — um cuidado por dia (tarefas concluídas + fotos do dia) e fotos avulsas de dias sem cuidado;
 * `pendentes` — atrasadas e depois as futuras, uma por tarefa.
 */
export function linhaDoTempo(agendas: Agenda[], fotos: Foto[] = []) {
  const concluidas = agendas.filter((a) => a.status === 'CONCLUIDO');
  const idsConcluidas = new Set(concluidas.map((a) => a.id));
  const doCuidado = new Set(concluidas.flatMap((a) => a.fotos?.map((f) => f.id) ?? []));
  const avulsas = fotosOrdenadas(fotos).filter((f) => !doCuidado.has(f.id) && !(f.agendaId && idsConcluidas.has(f.agendaId)));

  const avulsasPorDia = new Map<string, Foto[]>();
  for (const f of [...avulsas].reverse()) {
    const dia = toDateInput(dataDaFoto(f));
    avulsasPorDia.set(dia, [...(avulsasPorDia.get(dia) ?? []), f]);
  }

  const cuidados: ItemLinha[] = [...porDiaDeConclusao(concluidas)].map(([dia, doDia]) => {
    const fotosDoDia = avulsasPorDia.get(dia) ?? [];
    avulsasPorDia.delete(dia);
    return {
      tipo: 'cuidado',
      data: dataFeita(doDia[0]),
      agendas: doDia,
      fotos: [...doDia.flatMap((a) => a.fotos ?? []), ...fotosDoDia],
      notas: notasDoCuidado(doDia),
    };
  });
  const grupos: ItemLinha[] = [...avulsasPorDia.values()].map((fs) => ({ tipo: 'fotos', data: dataDaFoto(fs[0]), fotos: fs }));

  const passado = [...cuidados, ...grupos].sort((a, b) => a.data.localeCompare(b.data));
  const pendentes: ItemLinha[] = agendas
    .filter((a) => a.status === 'PENDENTE')
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada))
    .map((a) => ({ tipo: 'tarefa', data: a.dataAgendada, agenda: a, estado: diasAte(a.dataAgendada) < 0 ? 'atrasada' : 'futura' }));

  return { passado, pendentes };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/linhaDoTempo.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Create `web/src/components/NotasDoCuidado.tsx`**

```tsx
import type { NotaCuidado } from '@/lib/linhaDoTempo';

/** Descrições e obs. de um cuidado do dia; com o nome da tarefa quando o texto não vale para todas. */
export function NotasDoCuidado({ notas }: { notas: NotaCuidado[] }) {
  if (!notas.length) return null;
  return (
    <div className="mt-0.5 space-y-1">
      {notas.map((n) => {
        const rotulo = n.atividades?.join(', ');
        return n.tipo === 'obs' ? (
          <p key={`o-${rotulo}-${n.texto}`} className="whitespace-pre-line text-sm text-accent">
            Próxima vez{rotulo ? ` (${rotulo})` : ''}: {n.texto}
          </p>
        ) : (
          <p key={`d-${rotulo}-${n.texto}`} className="whitespace-pre-line text-sm">
            {rotulo && <span className="font-semibold">{rotulo}: </span>}
            {n.texto}
          </p>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Update `web/src/pages/PlantHistoryPage.tsx`**

Imports: adicionar `Fragment` de `react` (`import { Fragment, useMemo } from 'react';`) e `import { NotasDoCuidado } from '@/components/NotasDoCuidado';`.

Trocar o bloco `{item.tipo === 'tarefa' ? ( … ) : ( <Miniaturas fotos={item.fotos} abrir={abrirFoto} /> )}` dentro do `<li>` por:

```tsx
                    {item.tipo === 'cuidado' ? (
                      <>
                        <p className="mt-1 font-semibold">
                          {item.agendas.map((a, i) => (
                            <Fragment key={a.id}>
                              {i > 0 && ' + '}
                              <button onClick={() => abrirTarefa(a)} className="text-left">
                                {a.atividade?.nome ?? 'Cuidado'}
                              </button>
                            </Fragment>
                          ))}
                        </p>
                        <NotasDoCuidado notas={item.notas} />
                        <Miniaturas fotos={item.fotos} abrir={abrirFoto} />
                      </>
                    ) : item.tipo === 'fotos' ? (
                      <Miniaturas fotos={item.fotos} abrir={abrirFoto} />
                    ) : null}
```

- [ ] **Step 7: Update `web/src/pages/PlantDetailPage.tsx`**

Import: `import { chaveItem, dataDaFoto, fotosOrdenadas, linhaDoTempo, tituloCuidado, type ItemLinha } from '@/lib/linhaDoTempo';`

Em `RodaLinhaDoTempo`: `const ultima = passado.findLastIndex((i) => i.tipo === 'cuidado');`

Em `CardLinha`, trocar as linhas de `fotos`, `titulo`, `onClick` e do contador:

```tsx
  const fotos = item.tipo === 'tarefa' ? (item.agenda.fotos ?? []) : item.fotos;
  const capa = fotos[0]?.caminhoArquivo;

  const titulo =
    item.tipo === 'tarefa'
      ? (item.agenda.atividade?.nome ?? 'Cuidado')
      : item.tipo === 'cuidado'
        ? tituloCuidado(item.agendas)
        : fotos.length > 1
          ? `${fotos.length} fotos`
          : 'Foto';
```

```tsx
      onClick={() =>
        item.tipo === 'tarefa' ? abrirTarefa(item.agenda) : item.tipo === 'cuidado' ? abrirTarefa(item.agendas[0]) : abrirFoto(item.fotos[0])
      }
```

```tsx
        {fotos.length > 1 && item.tipo !== 'fotos' && (
```

- [ ] **Step 8: Build + testes do web**

Run: `cd web && npm run build && npx vitest run`
Expected: build ok (o `HistoricoPlanta` não usa `ItemLinha`, então compila); todos os testes passam.

- [ ] **Step 9: Commit**

```bash
git add web/src/lib/linhaDoTempo.ts web/src/lib/linhaDoTempo.test.ts web/src/components/NotasDoCuidado.tsx web/src/pages/PlantDetailPage.tsx web/src/pages/PlantHistoryPage.tsx
git commit -m "feat(web): histórico agrupa os cuidados do dia num card único"
```

---

### Task 2: Página da tarefa — linha do tempo agrupada e carrossel do dia

**Files:**
- Modify: `web/src/components/HistoricoPlanta.tsx` (reescrever)
- Create: `web/src/components/CarrosselDoDia.tsx`
- Modify: `web/src/pages/TarefaPage.tsx`

**Interfaces:**
- Consumes: `linhaDoTempo`, `tituloCuidado`, `tarefasDoDia`, `chaveItem`, `ItemLinha` (Task 1); `NotasDoCuidado` (Task 1).
- Produces: `CarrosselDoDia({ tarefas, atualId, onTrocar }: { tarefas: Agenda[]; atualId: string; onTrocar: (id: string) => void })`.

- [ ] **Step 1: Reescrever `web/src/components/HistoricoPlanta.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, MessageSquareText } from 'lucide-react';
import { Sheet } from './Sheet';
import { NotasDoCuidado } from './NotasDoCuidado';
import { dataCurta, dataRelativa } from '@/lib/format';
import { chaveItem, linhaDoTempo, tituloCuidado, type ItemLinha } from '@/lib/linhaDoTempo';
import type { Agenda } from '@/types';

type Cuidado = Extract<ItemLinha, { tipo: 'cuidado' }>;

/** Linha do tempo horizontal da planta: um card por dia de cuidado (esmaecidos), atual em destaque, futuros tracejados. */
export function HistoricoPlanta({ agendas, atualId }: { agendas: Agenda[]; atualId: string }) {
  const atualRef = useRef<HTMLDivElement>(null);
  const [nota, setNota] = useState<Cuidado | null>(null);

  const itens = useMemo(() => {
    const { passado, pendentes } = linhaDoTempo(agendas);
    return [...passado, ...pendentes];
  }, [agendas]);

  useEffect(() => {
    atualRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [atualId, itens.length]);

  return (
    <>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {itens.map((item) => {
          if (item.tipo === 'fotos') return null;
          const passado = item.tipo === 'cuidado';
          const atual = passado ? item.agendas.some((a) => a.id === atualId) : item.agenda.id === atualId;
          const atrasada = item.tipo === 'tarefa' && item.estado === 'atrasada';
          const foto = passado ? item.fotos[0]?.caminhoArquivo : item.agenda.fotos?.[0]?.caminhoArquivo;
          const titulo = passado ? tituloCuidado(item.agendas) : (item.agenda.atividade?.nome ?? 'Cuidado');
          return (
            <div
              key={chaveItem(item)}
              ref={atual ? atualRef : undefined}
              className={`relative w-36 shrink-0 snap-center rounded-2xl p-3 ${
                atual
                  ? 'border-2 border-primary bg-primary-light'
                  : passado
                    ? 'border border-line bg-card opacity-70'
                    : 'border-2 border-dashed border-line bg-card'
              }`}
            >
              {atual && <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Agora</span>}
              {foto && <img src={foto} alt="" loading="lazy" className="mb-2 aspect-square w-full rounded-lg object-cover" />}
              <p className="flex items-center gap-1 text-sm font-semibold leading-tight">
                {passado && <Check size={14} className="shrink-0 text-primary" />}
                <span className="line-clamp-2">{titulo}</span>
              </p>
              <p className={`mt-0.5 text-xs ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
                {passado ? dataCurta(item.data) : dataRelativa(item.data)}
              </p>
              {passado && item.notas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNota(item)}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-accent-light text-accent"
                  aria-label="Ver observações"
                >
                  <MessageSquareText size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!nota} onClose={() => setNota(null)} title={nota ? tituloCuidado(nota.agendas) : 'Observações'}>
        {nota && (
          <div className="space-y-3 pb-safe">
            <p className="text-sm text-muted">{dataCurta(nota.data)}</p>
            <NotasDoCuidado notas={nota.notas} />
          </div>
        )}
      </Sheet>
    </>
  );
}
```

- [ ] **Step 2: Create `web/src/components/CarrosselDoDia.tsx`**

```tsx
import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Repeat } from 'lucide-react';
import { textoIntervalo } from '@/lib/cuidados';
import { dataLonga, dataRelativa } from '@/lib/format';
import type { Agenda } from '@/types';

/** Tarefas concluídas no mesmo dia na planta: um painel por tarefa, deslizando para o lado. */
export function CarrosselDoDia({ tarefas, atualId, onTrocar }: { tarefas: Agenda[]; atualId: string; onTrocar: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const atual = Math.max(0, tarefas.findIndex((t) => t.id === atualId));

  // Abre no painel da tarefa da URL (antes de pintar, sem pular do 1º painel)
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.clientWidth && Math.round(el.scrollLeft / el.clientWidth) !== atual) el.scrollLeft = atual * el.clientWidth;
  }, [atual]);

  function aoRolar() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (tarefas[i] && i !== atual) onTrocar(tarefas[i].id);
  }

  return (
    <div className="mt-4">
      <div ref={ref} onScroll={aoRolar} className="-mx-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        {tarefas.map((t) => (
          <Painel key={t.id} tarefa={t} />
        ))}
      </div>
      {tarefas.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {tarefas.map((t, i) => (
            <span key={t.id} className={`size-1.5 rounded-full ${i === atual ? 'bg-primary' : 'bg-line'}`} />
          ))}
          <span className="ml-1.5 text-xs text-muted">
            {atual + 1} de {tarefas.length}
          </span>
        </div>
      )}
    </div>
  );
}

function Painel({ tarefa: t }: { tarefa: Agenda }) {
  const quando = t.dataConcluida ?? t.dataAgendada;
  return (
    <section className="w-full shrink-0 snap-center px-4">
      <h2 className="text-lg font-semibold">{t.atividade?.nome ?? 'Cuidado'}</h2>
      <p className="text-sm text-muted">
        Concluída · {dataRelativa(quando)} ({dataLonga(quando)})
      </p>
      {t.rotina && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Repeat size={14} /> Rotina {textoIntervalo(t.rotina.intervaloDias)}
          {t.rotina.pausada && ' · pausada'}
        </p>
      )}
      {t.detalhes && <p className="mt-3 whitespace-pre-line text-sm">{t.detalhes}</p>}
      {t.observacaoFutura && <p className="mt-2 whitespace-pre-line text-sm text-accent">Próxima vez: {t.observacaoFutura}</p>}
      {!!t.fotos?.length && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {t.fotos.map((f) => (
            <Link
              key={f.id}
              to={`/plantas/${t.plantaId}/galeria?foto=${f.id}`}
              className="aspect-square overflow-hidden rounded-xl bg-primary-light"
            >
              <img src={f.caminhoArquivo} alt="" loading="lazy" className="size-full object-cover" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Update `web/src/pages/TarefaPage.tsx`**

Imports: `import { CarrosselDoDia } from '@/components/CarrosselDoDia';` e `import { tarefasDoDia } from '@/lib/linhaDoTempo';`.

Depois de `const dataStatus = …` adicionar:

```tsx
  const concluida = agenda.status === 'CONCLUIDO';
```

Envolver o bloco que vai do `<p className={`mt-4 text-sm ${atrasada …`}>` (status) até o fim da seção "Fotos do cuidado" (antes do `<h2>` "Histórico da planta") assim:

```tsx
        {concluida ? (
          <CarrosselDoDia
            tarefas={tarefasDoDia(daPlanta, agenda)}
            atualId={agenda.id}
            onTrocar={(outra) => navigate(`/tarefas/${outra}`, { replace: true })}
          />
        ) : (
          <>
            {/* … bloco atual inalterado: status, rotina, pulada, instrução da pendente, fotos do cuidado … */}
          </>
        )}
```

(o conteúdo entre `<>` e `</>` é exatamente o JSX existente dessas linhas, sem alterações.) Atualizar o comentário do componente: `/** Detalhe da tarefa: planta em destaque + tarefas do dia (concluída) + histórico horizontal + ações. */`

- [ ] **Step 4: Build + lint + testes**

Run: `cd web && npm run build && npm run lint && npx vitest run`
Expected: build ok; lint sem erros novos (só os avisos que já existiam); testes passam.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/HistoricoPlanta.tsx web/src/components/CarrosselDoDia.tsx web/src/pages/TarefaPage.tsx
git commit -m "feat(web): página da tarefa com o card do dia e carrossel das tarefas concluídas juntas"
```

---

### Task 3: Registro grava as notas em todas as tarefas + Ajustar mostra a tarefa

**Files:**
- Modify: `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts` (`registrar`)
- Modify: `server/src/modules/agenda/agenda.types.ts` (comentário de `PlanoRegistro.cuidados`)
- Modify: `web/src/pages/ConcluirPage.tsx` (subtítulo do Ajustar plantas)

**Interfaces:** nenhuma nova.

- [ ] **Step 1: `registrar` — notas em todas as tarefas criadas**

Em `novas` (dentro de `registrar`), trocar `c.atividadeIds.flatMap((atividadeId, i) =>` por `c.atividadeIds.flatMap((atividadeId) =>` e as linhas

```ts
                    // Nota e obs. só no primeiro cuidado: no histórico os cuidados do dia aparecem juntos
                    ...(i === 0 ? { detalhes: c.detalhes, observacaoFutura: c.observacaoFutura } : {}),
```

por

```ts
                    // Nota e obs. do registro valem para todos os cuidados da planta (o histórico junta os do dia)
                    detalhes: c.detalhes,
                    observacaoFutura: c.observacaoFutura,
```

- [ ] **Step 2: `registrar` — notas em todas as pendentes absorvidas**

No laço `for (const a of plano.absorver)`, remover `const primeiro = c.atividadeIds[0] === a.atividadeId;` e trocar

```ts
              ...(primeiro && c.detalhes !== undefined ? { detalhes: c.detalhes } : {}),
              ...(primeiro && c.observacaoFutura !== undefined ? { observacaoFutura: c.observacaoFutura } : {}),
```

por

```ts
              ...(c.detalhes !== undefined ? { detalhes: c.detalhes } : {}),
              ...(c.observacaoFutura !== undefined ? { observacaoFutura: c.observacaoFutura } : {}),
```

- [ ] **Step 3: Comentário em `agenda.types.ts`**

Em `PlanoRegistro`, trocar `/** Uma entrada por planta; detalhes/obs. e fotos vão no primeiro cuidado dela. */` por `/** Uma entrada por planta; detalhes/obs. vão em todos os cuidados dela e as fotos no primeiro. */`

- [ ] **Step 4: Ajustar plantas com o nome da tarefa** (`web/src/pages/ConcluirPage.tsx`, etapa `ajustar`)

Trocar

```tsx
            subtitulo: t.planta?.identificador && t.planta?.nome ? t.planta.nome : undefined,
```

por

```tsx
            subtitulo:
              [t.planta?.identificador && t.planta?.nome ? t.planta.nome : null, t.atividade?.nome].filter(Boolean).join(' · ') ||
              undefined,
```

- [ ] **Step 5: Testes e build**

Run: `cd server && npx tsc --noEmit -p tsconfig.json && npm test` e `cd web && npm run build`
Expected: tsc sem erros; todos os testes do server passam; build do web ok.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/agenda/repositories/prisma-conclusao.repository.ts server/src/modules/agenda/agenda.types.ts web/src/pages/ConcluirPage.tsx
git commit -m "feat: registro grava descrição/obs. em todas as tarefas da planta; Ajustar mostra a tarefa"
```

---

### Task 4: Verificação no navegador + docs

**Files:**
- Modify: `CLAUDE.md` (estrutura do web: mencionar o agrupamento)
- Modify: `docs/todo.md` (marcar o item)

- [ ] **Step 1: Subir o ambiente**

`docker restart bonsai_api` (o container não recarrega sozinho) e `cd web && npm run dev` (em background). Conta local `teste.web@bonsai.test` já logada.

- [ ] **Step 2: Montar dados pela API** (javascript na aba, `localStorage.bonsai_token`)

Criar uma planta de teste; `POST /api/agendas/registrar` com duas atividades e `detalhes` + `observacaoFutura`; criar duas pendentes (atividades diferentes) e concluí-las por `POST /api/agendas/concluir` com `itens[].detalhes` diferentes por tarefa.

- [ ] **Step 3: Conferir as telas** (iframe de 390px para ver mobile)

- Página da planta: carrossel com um card por dia, título "A + B", tocar abre a 1ª tarefa.
- `/plantas/:id/historico`: nomes tocáveis, notas sem rótulo no registro, com rótulo no concluir com textos por tarefa.
- `/tarefas/:id` concluída: carrossel com "1 de 2"; deslizar troca o título e a URL; abrir direto a URL da 2ª tarefa abre no 2º painel (Review Focus); card do dia em destaque "Agora"; botão de notas abre a folha.
- Concluir com 2 tarefas da mesma planta → Ajustar plantas mostra "… · Atividade".

- [ ] **Step 4: Limpar** — apagar a planta de teste.

- [ ] **Step 5: Docs**

`CLAUDE.md`: na lista de `src/pages/*`/estrutura web, acrescentar após a menção de `TarefaPage`: "histórico agrupa por planta + dia (`src/lib/linhaDoTempo.ts`: item `cuidado`, `notasDoCuidado`, `tarefasDoDia`; carrossel `components/CarrosselDoDia.tsx` na tarefa concluída)". `docs/todo.md`: marcar `- [x]` no item "ao registrar duas tarefas…" com `  > Feito em 2026-10-08: …`.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs/todo.md
git commit -m "docs: card único no histórico"
```
