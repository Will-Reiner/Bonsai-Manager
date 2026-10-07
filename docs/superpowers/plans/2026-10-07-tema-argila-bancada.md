# Tema Argila + nova Bancada — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o visual do app web para o tema "Argila clara" (cores + Newsreader/Figtree) e refazer a Bancada com faixas de grupo em degradê, tarefas por tipo, atrasadas primeiro e visualização lista/fotos.

**Architecture:** O tema vive nos tokens Tailwind v4 de `web/src/index.css` (`@theme`), então trocar os tokens muda o app inteiro; usos soltos de `bg-white` em superfícies passam para `bg-card`. As cores de grupo viram dados (`{ cor, texto }`) e a faixa em degradê é uma classe CSS (`.faixa`/`.selo`) alimentada pela variável `--faixa`. A lógica da Bancada (filtro por período, blocos, ordenação, contagens) fica em funções puras em `web/src/lib/bancada.ts`, testadas com Vitest; a página só renderiza.

**Tech Stack:** React 19, Vite 8, Tailwind v4, TypeScript 6, lucide-react, Vitest (novo, só em `web/`).

**Spec:** `docs/superpowers/specs/2026-10-07-tema-argila-bancada-design.md`

## Global Constraints

- Código, comentários e textos de UI em **português**; seguir o estilo dos arquivos vizinhos (comentários curtos `/** … */`, nomes em português).
- Cores (verbatim da spec): bg `#EFECEC`, card `#F8F6F5`, ink `#2B1F17`, muted `#7A6A5E`, line `#DED3CB`, primary `#493628`, primary-dark `#34261C`, primary-light `#E9DDD5`, accent `#AB886D`, accent-light `#D6C0B3`, late `#8B4A2B`, late-light `#E8D6CB`, danger = vermelho atual (`#c0392b`, light `#fbeae8`).
- Grupos: Debilitada `#C0392B`/branco · Recém transplantada `#E0911B`/`#3B2606` · Pré-transplante `#5B6BD6`/branco · Em crescimento `#2F7D3A`/branco · Refinamento `#A9D49B`/`#21451C`. Faixa neutra (areia) `#D6C0B3`/`#2B1F17`.
- Fontes: Newsreader (títulos; `h1` em itálico) + Figtree (resto). Sem Fraunces/Inter.
- Faixas de ponta a ponta, **sem bordas laterais**.
- Preferências da Bancada lembradas via `useEscolha` (`web/src/lib/escolhas.ts`): chaves `bonsai_bancada_periodo`, `bonsai_bancada_agrupar`, `bonsai_bancada_view`.
- Comandos (rodar em `web/`): `npx tsc -b`, `npm run lint` (oxlint; só warnings pré-existentes de `only-export-components` são aceitáveis), `npm test` (criado na Task 2).
- Teste no navegador: local `http://localhost:5173` logado como `teste.web@bonsai.test`; ver mobile trocando a página por um iframe de 390px da rota (`document.documentElement.innerHTML = '<iframe src="/rota" style="width:390px;height:670px;border:0">'`). Dados de teste criados via API com `localStorage.bonsai_token` e apagados no fim.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Tema Argila (tokens, fontes, faixas de grupo)

**Files:**
- Modify: `web/index.html` (meta theme-color, link de fontes)
- Modify: `web/public/manifest.webmanifest` (cores)
- Modify: `web/src/index.css` (tokens, `h1`, `.input`, `.chip`, `.faixa`, `.selo`)
- Modify: `web/src/lib/format.ts` (`GRUPO_CORES` vira dados + `estiloFaixa`)
- Modify: `web/src/components/GrupoBadge.tsx`
- Modify: `web/src/lib/bancada.ts` (`Bloco.cor` vira `TomFaixa | null`)
- Modify: `web/src/pages/BancadaPage.tsx` (só o `<h3>` da faixa, para continuar compilando)
- Modify (`bg-white` de superfície → `bg-card`): `web/src/components/HistoricoPlanta.tsx:38-39`, `web/src/components/Layout.tsx:30`, `web/src/components/NumericKeypad.tsx:52,56,59`, `web/src/components/PhotoInput.tsx:79`, `web/src/components/Preferencias.tsx:22`, `web/src/components/SpeciesPicker.tsx:94`, `web/src/pages/AddPlantPage.tsx:296`, `web/src/pages/AdminPage.tsx:29`, `web/src/pages/ConcluirPage.tsx:334`, `web/src/pages/PlantDetailPage.tsx:255-257`, `web/src/pages/RegistrarPage.tsx:385`

**Interfaces:**
- Produces (em `web/src/lib/format.ts`):
  - `export interface TomFaixa { cor: string; texto: string }`
  - `export const GRUPO_CORES: Record<GrupoPlanta, TomFaixa>`
  - `export const TOM_NEUTRO: TomFaixa` (`{ cor: '#D6C0B3', texto: '#2B1F17' }`)
  - `export const estiloFaixa: (tom: TomFaixa) => CSSProperties` — usar com `className="faixa"` ou `"selo"`.
- Produces (CSS): classes `.faixa` (degradê de faixa larga) e `.selo` (degradê curto para selos), tokens `late`/`late-light` (`bg-late`, `text-late`, `bg-late-light`).

- [ ] **Step 1: Trocar fontes e cores do documento**

Em `web/index.html`, trocar a meta e o link de fontes:

```html
    <meta name="theme-color" content="#EFECEC" />
```

```html
    <link
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,500;1,6..72,600&family=Figtree:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
```

Em `web/public/manifest.webmanifest`: `"background_color": "#EFECEC"` e `"theme_color": "#EFECEC"`.

- [ ] **Step 2: Tokens, títulos e classes base em `web/src/index.css`**

Substituir o bloco `@theme { … }` inteiro por:

```css
/* Tema Argila clara — docs/superpowers/specs/2026-10-07-tema-argila-bancada-design.md */
@theme {
  --color-primary: #493628;
  --color-primary-dark: #34261c;
  --color-primary-light: #e9ddd5;
  --color-accent: #ab886d;
  --color-accent-light: #d6c0b3;
  --color-bg: #efecec;
  --color-card: #f8f6f5;
  --color-ink: #2b1f17;
  --color-muted: #7a6a5e;
  --color-line: #ded3cb;
  --color-danger: #c0392b;
  --color-danger-light: #fbeae8;
  --color-warning: #b7791f;
  --color-warning-light: #fdf3e1;
  --color-late: #8b4a2b;
  --color-late-light: #e8d6cb;

  --font-sans: 'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Newsreader', ui-serif, Georgia, 'Times New Roman', serif;
}
```

No `@layer base`, logo depois da regra `h1, h2, h3 { … }`, acrescentar:

```css
  h1 {
    font-style: italic;
  }
```

No `@layer components`, trocar `bg-white` por `bg-card` em `.input` e `.chip`, e acrescentar no fim do layer:

```css
  /* Faixa de grupo: cor cheia à esquerda, dissolvendo no fundo (cor em --faixa, via estiloFaixa) */
  .faixa {
    background: linear-gradient(
      90deg,
      var(--faixa) 0%,
      var(--faixa) 35%,
      color-mix(in srgb, var(--faixa) 18%, var(--color-bg)) 100%
    );
  }
  .selo {
    background: linear-gradient(90deg, var(--faixa) 40%, color-mix(in srgb, var(--faixa) 30%, var(--color-bg)) 100%);
  }
```

- [ ] **Step 3: Cores de grupo como dados em `web/src/lib/format.ts`**

Trocar a importação de tipos do topo para incluir `CSSProperties`:

```ts
import type { CSSProperties } from 'react';
import type { Agenda, GrupoPlanta, ModoAquisicao, Planta } from '@/types';
```

Substituir o bloco `/** Cores por prioridade … */ export const GRUPO_CORES … };` por:

```ts
/** Cor de faixa/selo e cor do texto sobre ela. */
export interface TomFaixa {
  cor: string;
  texto: string;
}

/** Cores por prioridade: alerta (debilitada, recém transplantada), preparação (pré-transplante), saúde (crescimento, refinamento). */
export const GRUPO_CORES: Record<GrupoPlanta, TomFaixa> = {
  DEBILITADA: { cor: '#C0392B', texto: '#FFFFFF' },
  RECEM_TRANSPLANTADA: { cor: '#E0911B', texto: '#3B2606' },
  PRE_TRANSPLANTE: { cor: '#5B6BD6', texto: '#FFFFFF' },
  EM_CRESCIMENTO: { cor: '#2F7D3A', texto: '#FFFFFF' },
  REFINAMENTO: { cor: '#A9D49B', texto: '#21451C' },
};

/** Faixa neutra (areia): sem grupo, espécie, tarefa. */
export const TOM_NEUTRO: TomFaixa = { cor: '#D6C0B3', texto: '#2B1F17' };

/** Estilo para `className="faixa"` ou `"selo"`. */
export const estiloFaixa = (tom: TomFaixa) => ({ '--faixa': tom.cor, color: tom.texto }) as CSSProperties;
```

- [ ] **Step 4: `GrupoBadge` com selo em degradê**

Conteúdo completo de `web/src/components/GrupoBadge.tsx`:

```tsx
import { GRUPO_CORES, estiloFaixa, grupoLabel } from '@/lib/format';
import type { GrupoPlanta } from '@/types';

/** Selo do grupo da planta; sem grupo não mostra nada. */
export function GrupoBadge({ grupo, className = '' }: { grupo?: GrupoPlanta | null; className?: string }) {
  if (!grupo) return null;
  return (
    <span
      className={`selo inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ${className}`}
      style={estiloFaixa(GRUPO_CORES[grupo])}
    >
      {grupoLabel(grupo)}
    </span>
  );
}
```

- [ ] **Step 5: Manter a Bancada atual compilando**

Em `web/src/lib/bancada.ts`:
- import: `import { GRUPO_CORES, TOM_NEUTRO, agruparPorAtividade, diasAte, especieNome, grupoLabel, type GrupoAtividade, type TomFaixa } from './format';`
- em `interface Bloco`, trocar o campo `cor: string | null;` (e seu comentário) por:

```ts
  /** Cor da faixa do cabeçalho; null = sem cabeçalho */
  cor: TomFaixa | null;
```

- trocar a função `cor` dentro de `blocosDaBancada` por:

```ts
  const cor = (k: string) => (modo === 'grupos' && k ? GRUPO_CORES[k as GrupoPlanta] : TOM_NEUTRO);
```

Em `web/src/pages/BancadaPage.tsx`, no componente `Blocos`, trocar a abertura do `<h3>` por:

```tsx
            <h3
              className="faixa flex items-center justify-between gap-2 px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-wide"
              style={estiloFaixa(b.cor ?? TOM_NEUTRO)}
            >
```

e acrescentar o import `import { TOM_NEUTRO, estiloFaixa } from '@/lib/format';`.

- [ ] **Step 6: Superfícies brancas viram `bg-card`**

Em cada linha listada em **Files** (`bg-white` de superfície), trocar `bg-white` → `bg-card` e `bg-white/95` → `bg-card/95`, `bg-white/60` → `bg-card/60`. **Não** trocar: `bg-white/90` sobre fotos (`PhotoInput.tsx:53,61,69`, `AddPlantPage.tsx:305`, `CollectionPage.tsx` botão de observação), nada em `TriagemFotos.tsx` (tela escura) e nada em `PlantGalleryPage.tsx`. Conferir com:

Run: `grep -rn "bg-white\b\|bg-white/[0-9]" src --include=*.tsx | grep -v "bg-white/90\|bg-white/10\|TriagemFotos\|PlantGalleryPage"`
Expected: só ocorrências em `pages/BancadaPage.tsx`/`components/BenchTaskCard.tsx` (se houver) — nenhuma outra.

- [ ] **Step 7: Verificar tipos e lint**

Run (em `web/`): `npx tsc -b && npm run lint`
Expected: tsc sem erros; lint sem erros novos.

- [ ] **Step 8: Conferir no navegador**

Abrir `http://localhost:5173/colecao` e `/` no iframe de 390px. Esperado: fundo `#EFECEC`, títulos em Newsreader itálico, texto em Figtree, botões marrom `#493628`, selos de grupo com degradê. Se a coleção local não tiver plantas com grupo, criar 2 via API (`POST /api/plantas` com `grupo: 'DEBILITADA'` e `'REFINAMENTO'`) e apagar depois.

- [ ] **Step 9: Commit**

```bash
git add web/index.html web/public/manifest.webmanifest web/src
git commit -m "feat(web): tema Argila clara com Newsreader e Figtree

Novos tokens de cor e fontes no app inteiro, superfícies em bg-card e cores de
grupo por prioridade com faixa em degradê.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lógica da Bancada com Vitest

**Files:**
- Modify: `web/package.json` (devDependency `vitest`, script `test`)
- Modify: `web/vite.config.ts` (bloco `test`)
- Modify: `web/src/lib/bancada.ts` (novas funções, sem remover as antigas ainda)
- Test: `web/src/lib/bancada.test.ts`

**Interfaces:**
- Consumes: `GRUPO_CORES`, `TOM_NEUTRO`, `TomFaixa`, `agruparPorAtividade`, `GrupoAtividade`, `diasAte`, `especieNome`, `grupoLabel` de `@/lib/format` (Task 1).
- Produces (em `web/src/lib/bancada.ts`):
  - `export const ehAtrasada: (a: Agenda) => boolean`
  - `export function pendentesDaBancada(agendas: Agenda[], periodo: Periodo): Agenda[]` — pendentes atrasadas (sempre) + que vencem dentro do período.
  - `export interface BlocoBancada { chave: string; titulo: string; tom: TomFaixa; total: number; atrasadas: number; grupos: GrupoAtividade[] }`
  - `export function montarBancada(agendas: Agenda[], modo: Agrupar, plantas: Map<string, Planta>): BlocoBancada[]`
  - `export type View = 'lista' | 'fotos'` e `export const VIEWS_BANCADA: { value: View; label: string }[]`

- [ ] **Step 1: Instalar Vitest e configurar**

Run (em `web/`): `npm install -D vitest`

Em `web/package.json`, no `scripts`, acrescentar `"test": "vitest run"`.

Conteúdo completo de `web/vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 2: Escrever os testes (falhando)**

Conteúdo completo de `web/src/lib/bancada.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOM_NEUTRO, GRUPO_CORES } from './format';
import { montarBancada, pendentesDaBancada } from './bancada';
import type { Agenda, GrupoPlanta, Planta } from '@/types';

// Hoje fixo: quarta, 7 de outubro de 2026 (meio-dia local)
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
});
afterEach(() => vi.useRealTimers());

const emDias = (d: number) => new Date(2026, 9, 7 + d, 12).toISOString();

let seq = 0;
function ag(plantaId: string, atividade: string, dias: number, status: Agenda['status'] = 'PENDENTE'): Agenda {
  seq += 1;
  return {
    id: `a${seq}`,
    plantaId,
    atividadeId: atividade,
    atividade: { id: atividade, nome: atividade },
    dataAgendada: emDias(dias),
    status,
  };
}

function plantas(lista: { id: string; grupo?: GrupoPlanta | null; especieId?: string; especie?: string }[]) {
  return new Map<string, Planta>(
    lista.map((p) => [
      p.id,
      {
        id: p.id,
        grupo: p.grupo ?? null,
        especieId: p.especieId ?? null,
        especie: p.especie ? { nomeComum: p.especie } : undefined,
      } as unknown as Planta,
    ]),
  );
}

describe('pendentesDaBancada', () => {
  it('inclui atrasadas de qualquer idade e as que vencem dentro do período', () => {
    const atrasadaAntiga = ag('p1', 'Rega', -40);
    const hoje = ag('p1', 'Rega', 0);
    const emSeis = ag('p1', 'Poda', 6);
    const emOito = ag('p1', 'Poda', 8);
    expect(pendentesDaBancada([atrasadaAntiga, hoje, emSeis, emOito], 'semana')).toEqual([atrasadaAntiga, hoje, emSeis]);
  });

  it('ignora o que não está pendente', () => {
    const feita = ag('p1', 'Rega', -1, 'CONCLUIDO');
    const cancelada = ag('p1', 'Rega', 1, 'CANCELADO');
    expect(pendentesDaBancada([feita, cancelada], 'todas')).toEqual([]);
  });

  it('"todas" não tem limite', () => {
    const longe = ag('p1', 'Rega', 400);
    expect(pendentesDaBancada([longe], 'todas')).toEqual([longe]);
  });
});

describe('montarBancada por grupo', () => {
  it('sem tarefas, não monta blocos', () => {
    expect(montarBancada([], 'grupos', plantas([]))).toEqual([]);
  });

  it('grupo com atrasada vem antes de grupo de maior prioridade sem atrasada', () => {
    const mapa = plantas([
      { id: 'deb', grupo: 'DEBILITADA' },
      { id: 'cres', grupo: 'EM_CRESCIMENTO' },
    ]);
    const blocos = montarBancada([ag('deb', 'Rega', 2), ag('cres', 'Rega', -1)], 'grupos', mapa);
    expect(blocos.map((b) => b.chave)).toEqual(['EM_CRESCIMENTO', 'DEBILITADA']);
  });

  it('entre grupos com atrasadas, mantém a ordem de prioridade; sem grupo vai por último', () => {
    const mapa = plantas([
      { id: 'ref', grupo: 'REFINAMENTO' },
      { id: 'pre', grupo: 'PRE_TRANSPLANTE' },
      { id: 'sem' },
    ]);
    const blocos = montarBancada([ag('sem', 'Rega', 1), ag('ref', 'Rega', -2), ag('pre', 'Rega', -1)], 'grupos', mapa);
    expect(blocos.map((b) => b.chave)).toEqual(['PRE_TRANSPLANTE', 'REFINAMENTO', 'sem']);
    expect(blocos.map((b) => b.titulo)).toEqual(['Pré-transplante', 'Refinamento', 'Sem grupo']);
  });

  it('conta total e atrasadas e usa a cor do grupo (neutra sem grupo)', () => {
    const mapa = plantas([{ id: 'deb', grupo: 'DEBILITADA' }, { id: 'sem' }]);
    const [deb, sem] = montarBancada([ag('deb', 'Rega', -3), ag('deb', 'Poda', 2), ag('sem', 'Rega', 1)], 'grupos', mapa);
    expect(deb).toMatchObject({ total: 2, atrasadas: 1, tom: GRUPO_CORES.DEBILITADA });
    expect(sem).toMatchObject({ total: 1, atrasadas: 0, tom: TOM_NEUTRO });
  });

  it('dentro do grupo, tarefas pela data mais antiga e plantas atrasadas primeiro', () => {
    const mapa = plantas([
      { id: 'a', grupo: 'EM_CRESCIMENTO' },
      { id: 'b', grupo: 'EM_CRESCIMENTO' },
    ]);
    const [bloco] = montarBancada([ag('a', 'Poda', 3), ag('b', 'Rega', 4), ag('b', 'Poda', -1)], 'grupos', mapa);
    expect(bloco.grupos.map((g) => g.nome)).toEqual(['Poda', 'Rega']);
    expect(bloco.grupos[0].agendas.map((a) => a.plantaId)).toEqual(['b', 'a']);
  });
});

describe('montarBancada por tarefa', () => {
  it('um bloco por atividade, em faixa neutra, com atrasadas primeiro', () => {
    const mapa = plantas([{ id: 'a' }, { id: 'b' }]);
    const blocos = montarBancada([ag('a', 'Rega', 2), ag('b', 'Poda', 1), ag('a', 'Poda', 5), ag('b', 'Rega', -2)], 'tarefas', mapa);
    expect(blocos.map((b) => b.titulo)).toEqual(['Rega', 'Poda']);
    expect(blocos[0]).toMatchObject({ total: 2, atrasadas: 1, tom: TOM_NEUTRO });
    expect(blocos[0].grupos).toHaveLength(1);
    expect(blocos[0].grupos[0].agendas.map((a) => a.plantaId)).toEqual(['b', 'a']);
  });
});

describe('montarBancada por espécie', () => {
  it('espécies de A a Z, "Sem espécie" por último, com atrasadas antes', () => {
    const mapa = plantas([
      { id: 'j', especieId: 'e1', especie: 'Jabuticaba' },
      { id: 'f', especieId: 'e2', especie: 'Ficus' },
      { id: 'x' },
      { id: 'l', especieId: 'e3', especie: 'Ligustro' },
    ]);
    const blocos = montarBancada([ag('j', 'Rega', 1), ag('f', 'Rega', 2), ag('x', 'Rega', 1), ag('l', 'Rega', -1)], 'especies', mapa);
    expect(blocos.map((b) => b.titulo)).toEqual(['Ligustro', 'Ficus', 'Jabuticaba', 'Sem espécie']);
    expect(blocos.every((b) => b.tom === TOM_NEUTRO)).toBe(true);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run (em `web/`): `npm test`
Expected: FAIL — `montarBancada`/`pendentesDaBancada` não exportados (`does not provide an export named`).

- [ ] **Step 4: Implementar em `web/src/lib/bancada.ts`**

Ajustar o import de `./format` para:

```ts
import {
  GRUPO_CORES,
  TOM_NEUTRO,
  agruparPorAtividade,
  diasAte,
  especieNome,
  grupoLabel,
  type GrupoAtividade,
  type TomFaixa,
} from './format';
```

Logo depois de `AGRUPAMENTOS`, acrescentar:

```ts
export type View = 'lista' | 'fotos';

export const VIEWS_BANCADA: { value: View; label: string }[] = [
  { value: 'fotos', label: 'Fotos' },
  { value: 'lista', label: 'Lista' },
];

export const ehAtrasada = (a: Agenda) => diasAte(a.dataAgendada) < 0;
```

No fim do arquivo, acrescentar:

```ts
/** Pendentes da bancada: atrasadas (sempre) e as que vencem dentro do período. */
export function pendentesDaBancada(agendas: Agenda[], periodo: Periodo): Agenda[] {
  const limite = limiteDoPeriodo(periodo);
  return agendas.filter((a) => {
    if (a.status !== 'PENDENTE') return false;
    const d = diasAte(a.dataAgendada);
    return d < 0 || limite === null || d <= limite;
  });
}

export interface BlocoBancada {
  chave: string;
  titulo: string;
  tom: TomFaixa;
  total: number;
  atrasadas: number;
  /** Tarefas por atividade (data mais antiga primeiro); no modo "por tarefa", só uma. */
  grupos: GrupoAtividade[];
}

function bloco(chave: string, titulo: string, tom: TomFaixa, agendas: Agenda[]): BlocoBancada {
  return {
    chave,
    titulo,
    tom,
    total: agendas.length,
    atrasadas: agendas.filter(ehAtrasada).length,
    grupos: agruparPorAtividade(agendas),
  };
}

/** Blocos com atrasadas primeiro; entre si, mantém a ordem recebida. */
const atrasadasPrimeiro = (blocos: BlocoBancada[]) =>
  [...blocos].sort((a, b) => Number(b.atrasadas > 0) - Number(a.atrasadas > 0));

/** Bancada em blocos: por grupo (ordem de prioridade), por tarefa ou por espécie (A–Z); blocos com atrasadas sobem. */
export function montarBancada(agendas: Agenda[], modo: Agrupar, plantas: Map<string, Planta>): BlocoBancada[] {
  if (!agendas.length) return [];

  if (modo === 'tarefas') {
    return atrasadasPrimeiro(
      agruparPorAtividade(agendas).map((g) => bloco(g.atividadeId, g.nome, TOM_NEUTRO, g.agendas)),
    );
  }

  const chaveDe = (a: Agenda) => {
    const p = plantas.get(a.plantaId);
    return (modo === 'grupos' ? p?.grupo : p?.especieId) ?? '';
  };
  const porChave = new Map<string, Agenda[]>();
  for (const a of agendas) {
    const k = chaveDe(a);
    porChave.set(k, [...(porChave.get(k) ?? []), a]);
  }

  if (modo === 'grupos') {
    const ordem = [...GRUPOS_PLANTA.map((g) => g.value as string), ''];
    return atrasadasPrimeiro(
      ordem
        .filter((k) => porChave.has(k))
        .map((k) =>
          k
            ? bloco(k, grupoLabel(k as GrupoPlanta), GRUPO_CORES[k as GrupoPlanta], porChave.get(k)!)
            : bloco('sem', grupoLabel(null), TOM_NEUTRO, porChave.get(k)!),
        ),
    );
  }

  const nomeEspecie = (k: string) => especieNome(plantas.get(porChave.get(k)![0].plantaId)?.especie);
  const especies = [...porChave.keys()].filter(Boolean).sort((a, b) => nomeEspecie(a).localeCompare(nomeEspecie(b), 'pt-BR'));
  return atrasadasPrimeiro([
    ...especies.map((k) => bloco(k, nomeEspecie(k), TOM_NEUTRO, porChave.get(k)!)),
    ...(porChave.has('') ? [bloco('sem', 'Sem espécie', TOM_NEUTRO, porChave.get('')!)] : []),
  ]);
}
```

- [ ] **Step 5: Rodar e ver passar**

Run (em `web/`): `npm test`
Expected: PASS — 10 testes.

- [ ] **Step 6: Tipos e lint**

Run (em `web/`): `npx tsc -b && npm run lint`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/package-lock.json web/vite.config.ts web/src/lib/bancada.ts web/src/lib/bancada.test.ts
git commit -m "feat(web): lógica da nova Bancada com atrasadas primeiro, testada com Vitest

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Nova tela da Bancada

**Files:**
- Create: `web/src/components/bancada/FaixaGrupo.tsx`
- Create: `web/src/components/bancada/CabecalhoTarefa.tsx`
- Create: `web/src/components/bancada/LinhaTarefa.tsx`
- Create: `web/src/components/bancada/FotoTarefa.tsx`
- Modify: `web/src/components/AtividadeIcone.tsx` (círculo, traço fino)
- Modify: `web/src/pages/BancadaPage.tsx` (reescrita)
- Modify: `web/src/lib/bancada.ts` (remover `tarefasDaBancada`, `Bloco`, `blocosDaBancada`)
- Delete: `web/src/components/BenchTaskCard.tsx`

**Interfaces:**
- Consumes: `pendentesDaBancada`, `montarBancada`, `BlocoBancada`, `ehAtrasada`, `VIEWS_BANCADA`, `View`, `PERIODOS`, `AGRUPAMENTOS` (Task 2); `estiloFaixa`, `dataRelativa`, `plantaRotulo`, `GrupoAtividade` de `@/lib/format`; `useEscolha` de `@/lib/escolhas`; `BotaoPreferencias`, `OpcoesChips` de `@/components/Preferencias`; `useCare().abrirTarefa(agenda)`.
- Produces: `FaixaGrupo({ bloco }: { bloco: BlocoBancada })`, `CabecalhoTarefa({ grupo }: { grupo: GrupoAtividade })`, `LinhaTarefa({ agenda }: { agenda: Agenda })`, `FotoTarefa({ agenda }: { agenda: Agenda })`.

- [ ] **Step 1: Ícone de atividade em círculo**

Em `web/src/components/AtividadeIcone.tsx`, trocar o `return` do componente por:

```tsx
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-primary-light text-primary ${className}`} aria-hidden>
      <Icone size={size} strokeWidth={1.75} />
    </span>
  );
```

- [ ] **Step 2: `FaixaGrupo`**

`web/src/components/bancada/FaixaGrupo.tsx`:

```tsx
import { estiloFaixa } from '@/lib/format';
import type { BlocoBancada } from '@/lib/bancada';

/** Faixa de ponta a ponta do bloco (grupo, tarefa ou espécie): "DEBILITADA · 2 · 1 atrasada". */
export function FaixaGrupo({ bloco }: { bloco: BlocoBancada }) {
  return (
    <h3
      className="faixa -mx-4 flex items-center gap-1.5 px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.08em]"
      style={estiloFaixa(bloco.tom)}
    >
      <span className="truncate">{bloco.titulo}</span>
      <span className="shrink-0 font-semibold normal-case tracking-normal opacity-85">
        · {bloco.total}
        {bloco.atrasadas > 0 && ` · ${bloco.atrasadas} atrasada${bloco.atrasadas > 1 ? 's' : ''}`}
      </span>
    </h3>
  );
}
```

- [ ] **Step 3: `CabecalhoTarefa`**

`web/src/components/bancada/CabecalhoTarefa.tsx`:

```tsx
import { useNavigate } from 'react-router';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import type { GrupoAtividade } from '@/lib/format';

/** Tipo de tarefa: ícone em círculo, nome e contagem; "Concluir todas" com 2 ou mais. */
export function CabecalhoTarefa({ grupo: g }: { grupo: GrupoAtividade }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 pb-0.5 pt-3">
      <AtividadeIcone nome={g.nome} size={14} className="size-6" />
      <h4 className="min-w-0 flex-1 truncate font-sans text-sm font-bold text-ink">
        {g.nome} <span className="font-medium text-muted">· {g.agendas.length}</span>
      </h4>
      {g.agendas.length > 1 && (
        <button
          type="button"
          className="shrink-0 text-xs font-semibold text-primary"
          onClick={() => navigate(`/concluir?ids=${g.agendas.map((a) => a.id).join(',')}`)}
        >
          Concluir todas
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `LinhaTarefa` (visualização lista)**

`web/src/components/bancada/LinhaTarefa.tsx`:

```tsx
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { PlantThumb } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { ehAtrasada } from '@/lib/bancada';
import { dataRelativa, diasAte, plantaRotulo } from '@/lib/format';
import type { Agenda } from '@/types';

/** Planta na lista: miniatura, rótulo e prazo; atrasada ganha fundo em degradê e traço à esquerda. */
export function LinhaTarefa({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = ehAtrasada(agenda);
  const p = agenda.planta;
  const dias = -diasAte(agenda.dataAgendada);
  const nome = p?.identificador ? p?.nome || p?.especie?.nomeComum : p?.especie?.nomeComum;

  return (
    <div
      className={`relative -mx-4 flex items-center gap-3 py-2 pl-12 pr-4 [&+&]:border-t [&+&]:border-line ${
        atrasada ? 'bg-gradient-to-r from-late-light via-late-light/70 to-transparent' : ''
      }`}
    >
      {atrasada && <span className="absolute bottom-3 left-9 top-3 w-[3px] rounded-full bg-late" aria-hidden />}
      <button type="button" onClick={() => abrirTarefa(agenda)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PlantThumb url={p?.fotoCapaUrl} className="size-11 shrink-0 rounded-[14px]" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {plantaRotulo(p)}
            {nome && <span className="font-normal text-muted"> · {nome}</span>}
          </span>
          <span className={`block truncate text-xs ${atrasada ? 'font-bold text-late' : 'text-muted'}`}>
            {atrasada ? `atrasada há ${dias} dia${dias > 1 ? 's' : ''}` : dataRelativa(agenda.dataAgendada)}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
        className="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary text-primary transition active:scale-90"
        aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'} de ${plantaRotulo(p)}`}
      >
        <Check size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
```

- [ ] **Step 5: `FotoTarefa` (visualização fotos)**

`web/src/components/bancada/FotoTarefa.tsx`:

```tsx
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { PlantThumb } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { ehAtrasada } from '@/lib/bancada';
import { dataRelativa, plantaRotulo } from '@/lib/format';
import type { Agenda } from '@/types';

/** Planta na faixa de fotos: cantos orgânicos, rótulo e ✓ sobre a foto; atrasada ganha contorno. */
export function FotoTarefa({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = ehAtrasada(agenda);
  const p = agenda.planta;

  return (
    <div className="w-28 shrink-0 snap-start">
      <div className={`relative rounded-[20px_20px_20px_6px] ${atrasada ? 'ring-2 ring-late ring-offset-2 ring-offset-bg' : ''}`}>
        <button type="button" onClick={() => abrirTarefa(agenda)} className="block w-full" aria-label={`Abrir tarefa de ${plantaRotulo(p)}`}>
          <PlantThumb url={p?.fotoCapaUrl} className="h-32 w-28 rounded-[20px_20px_20px_6px]" />
        </button>
        <span className="pointer-events-none absolute left-2 top-2 max-w-[80%] truncate rounded-full bg-bg/90 px-2 py-0.5 text-[11px] font-bold">
          {plantaRotulo(p)}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
          className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-bg text-primary shadow-sm transition active:scale-90"
          aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'} de ${plantaRotulo(p)}`}
        >
          <Check size={15} strokeWidth={2.5} />
        </button>
      </div>
      <p className={`mt-1.5 truncate text-[11px] ${atrasada ? 'font-bold text-late' : 'text-muted'}`}>{dataRelativa(agenda.dataAgendada)}</p>
    </div>
  );
}
```

- [ ] **Step 6: Reescrever `web/src/pages/BancadaPage.tsx`**

Conteúdo completo:

```tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PartyPopper } from 'lucide-react';
import { Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { CabecalhoTarefa } from '@/components/bancada/CabecalhoTarefa';
import { FaixaGrupo } from '@/components/bancada/FaixaGrupo';
import { FotoTarefa } from '@/components/bancada/FotoTarefa';
import { LinhaTarefa } from '@/components/bancada/LinhaTarefa';
import { BotaoPreferencias, OpcoesChips } from '@/components/Preferencias';
import { Sheet } from '@/components/Sheet';
import { useAuth } from '@/context/AuthContext';
import {
  AGRUPAMENTOS,
  PERIODOS,
  VIEWS_BANCADA,
  ehAtrasada,
  montarBancada,
  pendentesDaBancada,
  type Agrupar,
  type Periodo,
  type View,
} from '@/lib/bancada';
import { useEscolha } from '@/lib/escolhas';
import type { GrupoAtividade } from '@/lib/format';
import { useAgendas, usePlantas } from '@/lib/queries';
import { errorMessage } from '@/lib/api';
import type { Planta } from '@/types';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Bancada de trabalho: pendentes do período (atrasadas sempre) em faixas por grupo, tarefa ou espécie. */
export function BancadaPage() {
  const { user } = useAuth();
  const agendas = useAgendas();
  const plantas = usePlantas();
  const [prefs, setPrefs] = useState(false);
  const [periodo, setPeriodo] = useEscolha<Periodo>('bonsai_bancada_periodo', 'semana', PERIODOS);
  const [agrupar, setAgrupar] = useEscolha<Agrupar>('bonsai_bancada_agrupar', 'grupos', AGRUPAMENTOS);
  const [view, setView] = useEscolha<View>('bonsai_bancada_view', 'fotos', VIEWS_BANCADA);

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const semPlantas = plantas.data?.length === 0;
  const plantasPorId = useMemo(() => new Map<string, Planta>((plantas.data ?? []).map((p) => [p.id, p])), [plantas.data]);
  const pendentes = pendentesDaBancada(agendas.data ?? [], periodo);
  const atrasadas = pendentes.filter(ehAtrasada).length;
  const blocos = montarBancada(pendentes, agrupar, plantasPorId);
  const periodoAtual = PERIODOS.find((p) => p.value === periodo)!;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="flex items-end justify-between gap-3 pb-3 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {saudacao()}
            {nome && `, ${nome}`}
          </p>
          <h1 className="text-3xl font-semibold">Bancada</h1>
          {!semPlantas && agendas.data && (
            <p className="text-sm text-muted">
              {periodoAtual.label} · {pendentes.length} tarefa{pendentes.length === 1 ? '' : 's'}
              {atrasadas > 0 && (
                <span className="font-semibold text-late">
                  {' · '}
                  {atrasadas} atrasada{atrasadas > 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>
        {!semPlantas && <BotaoPreferencias ativos={0} onClick={() => setPrefs(true)} />}
      </header>

      {agendas.isLoading || plantas.isLoading ? (
        <Spinner />
      ) : agendas.isError || plantas.isError ? (
        <ErrorState text={errorMessage(agendas.error ?? plantas.error)} onRetry={() => { if (agendas.isError) agendas.refetch(); if (plantas.isError) plantas.refetch(); }} />
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
      ) : blocos.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 border-y border-line py-4">
          <PartyPopper className="shrink-0 text-primary" size={24} />
          <p className="text-sm">
            <span className="font-semibold">Nada pendente {periodoAtual.vazio}.</span>{' '}
            <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-6">
          {blocos.map((b) => (
            <section key={b.chave}>
              <FaixaGrupo bloco={b} />
              {b.grupos.map((g) => (
                <div key={g.atividadeId}>
                  {agrupar !== 'tarefas' && <CabecalhoTarefa grupo={g} />}
                  <Plantas grupo={g} view={view} />
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <Sheet
        open={prefs}
        onClose={() => setPrefs(false)}
        title="Preferências"
        footer={
          <Button block onClick={() => setPrefs(false)}>
            Pronto
          </Button>
        }
      >
        <div className="space-y-5">
          <OpcoesChips titulo="Período" opcoes={PERIODOS} value={periodo} onChange={setPeriodo} />
          <OpcoesChips titulo="Agrupar por" opcoes={AGRUPAMENTOS} value={agrupar} onChange={setAgrupar} />
          <OpcoesChips titulo="Visualização" opcoes={VIEWS_BANCADA} value={view} onChange={setView} />
        </div>
      </Sheet>
    </div>
  );
}

/** Plantas de uma tarefa: linhas recuadas (lista) ou faixa horizontal de fotos com encaixe. */
function Plantas({ grupo, view }: { grupo: GrupoAtividade; view: View }) {
  if (view === 'lista') {
    return (
      <div>
        {grupo.agendas.map((a) => (
          <LinhaTarefa key={a.id} agenda={a} />
        ))}
      </div>
    );
  }
  return (
    <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 pl-12 pt-2 [scrollbar-width:none]">
      {grupo.agendas.map((a) => (
        <FotoTarefa key={a.id} agenda={a} />
      ))}
    </div>
  );
}
```

Nota: no modo "por tarefa" o nome da tarefa já está na faixa, por isso `CabecalhoTarefa` não aparece. O "Concluir todas" nesse modo fica fora do escopo (a spec não pede).

- [ ] **Step 7: Remover o código antigo**

- Apagar `web/src/components/BenchTaskCard.tsx`.
- Em `web/src/lib/bancada.ts`, remover `tarefasDaBancada`, `interface Bloco` e `blocosDaBancada` (e imports que ficarem sem uso — `tsc` com `noUnusedLocals` aponta).

Run: `grep -rn "BenchTaskCard\|blocosDaBancada\|tarefasDaBancada" src`
Expected: nenhuma ocorrência.

- [ ] **Step 8: Testes, tipos e lint**

Run (em `web/`): `npm test && npx tsc -b && npm run lint`
Expected: 10 testes passando; tsc sem erros; lint sem erros novos.

- [ ] **Step 9: Conferir no navegador**

Criar dados de teste via API (guardar ids em `localStorage.__teste_ids` e apagar no fim): 3 plantas (`DEBILITADA`, `EM_CRESCIMENTO`, `REFINAMENTO`); `POST /api/agendas/lote` com Rega em todas a -3 dias, Poda de manutenção em duas a +2 dias, Aramação em uma a +4 dias. Abrir `/` no iframe de 390px e conferir:
1. Fotos + por grupo: grupos com atrasada no topo; faixas em degradê de ponta a ponta sem bordas laterais; atrasada com contorno terracota e primeira da faixa; fotos deslizam para o lado.
2. Lista + por grupo: linhas recuadas, atrasada com fundo em degradê, traço e "atrasada há 3 dias".
3. Por tarefa e por espécie: faixas areia; por tarefa sem cabeçalho de tarefa repetido.
4. Recarregar: preferências lembradas.
5. ✓ abre `/concluir?ids=…`; tocar na planta abre a tarefa.
Depois apagar as plantas criadas e restaurar `bonsai_bancada_view`/`bonsai_bancada_agrupar` para os valores de antes.

- [ ] **Step 10: Commit**

```bash
git add -A web/src
git commit -m "feat(web): Bancada em faixas por grupo e tarefa, atrasadas primeiro, lista ou fotos

Substitui o visual do 1e696e8: faixas de ponta a ponta com degradê de prioridade,
tipo de tarefa com ícone em círculo, atrasadas destacadas no próprio item e
visualização lista/fotos nas preferências.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Revisão de contraste nas demais telas

**Files:**
- Modify: apenas os arquivos onde a revisão encontrar problema (registrar cada um no commit).

Critérios: texto principal sobre `bg`/`card` legível (ink `#2B1F17`); nenhum elemento "some" porque era branco sobre branco e agora é `card` sobre `bg` claro (`#F8F6F5` sobre `#EFECEC` — conferir que cards ainda têm borda `line` ou separação); estados ativos (chips, seleção em `PlantasPicker`, `SpeciesPicker`, `ConcluirPage`) visíveis; cores herdadas do verde antigo não aparecem em lugar nenhum (buscar `#285430`, `emerald`, `green-` no código).

- [ ] **Step 1: Busca por resquícios do tema antigo**

Run (em `web/`): `grep -rn "285430\|1a3a20\|e8f0e9\|emerald\|green-\|Fraunces\|Inter'" src index.html public`
Expected: nenhuma ocorrência. Se houver, trocar pelo token equivalente (`primary`, `primary-dark`, `primary-light`) e reexecutar.

- [ ] **Step 2: Passar pelas telas no navegador (iframe 390px)**

Rotas: `/colecao` (grade e lista, folha de preferências), `/plantas/:id` (detalhe e linha do tempo), `/plantas/nova`, `/registrar`, `/concluir?ids=<id de teste>`, `/perfil`, folha "+" do menu, folha de agendar (`Agendar cuidado` no "+"). Para cada uma, tirar screenshot e anotar problemas conforme os critérios acima.

- [ ] **Step 3: Corrigir o que foi anotado**

Para cada problema, aplicar a menor troca de classe que resolve, usando só tokens do tema (`border-line`, `bg-card`, `bg-primary-light`, `text-muted`, etc.). Reexecutar `npx tsc -b && npm run lint`.

- [ ] **Step 4: Commit (só se houve mudança)**

```bash
git add -A web/src
git commit -m "fix(web): ajustes de contraste nas telas com o tema Argila

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review

- Spec §1 (tokens, grupos, fontes, selo da Coleção) → Task 1. §2 (topo, preferências lembradas, faixas, ordem, atraso nas duas visualizações, por tarefa/espécie, atrasadas fora do período, toque/✓, vazio) → Tasks 2–3. §3 (Vitest, componentes, remoção do BenchTaskCard, verificação visual, revisão de contraste, ordem de commits) → Tasks 1–4.
- Nomes conferidos entre tarefas: `TomFaixa`, `GRUPO_CORES`, `TOM_NEUTRO`, `estiloFaixa` (T1) → usados em T2/T3; `pendentesDaBancada`, `montarBancada`, `BlocoBancada`, `ehAtrasada`, `VIEWS_BANCADA`, `View` (T2) → usados em T3.
