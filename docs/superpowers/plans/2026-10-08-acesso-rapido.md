# Acesso rápido na Bancada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atalhos configuráveis na Bancada que registram um cuidado em várias plantas (filtradas por grupo e/ou espécie) com 2 toques.

**Architecture:** Atalhos salvos como JSON na preferência `atalhos_bancada` (API genérica existente, sem mudança no backend). Regras puras em `web/src/lib/atalhos.ts`; três componentes em `web/src/components/bancada/` (faixa, confirmação, edição); o registro usa `POST /agendas/registrar` já existente.

**Tech Stack:** React 19 + Vite + TypeScript, TanStack Query, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-10-08-acesso-rapido-design.md`

## Global Constraints

- Idioma de código, UI e docs: português.
- Sem mudança em `server/`.
- Preferência: chave `atalhos_bancada`, valor `JSON.stringify(Atalho[])`.
- Janela de conclusão do atalho: `JANELA_ATALHO_DIAS = 7` (atrasadas ou vencendo em até 7 dias); a do Registrar continua 90.
- Lista vazia de grupos/espécies = sem filtro; as duas vazias = todas as plantas.
- Layout cabe em 390px de largura.
- Comandos web: `cd web && npm test`, `npm run lint`, `npm run build`.

## Review Focus

- Filtro só com espécie que não está mais na coleção → o atalho pega **0 plantas** (nunca vira "todas"); a edição ainda mostra o chip marcado para poder desmarcar. Teste em Task 1 (`plantasDoAtalho` e `opcoesEspecies`).
- Desmarcar uma planta na confirmação → a contagem de tarefas a concluir cai junto (só planta marcada + atividade do atalho + janela 7 dias). Teste em Task 1 (`tarefasDoAtalho`).
- Duas edições seguidas de atalhos → a segunda parte da lista já com a primeira (lê do cache atualizado com `setQueryData`), não de um valor velho. Coberto por `salvarAtalho`/`apagarAtalho` puros + `useSalvarAtalhos` lendo o cache (Task 2).
- Atalho com atividade apagada → só as válidas contam; sem nenhuma válida, o card fica esmaecido ("Atividade removida") e abre a edição. Teste em Task 1 (`atividadesValidas`); visual na Task 4.
- Preferência corrompida/manual (JSON quebrado, grupo inexistente, item sem id) → ignorada sem quebrar a Bancada. Teste em Task 1 (`lerAtalhos`).

---

### Task 1: Regras puras dos atalhos

**Files:**
- Create: `web/src/lib/atalhos.ts`
- Create: `web/src/lib/atalhos.test.ts`
- Modify: `web/src/lib/cuidados.ts` (`candidatasReconciliacao` ganha `janelaDias`)
- Modify: `web/src/types.ts` (`Preferencias.atalhos_bancada?: string`)

**Interfaces:**
- Produces:
  - `CHAVE_ATALHOS = 'atalhos_bancada'`, `JANELA_ATALHO_DIAS = 7`
  - `interface Atalho { id: string; atividadeIds: string[]; grupos: GrupoPlanta[]; especieIds: string[] }`
  - `lerAtalhos(texto: string | undefined): Atalho[]`
  - `plantasDoAtalho(atalho: Atalho, plantas: Planta[]): Planta[]`
  - `atividadesValidas(atalho: Atalho, atividades: Atividade[]): Atividade[]`
  - `rotuloAlvo(atalho: Atalho, nomeEspecie: (id: string) => string): string`
  - `tarefasDoAtalho(agendas: Agenda[], plantaIds: string[], atividadeIds: string[]): Agenda[]`
  - `opcoesEspecies(plantas: Planta[], selecionadas: string[], nomeEspecie: (id: string) => string): { id: string; nome: string }[]`
  - `nomesDeEspecies(plantas: Planta[], especies: Especie[]): (id: string) => string`
  - `salvarAtalho(lista: Atalho[], atalho: Atalho): Atalho[]`, `apagarAtalho(lista: Atalho[], id: string): Atalho[]`
  - `candidatasReconciliacao(agendas, cuidados, janelaDias = JANELA_RECONCILIACAO_DIAS)`

- [ ] **Step 1: Escrever os testes**

`web/src/lib/atalhos.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Agenda, Atividade, Especie, Planta } from '@/types';
import {
  apagarAtalho,
  atividadesValidas,
  lerAtalhos,
  nomesDeEspecies,
  opcoesEspecies,
  plantasDoAtalho,
  rotuloAlvo,
  salvarAtalho,
  tarefasDoAtalho,
  type Atalho,
} from './atalhos';

const planta = (id: string, identificador: number, extra: Partial<Planta> = {}) =>
  ({ id, identificador, grupo: null, especieId: null, especie: null, ...extra }) as Planta;
const atalho = (extra: Partial<Atalho> = {}): Atalho => ({ id: 'x', atividadeIds: ['adub'], grupos: [], especieIds: [], ...extra });
const diasDaqui = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const agenda = (id: string, plantaId: string, atividadeId: string, dias: number, status = 'PENDENTE') =>
  ({ id, plantaId, atividadeId, dataAgendada: diasDaqui(dias), status }) as Agenda;

const plantas = [
  planta('p3', 3, { grupo: 'PRE_TRANSPLANTE', especieId: 'azaleia' }),
  planta('p1', 1, { grupo: 'RECEM_TRANSPLANTADA', especieId: 'pinheiro' }),
  planta('p2', 2, { especieId: 'azaleia' }),
  planta('p4', 4),
];

describe('lerAtalhos', () => {
  it('lista salva como JSON', () => {
    const a = atalho({ grupos: ['DEBILITADA'], especieIds: ['e1'] });
    expect(lerAtalhos(JSON.stringify([a]))).toEqual([a]);
  });

  it('sem preferência ou JSON quebrado: nenhum', () => {
    expect(lerAtalhos(undefined)).toEqual([]);
    expect(lerAtalhos('{oops')).toEqual([]);
    expect(lerAtalhos('{"a":1}')).toEqual([]);
  });

  it('descarta item sem id, grupos inexistentes e valores que não são texto', () => {
    const texto = JSON.stringify([
      { atividadeIds: ['a'] },
      null,
      { id: 'ok', atividadeIds: ['a', 2], grupos: ['DEBILITADA', 'INVENTADO'], especieIds: 'e1' },
    ]);
    expect(lerAtalhos(texto)).toEqual([{ id: 'ok', atividadeIds: ['a'], grupos: ['DEBILITADA'], especieIds: [] }]);
  });
});

describe('plantasDoAtalho', () => {
  it('sem filtros: todas, por número', () => {
    expect(plantasDoAtalho(atalho(), plantas).map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('grupos: qualquer um dos escolhidos; sem grupo fica fora', () => {
    const a = atalho({ grupos: ['PRE_TRANSPLANTE', 'RECEM_TRANSPLANTADA'] });
    expect(plantasDoAtalho(a, plantas).map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('espécies: qualquer uma das escolhidas; sem espécie fica fora', () => {
    expect(plantasDoAtalho(atalho({ especieIds: ['azaleia'] }), plantas).map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('grupos e espécies juntos: precisa passar nos dois', () => {
    const a = atalho({ grupos: ['PRE_TRANSPLANTE', 'RECEM_TRANSPLANTADA'], especieIds: ['azaleia'] });
    expect(plantasDoAtalho(a, plantas).map((p) => p.id)).toEqual(['p3']);
  });

  it('só espécie que ninguém mais tem: nenhuma planta (não vira "todas")', () => {
    expect(plantasDoAtalho(atalho({ especieIds: ['sumiu'] }), plantas)).toEqual([]);
  });
});

describe('atividadesValidas', () => {
  const atividades = [{ id: 'adub', nome: 'Adubação' }, { id: 'rega', nome: 'Rega' }] as Atividade[];

  it('na ordem do atalho, ignorando as apagadas', () => {
    const a = atalho({ atividadeIds: ['rega', 'apagada', 'adub'] });
    expect(atividadesValidas(a, atividades).map((x) => x.id)).toEqual(['rega', 'adub']);
  });

  it('nenhuma válida: lista vazia', () => {
    expect(atividadesValidas(atalho({ atividadeIds: ['apagada'] }), atividades)).toEqual([]);
  });
});

describe('rotuloAlvo', () => {
  const nome = (id: string) => ({ azaleia: 'Azaleia', pinheiro: 'Pinheiro negro' })[id] ?? '?';

  it('sem filtros: Todas', () => {
    expect(rotuloAlvo(atalho(), nome)).toBe('Todas');
  });

  it('grupos na ordem fixa, unidos por +', () => {
    expect(rotuloAlvo(atalho({ grupos: ['RECEM_TRANSPLANTADA', 'PRE_TRANSPLANTE'] }), nome)).toBe(
      'Pré-transplante + Recém transplantada',
    );
  });

  it('grupos · espécies', () => {
    expect(rotuloAlvo(atalho({ grupos: ['PRE_TRANSPLANTE'], especieIds: ['azaleia', 'pinheiro'] }), nome)).toBe(
      'Pré-transplante · Azaleia + Pinheiro negro',
    );
  });
});

describe('tarefasDoAtalho', () => {
  const agendas = [
    agenda('atrasada', 'p1', 'adub', -30),
    agenda('em7', 'p1', 'adub', 7),
    agenda('em8', 'p1', 'adub', 8),
    agenda('outraAtividade', 'p1', 'rega', 0),
    agenda('outraPlanta', 'p2', 'adub', 0),
    agenda('feita', 'p1', 'adub', -1, 'CONCLUIDO'),
  ];

  it('pendentes das plantas e atividades, atrasadas ou em até 7 dias, mais antigas primeiro', () => {
    expect(tarefasDoAtalho(agendas, ['p1'], ['adub']).map((a) => a.id)).toEqual(['atrasada', 'em7']);
  });

  it('planta desmarcada não entra', () => {
    expect(tarefasDoAtalho(agendas, [], ['adub'])).toEqual([]);
  });
});

describe('espécies', () => {
  const especies = [{ id: 'pinheiro', nomeComum: 'Pinheiro negro', nomeCientifico: 'Pinus thunbergii' }] as Especie[];
  const comEspecie = [
    planta('a', 1, { especieId: 'azaleia', especie: { nomeComum: 'Azaleia', nomeCientifico: null } }),
    planta('b', 2, { especieId: 'pinheiro', especie: { nomeComum: 'Pinheiro negro', nomeCientifico: null } }),
    planta('c', 3),
  ];

  it('nome pela coleção, depois pelo catálogo, senão desconhecida', () => {
    const nome = nomesDeEspecies(comEspecie.slice(0, 1), especies);
    expect(nome('azaleia')).toBe('Azaleia');
    expect(nome('pinheiro')).toBe('Pinheiro negro');
    expect(nome('sumiu')).toBe('Espécie desconhecida');
  });

  it('opções: espécies da coleção + as já marcadas, em ordem alfabética', () => {
    const nome = nomesDeEspecies(comEspecie, especies);
    expect(opcoesEspecies(comEspecie, ['sumiu'], nome)).toEqual([
      { id: 'azaleia', nome: 'Azaleia' },
      { id: 'sumiu', nome: 'Espécie desconhecida' },
      { id: 'pinheiro', nome: 'Pinheiro negro' },
    ]);
  });
});

describe('salvarAtalho / apagarAtalho', () => {
  const a = atalho({ id: 'a' });
  const b = atalho({ id: 'b' });

  it('novo entra no fim; existente é trocado no lugar', () => {
    expect(salvarAtalho([a], b)).toEqual([a, b]);
    const a2 = atalho({ id: 'a', atividadeIds: ['rega'] });
    expect(salvarAtalho([a, b], a2)).toEqual([a2, b]);
  });

  it('apaga pelo id', () => {
    expect(apagarAtalho([a, b], 'a')).toEqual([b]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd web && npx vitest run src/lib/atalhos.test.ts`
Expected: FAIL (módulo `./atalhos` não existe).

- [ ] **Step 3: Janela opcional em `candidatasReconciliacao`**

Em `web/src/lib/cuidados.ts`:
```ts
/** Pendentes que um registro pode concluir: mesma planta e atividade, dentro da janela; mais antigas primeiro. */
export function candidatasReconciliacao(
  agendas: Agenda[],
  cuidados: { plantaId: string; atividadeIds: string[] }[],
  janelaDias = JANELA_RECONCILIACAO_DIAS,
): Agenda[] {
  ...
        diasAte(a.dataAgendada) <= janelaDias,
```

- [ ] **Step 4: Implementar `web/src/lib/atalhos.ts`**

```ts
import { GRUPOS_PLANTA, type Agenda, type Atividade, type Especie, type GrupoPlanta, type Planta } from '@/types';
import { candidatasReconciliacao } from './cuidados';
import { especieNome } from './format';

/** Preferência `atalhos_bancada`: atalhos do Acesso rápido da Bancada, salvos como JSON. */
export const CHAVE_ATALHOS = 'atalhos_bancada';
/** O atalho conclui as pendentes atrasadas ou que vencem em até 7 dias (as mais distantes são o próximo ciclo). */
export const JANELA_ATALHO_DIAS = 7;

/** Atalho: registrar estas atividades nas plantas destes grupos e/ou espécies (lista vazia = sem filtro). */
export interface Atalho {
  id: string;
  atividadeIds: string[];
  grupos: GrupoPlanta[];
  especieIds: string[];
}

const GRUPOS = new Set<string>(GRUPOS_PLANTA.map((g) => g.value));
const textos = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Atalhos salvos; valor ausente ou quebrado → nenhum; itens sem id ou valores estranhos são descartados. */
export function lerAtalhos(texto: string | undefined): Atalho[] {
  let valor: unknown;
  try {
    valor = JSON.parse(texto || '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item): Atalho[] => {
    if (!item || typeof item !== 'object') return [];
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string' || !o.id) return [];
    return [
      {
        id: o.id,
        atividadeIds: textos(o.atividadeIds),
        grupos: textos(o.grupos).filter((g): g is GrupoPlanta => GRUPOS.has(g)),
        especieIds: textos(o.especieIds),
      },
    ];
  });
}

/** Plantas do atalho agora: em algum dos grupos E de alguma das espécies (filtro vazio não filtra); por número. */
export function plantasDoAtalho(atalho: Atalho, plantas: Planta[]): Planta[] {
  return plantas
    .filter(
      (p) =>
        (!atalho.grupos.length || (!!p.grupo && atalho.grupos.includes(p.grupo))) &&
        (!atalho.especieIds.length || (!!p.especieId && atalho.especieIds.includes(p.especieId))),
    )
    .sort((a, b) => a.identificador - b.identificador);
}

/** Atividades do atalho que ainda existem, na ordem do atalho. Nenhuma → atalho inválido. */
export function atividadesValidas(atalho: Atalho, atividades: Atividade[]): Atividade[] {
  return atalho.atividadeIds.flatMap((id) => atividades.filter((a) => a.id === id));
}

/** "Todas" · "Pré-transplante + Recém transplantada" · "Pré-transplante · Azaleia + Pinheiro negro". */
export function rotuloAlvo(atalho: Atalho, nomeEspecie: (id: string) => string): string {
  const grupos = GRUPOS_PLANTA.filter((g) => atalho.grupos.includes(g.value))
    .map((g) => g.label)
    .join(' + ');
  const especies = atalho.especieIds.map(nomeEspecie).join(' + ');
  return [grupos, especies].filter(Boolean).join(' · ') || 'Todas';
}

/** Pendentes que o atalho conclui: plantas marcadas × atividades, atrasadas ou em até 7 dias. */
export function tarefasDoAtalho(agendas: Agenda[], plantaIds: string[], atividadeIds: string[]): Agenda[] {
  return candidatasReconciliacao(
    agendas,
    plantaIds.map((plantaId) => ({ plantaId, atividadeIds })),
    JANELA_ATALHO_DIAS,
  );
}

/** Nome da espécie pelo id: primeiro o que vem nas plantas, depois o catálogo. */
export function nomesDeEspecies(plantas: Planta[], especies: Especie[]): (id: string) => string {
  const mapa = new Map<string, string>();
  for (const e of especies) mapa.set(e.id, especieNome(e));
  for (const p of plantas) if (p.especieId && p.especie) mapa.set(p.especieId, especieNome(p.especie));
  return (id) => mapa.get(id) ?? especieNome(null);
}

/** Chips de espécie: as da coleção mais as já marcadas (para poder desmarcar), em ordem alfabética. */
export function opcoesEspecies(plantas: Planta[], selecionadas: string[], nomeEspecie: (id: string) => string) {
  const ids = new Set([...plantas.flatMap((p) => (p.especieId ? [p.especieId] : [])), ...selecionadas]);
  return [...ids].map((id) => ({ id, nome: nomeEspecie(id) })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Atalho novo vai para o fim; existente é trocado no mesmo lugar. */
export const salvarAtalho = (lista: Atalho[], atalho: Atalho) =>
  lista.some((a) => a.id === atalho.id) ? lista.map((a) => (a.id === atalho.id ? atalho : a)) : [...lista, atalho];

export const apagarAtalho = (lista: Atalho[], id: string) => lista.filter((a) => a.id !== id);
```

Em `web/src/types.ts`, em `Preferencias` após `mover_recem_transplantada?: string;`: `atalhos_bancada?: string;`

- [ ] **Step 5: Rodar e ver passar**

Run: `cd web && npm test`
Expected: PASS (todos, incluindo os antigos de `cuidados`/`bancada`).

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/atalhos.ts web/src/lib/atalhos.test.ts web/src/lib/cuidados.ts web/src/types.ts
git commit -m "feat(web): regras dos atalhos do acesso rápido"
```

---

### Task 2: Hooks, grade de plantas compartilhada e edição de atalho

**Files:**
- Modify: `web/src/lib/queries.ts` (`useAtalhos`, `useSalvarAtalhos`)
- Modify: `web/src/components/care/PlantasPicker.tsx` (extrai `GradePlantas`)
- Create: `web/src/components/bancada/EditarAtalho.tsx`

**Interfaces:**
- Consumes: Task 1 (`Atalho`, `lerAtalhos`, `CHAVE_ATALHOS`, `salvarAtalho`, `apagarAtalho`, `plantasDoAtalho`, `opcoesEspecies`, `nomesDeEspecies`).
- Produces:
  - `useAtalhos(): Atalho[]`
  - `useSalvarAtalhos(): (mudar: (atuais: Atalho[]) => Atalho[]) => Promise<void>`
  - `GradePlantas({ plantas, marcada, onAlternar }: { plantas: Planta[]; marcada: (id: string) => boolean; onAlternar: (id: string) => void })`
  - `EditarAtalho({ open, atalho, onClose }: { open: boolean; atalho?: Atalho; onClose: () => void })` — `atalho` ausente = criar.

- [ ] **Step 1: Hooks em `queries.ts`**

Importar `CHAVE_ATALHOS, lerAtalhos, type Atalho` de `./atalhos` e `type Preferencias` de `@/types`. Após `useLembrarMover`:
```ts
/** Atalhos do Acesso rápido (preferência `atalhos_bancada`). */
export function useAtalhos() {
  const prefs = usePreferencias();
  return lerAtalhos(prefs.data?.atalhos_bancada);
}

/** Grava a lista de atalhos a partir da última do cache (duas edições seguidas não se perdem). */
export function useSalvarAtalhos() {
  const queryClient = useQueryClient();
  return async (mudar: (atuais: Atalho[]) => Atalho[]) => {
    const atuais = lerAtalhos(queryClient.getQueryData<Preferencias>(keys.preferencias)?.atalhos_bancada);
    const valor = JSON.stringify(mudar(atuais));
    await preferenciasApi.set(CHAVE_ATALHOS, valor);
    queryClient.setQueryData<Preferencias>(keys.preferencias, (p) => ({ ...p, [CHAVE_ATALHOS]: valor }));
    await queryClient.invalidateQueries({ queryKey: keys.preferencias });
  };
}
```

- [ ] **Step 2: Extrair `GradePlantas` de `PlantasLista`**

Em `PlantasPicker.tsx`, mover o bloco `{/* Grade de fotos … */}<div className="grid …">…</div>` para:
```tsx
/** Grade de fotos com ✓ no canto: quem escolhe reconhece a planta pela foto. */
export function GradePlantas({
  plantas,
  marcada,
  onAlternar,
}: {
  plantas: Planta[];
  marcada: (id: string) => boolean;
  onAlternar: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4">
      {plantas.map((p) => {
        const sim = marcada(p.id);
        return ( /* mesmo <button> de hoje, com `sim` no lugar de `marcada` e onClick={() => onAlternar(p.id)} */ );
      })}
    </div>
  );
}
```
(o JSX do botão é copiado sem alteração de classes). Em `PlantasLista`: `<GradePlantas plantas={visiveis} marcada={(id) => sel.has(id)} onAlternar={alternar} />`.

- [ ] **Step 3: `EditarAtalho.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { apagarAtalho, nomesDeEspecies, opcoesEspecies, plantasDoAtalho, salvarAtalho, type Atalho } from '@/lib/atalhos';
import { useEspecies, usePlantas, useSalvarAtalhos } from '@/lib/queries';
import { GRUPOS_PLANTA, type GrupoPlanta } from '@/types';

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

/** Criar (sem `atalho`) ou editar um atalho: atividades, grupos, espécies e prévia de quantas plantas pega. */
export function EditarAtalho({ open, atalho, onClose }: { open: boolean; atalho?: Atalho; onClose: () => void }) {
  const toast = useToast();
  const plantas = usePlantas();
  const especies = useEspecies();
  const salvarLista = useSalvarAtalhos();
  const [atividadeIds, setAtividadeIds] = useState(atalho?.atividadeIds ?? []);
  const [grupos, setGrupos] = useState<GrupoPlanta[]>(atalho?.grupos ?? []);
  const [especieIds, setEspecieIds] = useState(atalho?.especieIds ?? []);
  const [salvando, setSalvando] = useState(false);
  const [apagar, setApagar] = useState(false);

  const todas = plantas.data ?? [];
  const nomeEspecie = nomesDeEspecies(todas, especies.data ?? []);
  const rascunho: Atalho = { id: atalho?.id ?? crypto.randomUUID(), atividadeIds, grupos, especieIds };
  const quantas = plantasDoAtalho(rascunho, todas).length;

  async function gravar(mudar: (l: Atalho[]) => Atalho[], msg: string) {
    setSalvando(true);
    try {
      await salvarLista(mudar);
      toast(msg);
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  return (
    <>
      <Sheet
        open={open && !apagar}
        onClose={onClose}
        title={atalho ? 'Editar atalho' : 'Novo atalho'}
        footer={
          <>
            <Button block disabled={!atividadeIds.length} loading={salvando} onClick={() => gravar((l) => salvarAtalho(l, rascunho), 'Atalho salvo')}>
              Salvar
            </Button>
            {atalho && (
              <Button block variant="ghost" className="text-danger" onClick={() => setApagar(true)}>
                Apagar atalho
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-5">
          <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} label="O que registrar" />
          <fieldset>
            <legend className="label">
              Grupos <span className="font-normal text-muted">· nenhum = todos</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {GRUPOS_PLANTA.map((g) => (
                <button key={g.value} type="button" className={`chip ${grupos.includes(g.value) ? 'chip-active' : ''}`}
                  aria-pressed={grupos.includes(g.value)} onClick={() => setGrupos((l) => alternar(l, g.value))}>
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">
              Espécies <span className="font-normal text-muted">· nenhuma = todas</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {opcoesEspecies(todas, especieIds, nomeEspecie).map((e) => (
                <button key={e.id} type="button" className={`chip ${especieIds.includes(e.id) ? 'chip-active' : ''}`}
                  aria-pressed={especieIds.includes(e.id)} onClick={() => setEspecieIds((l) => alternar(l, e.id))}>
                  {e.nome}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-sm font-medium text-primary">
            Vale para {quantas === 1 ? '1 planta' : `${quantas} plantas`} agora
          </p>
        </div>
      </Sheet>
      <ConfirmSheet
        open={open && apagar}
        onClose={() => setApagar(false)}
        onConfirm={() => atalho && gravar((l) => apagarAtalho(l, atalho.id), 'Atalho apagado')}
        title="Apagar atalho?"
        text="As plantas e o histórico não mudam."
        confirmLabel="Apagar"
        loading={salvando}
      />
    </>
  );
}
```
Nota: o `id` do rascunho é gerado uma vez por montagem — usar `const [novoId] = useState(() => crypto.randomUUID())` e `id: atalho?.id ?? novoId`.

- [ ] **Step 4: Verificar**

Run: `cd web && npm test && npm run lint && npx tsc -b`
Expected: PASS, sem erros (o componente ainda não está montado em lugar nenhum).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/queries.ts web/src/components/care/PlantasPicker.tsx web/src/components/bancada/EditarAtalho.tsx
git commit -m "feat(web): criar e editar atalhos do acesso rápido"
```

---

### Task 3: Confirmação e faixa na Bancada

**Files:**
- Create: `web/src/components/bancada/ConfirmarAtalho.tsx`
- Create: `web/src/components/bancada/AcessoRapido.tsx`
- Modify: `web/src/pages/BancadaPage.tsx`

**Interfaces:**
- Consumes: Task 1 (`plantasDoAtalho`, `atividadesValidas`, `rotuloAlvo`, `tarefasDoAtalho`, `nomesDeEspecies`), Task 2 (`useAtalhos`, `GradePlantas`, `EditarAtalho`), `agendasApi.registrar`, `useMoverRecemTransplantada`, `ATIVIDADE_TRANSPLANTE`.
- Produces: `AcessoRapido()` (sem props), `ConfirmarAtalho({ atalho, onClose, onEditar })`.

- [ ] **Step 1: `ConfirmarAtalho.tsx`**

```tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { GradePlantas } from '@/components/care/PlantasPicker';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { atividadesValidas, JANELA_ATALHO_DIAS, nomesDeEspecies, plantasDoAtalho, rotuloAlvo, tarefasDoAtalho, type Atalho } from '@/lib/atalhos';
import { agendasApi } from '@/lib/endpoints';
import { keys, useAgendas, useAtividades, useEspecies, useMoverRecemTransplantada, usePlantas } from '@/lib/queries';
import { ATIVIDADE_TRANSPLANTE } from '@/types';

/** Confirmação do atalho: plantas do alvo marcadas (toque desmarca), tarefas próximas a concluir e Registrar. */
export function ConfirmarAtalho({ atalho, onClose, onEditar }: { atalho: Atalho; onClose: () => void; onEditar: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const agendas = useAgendas();
  const atividades = useAtividades();
  const especies = useEspecies();
  const mover = useMoverRecemTransplantada();
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);
  const [concluir, setConcluir] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const alvo = plantasDoAtalho(atalho, plantas.data ?? []);
  const marcadas = alvo.filter((p) => !desmarcadas.includes(p.id));
  const validas = atividadesValidas(atalho, atividades.data ?? []);
  const ids = validas.map((a) => a.id);
  const tarefas = tarefasDoAtalho(agendas.data ?? [], marcadas.map((p) => p.id), ids);
  const comTransplante = validas.some((a) => a.nome === ATIVIDADE_TRANSPLANTE);
  const n = marcadas.length;

  async function registrar() {
    setSalvando(true);
    const concluirIds = concluir ? tarefas.map((a) => a.id) : [];
    try {
      await agendasApi.registrar({
        data: new Date().toISOString(),
        plantas: marcadas.map((p) => ({ plantaId: p.id, atividadeIds: ids })),
        concluirAgendaIds: concluirIds.length ? concluirIds : undefined,
        moverRecemTransplantada: comTransplante && mover ? true : undefined,
      });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      const k = concluirIds.length;
      toast(`Cuidado registrado 🌿${n > 1 ? ` em ${n} plantas` : ''}${k ? ` · ${k === 1 ? '1 tarefa concluída' : `${k} tarefas concluídas`}` : ''}`);
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      setSalvando(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={validas.map((a) => a.nome).join(' + ')}
      footer={
        <>
          <Button block disabled={!n} loading={salvando} onClick={registrar}>
            {n ? `Registrar em ${n === 1 ? '1 planta' : `${n} plantas`}` : 'Registrar'}
          </Button>
          <button type="button" onClick={onEditar} className="block w-full text-center text-sm font-medium text-primary">
            Editar atalho
          </button>
        </>
      }
    >
      <p className="-mt-1 mb-3 text-sm text-muted">{rotuloAlvo(atalho, nomesDeEspecies(plantas.data ?? [], especies.data ?? []))} · hoje</p>
      {alvo.length ? (
        <GradePlantas
          plantas={alvo}
          marcada={(id) => !desmarcadas.includes(id)}
          onAlternar={(id) => setDesmarcadas((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))}
        />
      ) : (
        <p className="py-6 text-center text-sm text-muted">Nenhuma planta neste atalho agora.</p>
      )}
      {tarefas.length > 0 && (
        <label className="card mt-4 flex cursor-pointer items-center gap-3 p-3">
          <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={concluir} onChange={(e) => setConcluir(e.target.checked)} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              Também concluir {tarefas.length === 1 ? '1 tarefa agendada' : `${tarefas.length} tarefas agendadas`}
            </span>
            <span className="block text-xs text-muted">Atrasadas ou que vencem em até {JANELA_ATALHO_DIAS} dias</span>
          </span>
        </label>
      )}
    </Sheet>
  );
}
```

- [ ] **Step 2: `AcessoRapido.tsx`**

```tsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import { ConfirmarAtalho } from './ConfirmarAtalho';
import { EditarAtalho } from './EditarAtalho';
import { atividadesValidas, nomesDeEspecies, plantasDoAtalho, rotuloAlvo, type Atalho } from '@/lib/atalhos';
import { useAtalhos, useAtividades, useEspecies, usePlantas } from '@/lib/queries';

/** Faixa de atalhos da Bancada: tocar confirma e registra; "＋" cria. Atalho sem atividade válida abre a edição. */
export function AcessoRapido() {
  const atalhos = useAtalhos();
  const plantas = usePlantas();
  const atividades = useAtividades();
  const especies = useEspecies();
  const [confirmar, setConfirmar] = useState<Atalho | null>(null);
  const [editar, setEditar] = useState<{ atalho?: Atalho } | null>(null);

  const todas = plantas.data ?? [];
  const nomeEspecie = nomesDeEspecies(todas, especies.data ?? []);
  const visiveis = atalhos.map((a) => ({
    atalho: a,
    validas: atividadesValidas(a, atividades.data ?? []),
    n: plantasDoAtalho(a, todas).length,
  }));

  return (
    <section className="pb-3">
      <h2 className="label">Acesso rápido</h2>
      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {visiveis.map(({ atalho, validas, n }) => (
          <button key={atalho.id} type="button"
            onClick={() => (validas.length ? setConfirmar(atalho) : setEditar({ atalho }))}
            className={`card flex w-40 shrink-0 snap-start flex-col gap-1.5 p-3 text-left transition active:scale-[0.97] ${validas.length ? '' : 'opacity-60'}`}>
            <AtividadeIcone nome={validas[0]?.nome ?? ''} className="size-8" size={16} />
            <span className="line-clamp-2 text-sm font-semibold leading-tight">
              {validas.length ? validas.map((v) => v.nome).join(' + ') : 'Atividade removida'}
            </span>
            <span className="truncate text-xs text-muted">{rotuloAlvo(atalho, nomeEspecie)}</span>
            <span className="text-xs font-medium text-primary">{n === 1 ? '1 planta' : `${n} plantas`}</span>
          </button>
        ))}
        <button type="button" onClick={() => setEditar({})}
          className={`flex shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line p-3 text-center text-sm font-semibold text-primary transition active:scale-[0.97] ${visiveis.length ? 'w-24' : 'w-full'}`}>
          <Plus size={20} />
          {visiveis.length ? 'Atalho' : (
            <>
              Criar atalho
              <span className="text-xs font-normal text-muted">Registre um cuidado em várias plantas com 2 toques</span>
            </>
          )}
        </button>
      </div>
      {confirmar && (
        <ConfirmarAtalho key={confirmar.id} atalho={confirmar} onClose={() => setConfirmar(null)}
          onEditar={() => { setEditar({ atalho: confirmar }); setConfirmar(null); }} />
      )}
      {editar && <EditarAtalho key={editar.atalho?.id ?? 'novo'} open atalho={editar.atalho} onClose={() => setEditar(null)} />}
    </section>
  );
}
```

- [ ] **Step 3: Montar na Bancada**

Em `BancadaPage.tsx`, importar `AcessoRapido` e, logo após `</header>`:
```tsx
{!semPlantas && plantas.data && agendas.data && <AcessoRapido />}
```

- [ ] **Step 4: Verificar**

Run: `cd web && npm test && npm run lint && npm run build`
Expected: PASS, build sem erros.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/bancada/ConfirmarAtalho.tsx web/src/components/bancada/AcessoRapido.tsx web/src/pages/BancadaPage.tsx
git commit -m "feat(web): acesso rápido na Bancada registra cuidado em várias plantas"
```

---

### Task 4: Teste no navegador e documentação

**Files:**
- Modify: `docs/todo.md`, `CLAUDE.md`

- [ ] **Step 1: Navegador** (dev local `cd web && npm run dev`, API local; ver memória de testes locais — iframe 390px). Roteiro:
  1. Bancada sem atalhos → card "Criar atalho".
  2. Criar "Adubação · Pré-transplante + Recém transplantada" → prévia conta certo; card aparece com N plantas.
  3. Tocar no card → grade com todas marcadas; desmarcar 1 → botão e contagem de tarefas atualizam.
  4. Registrar → toast; a pendente próxima some da Bancada; histórico da planta mostra o cuidado.
  5. Editar atalho → mudar alvo → salvar; Apagar → some da faixa.
  6. Layout a 390px sem rolagem horizontal da página.
- [ ] **Step 2: Docs** — `docs/todo.md`: marcar o item como `[x]` com "> Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-acesso-rapido-design.md): …". `CLAUDE.md`: na linha Structure, após a menção à `BancadaPage`, acrescentar "; faixa Acesso rápido (`components/bancada/AcessoRapido.tsx`): atalhos na preferência `atalhos_bancada` (atividades + grupos/espécies, regras em `src/lib/atalhos.ts`) registram via `/agendas/registrar` e concluem pendentes atrasadas ou ≤ 7 dias".
- [ ] **Step 3: Commit**

```bash
git add docs/todo.md CLAUDE.md
git commit -m "docs: acesso rápido na Bancada"
```
