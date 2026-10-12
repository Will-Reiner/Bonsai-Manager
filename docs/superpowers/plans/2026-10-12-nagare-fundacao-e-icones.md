# Nagare — Fundação visual e Ícones (fases 1 e 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao `web/` a pele "Caderno de sumi": papel, pinceladas, carimbo 流, mancha de tinta nas seleções e os ícones próprios (barra de baixo F2, ações, atividades, estações).

**Architecture:** Peças desenhadas (processadas pela skill `criando-assets-sumi`) vão para `web/public/arte` e `web/public/icones` e entram por CSS como `mask-image`/`background-image`, tingidas por tokens. Filtros SVG de "tinta" ficam montados uma vez na raiz do `App`. Regras puras (nome da atividade → ícone, URL do ícone) ficam em `src/lib/icones.ts`, com testes Vitest. Os componentes só desenham.

**Tech Stack:** React 19 + Vite 8 + TypeScript, Tailwind v4 (`@theme` em `src/index.css`), Vitest (ambiente `node`, só `src/**/*.test.ts`), Python 3 + Pillow (preparo das peças, uma vez).

**Spec:** `docs/superpowers/specs/2026-10-12-identidade-nagare-sumi-design.md` (seções 2 e 3; as seções 4–6 terão planos próprios).

## Global Constraints

- Idioma: código, comentários e textos em **português**.
- Nenhuma dependência nova no `web/`.
- Cores: papel `#F4F0E8`, tinta `#2B1F17`, muted `#7A6A5E`, hanko `#B23A2A`, vazio `#EBE4D9`. `card` continua `#F8F6F5`.
- Toda `mask` em CSS vai acompanhada de `-webkit-mask` (Safari/iOS).
- Filtros SVG: `#tinta-aspera` (borda áspera) e `#tinta-mancha` (mancha). O filtro nunca vai no elemento com texto, só em `::before` ou num fundo.
- Utilitários continuam no Lucide (✓, X, setas, lixeira, lápis, busca, "…", `Loader2`).
- Transições respeitam `prefers-reduced-motion: reduce` (sem transição).
- Antes de cada commit: `cd web && npm run build && npm run lint && npm test` sem erro.
- Commits direto na `main`. **Push = deploy**: só com o OK do usuário, ao fim de cada fase.
- Mensagens de commit terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Telas fora do `Layout` (`/registrar`, `/concluir`, `/agendar`, sheets) usam `.chip-active`. Sem os filtros na raiz, a mancha some. Os filtros ficam no `App` (Task 2), e a verificação passa por `/registrar`.
2. Safari/iOS não aplica `mask` sem prefixo em versões ainda em uso. Por isso o par `mask`/`-webkit-mask` vale em todo CSS novo (Tasks 2, 3, 6, 7, 8, 9).
3. Atividade criada pelo admin com nome fora do seed (ex.: "Pinçamento", "Adubo líquido") deve cair no ícone certo ou no genérico, nunca quebrar (testes na Task 5).
4. Faixa com título longo (agrupar por espécie, nome científico grande) deve truncar dentro da pincelada, sem estourar a linha nem esconder o "Concluir todas" (verificação na Task 3).
5. Chips pequenos (`py-1.5 text-xs` no `ReagendarSheet` e no `DataFuturaCampo`) com mancha devem manter o texto nítido e legível. O filtro fica só no `::before` (verificação na Task 2).

---

## Fase 1 — Fundação

### Task 1: Peças de arte e ícones em `web/public`

**Files:**
- Create: `web/public/arte/papel.jpg`, `web/public/arte/pincel-longo.webp`, `web/public/arte/pincel-medio.webp`, `web/public/arte/pincel-curto.webp`, `web/public/arte/pincel-fino.webp`, `web/public/arte/enso.webp`
- Create: `web/public/icones/*.svg` (33 arquivos)

**Interfaces:**
- Produces: URLs públicas usadas pelo CSS e pelos componentes:
  - `/arte/papel.jpg` (fundo);
  - `/arte/pincel-longo.webp` (aba ativa);
  - `/arte/pincel-medio.webp` (linha da barra);
  - `/arte/pincel-curto.webp` (faixa de grupo);
  - `/arte/pincel-fino.webp` (divisória, progresso);
  - `/arte/enso.webp` (estação);
  - `/icones/<nome>.svg` para os 30 nomes de `ICONES` (Task 5) + `/icones/{bancada,colecao,perfil}-ativo.svg`.

- [ ] **Step 1: Gerar as peças com a skill (na raiz do repositório)**

```bash
P=.claude/skills/criando-assets-sumi/scripts/processar.py
M=test-assets/estilo/imagem_mestra.jpeg
T=$(mktemp -d)
mkdir -p web/public/arte web/public/icones
python -W ignore $P papel test-assets/estilo/papel/papel.jpeg --saida web/public/arte/papel.jpg
python -W ignore $P tinta $M --caixa 150,160,1900,340 --minimo 150 --max 600 --saida $T --prefixo longo
python -W ignore $P tinta $M --caixa 150,410,1250,600 --minimo 150 --max 600 --saida $T --prefixo medio
python -W ignore $P tinta $M --caixa 155,680,790,860 --minimo 150 --max 400 --saida $T --prefixo curto
python -W ignore $P tinta $M --caixa 690,990,1170,1460 --minimo 150 --max 320 --saida $T --prefixo enso
python -W ignore $P tinta test-assets/estilo/pinceladas/pinceladas.jpeg --max 600 --saida $T --prefixo fino  # sem --minimo: as finas têm < 150px de altura
ls $T
```

Expected: `curto-1.png enso-1.png fino-1.png … fino-6.png longo-1.png medio-1.png`. Se algum prefixo gerar `-2.png` (respingo separado), rode de novo aquele comando com `--minimo 300`.

- [ ] **Step 2: Converter para WebP**

```bash
python - "$T" <<'EOF'
import sys
from PIL import Image
t = sys.argv[1]
for src, dst in [("longo-1", "pincel-longo"), ("medio-1", "pincel-medio"), ("curto-1", "pincel-curto"), ("fino-1", "pincel-fino"), ("enso-1", "enso")]:
    Image.open(f"{t}/{src}.png").save(f"web/public/arte/{dst}.webp", "WEBP", quality=85, method=6)
EOF
```

- [ ] **Step 3: Copiar os ícones (normais de todos os grupos + 3 ativos da navegação)**

```bash
S=test-assets/estilo/icons/svg
for g in navegacao acoes atividades estacoes; do
  for f in $S/$g/*.svg; do case "$(basename "$f")" in *-ativo.svg) ;; *) cp "$f" web/public/icones/ ;; esac; done
done
for n in bancada colecao perfil; do cp $S/navegacao/$n-ativo.svg web/public/icones/; done
ls web/public/icones | wc -l
du -sh web/public/arte web/public/icones
```

Expected: `33`; `arte` ≤ 400K; `icones` ≤ 150K.

- [ ] **Step 4: Conferir as peças**

Abra `web/public/arte/*.webp` e `web/public/arte/papel.jpg` (Read mostra a imagem). As pinceladas devem estar em tinta escura sobre fundo transparente, sem pedaços cortados, e o ensō deve estar inteiro.

- [ ] **Step 5: Commit**

```bash
git add web/public/arte web/public/icones
git commit -m "feat(web): peças de arte e ícones do estilo sumi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Papel, tokens, filtros de tinta, divisória e mancha nos chips

**Files:**
- Modify: `web/src/index.css` (`@theme`, `@layer base` → `body`, `@layer components` → `.chip-active` e novas classes)
- Create: `web/src/components/FiltrosTinta.tsx`
- Modify: `web/src/App.tsx` (montar `<FiltrosTinta />`)

**Interfaces:**
- Consumes: `/arte/papel.jpg`, `/arte/pincel-fino.webp` (Task 1).
- Produces:
  - tokens Tailwind `bg-vazio`/`text-hanko`/`bg-hanko` (cores `--color-vazio`, `--color-hanko`);
  - classe `.divisoria`;
  - `.chip-active` com mancha;
  - ids de filtro `#tinta-aspera` e `#tinta-mancha` disponíveis em todas as telas.

- [ ] **Step 1: Tokens e papel em `web/src/index.css`**

No `@theme`, troque `--color-bg: #efecec;` e acrescente os dois tokens novos:

```css
  --color-bg: #f4f0e8;
  --color-vazio: #ebe4d9;
  --color-hanko: #b23a2a;
```

No `@layer base`, o `body` passa a ter o papel:

```css
  body {
    @apply bg-bg text-ink font-sans antialiased;
    background-image: url('/arte/papel.jpg');
    background-size: 384px;
  }
```

Atualize o comentário do topo do arquivo para: `/* Tema Argila + Caderno de sumi — docs/superpowers/specs/2026-10-07-tema-argila-bancada-design.md e 2026-10-12-identidade-nagare-sumi-design.md */`.

- [ ] **Step 2: Divisória e mancha em `@layer components`**

Substitua a regra `.chip-active` existente e acrescente `.divisoria`:

```css
  /* Selecionado = mancha de tinta (o filtro fica só no ::before, nunca no texto) */
  .chip-active {
    @apply relative isolate border-transparent bg-transparent text-bg;
  }
  .chip-active::before {
    content: '';
    position: absolute;
    inset: -1px;
    z-index: -1;
    background-color: var(--color-ink);
    border-radius: 46% 54% 50% 48% / 60% 46% 54% 40%;
    filter: url(#tinta-mancha);
  }
  /* Divisória em pincelada fina, tingida pela tinta */
  .divisoria {
    display: block;
    height: 9px;
    background-color: var(--color-ink);
    opacity: 0.7;
    -webkit-mask: url('/arte/pincel-fino.webp') no-repeat center / 100% 100%;
    mask: url('/arte/pincel-fino.webp') no-repeat center / 100% 100%;
  }
```

- [ ] **Step 3: Criar `web/src/components/FiltrosTinta.tsx`**

```tsx
/** Filtros SVG da tinta, usados pelo CSS como url(#tinta-aspera) e url(#tinta-mancha). Montado uma vez na raiz. */
export function FiltrosTinta() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <filter id="tinta-aspera">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
        <feDisplacementMap in="SourceGraphic" scale={2.2} />
      </filter>
      <filter id="tinta-mancha">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves={2} seed={3} />
        <feDisplacementMap in="SourceGraphic" scale={4} />
      </filter>
    </svg>
  );
}
```

- [ ] **Step 4: Montar na raiz em `web/src/App.tsx`**

Importe `import { FiltrosTinta } from '@/components/FiltrosTinta';` e coloque logo depois de `<BrowserRouter>`:

```tsx
    <BrowserRouter>
      <FiltrosTinta />
      <RolarParaTopo />
```

- [ ] **Step 5: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa (nenhum teste novo nesta task).

- [ ] **Step 6: Verificação visual (390px)**

Run: `docker compose up -d` (raiz) e `cd web && npm run dev`. Abra http://localhost:5173 com a conta local de teste, em largura 390px.

Confira:
- o fundo de papel aparece em todas as telas;
- os chips selecionados aparecem como mancha escura com o texto claro e nítido em:
  - Bancada → Preferências;
  - Perfil → Preferências;
  - `/registrar` (fora do `Layout`);
  - o sheet Reagendar (chips pequenos `text-xs`).

- [ ] **Step 7: Commit**

```bash
git add web/src/index.css web/src/components/FiltrosTinta.tsx web/src/App.tsx
git commit -m "feat(web): papel, filtros de tinta, divisória e mancha nos chips

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Faixa de grupo em pincelada

**Files:**
- Modify: `web/src/components/bancada/FaixaGrupo.tsx`
- Modify: `web/src/index.css` (regra `.faixa`)

**Interfaces:**
- Consumes: `/arte/pincel-curto.webp` (Task 1); `estiloFaixa(tom)` de `@/lib/format` (define `--faixa` e `color`).
- Produces: `.faixa` passa a ser a pincelada do tamanho do texto (só o `FaixaGrupo` usa).

- [ ] **Step 1: Trocar a regra `.faixa` em `web/src/index.css`**

Substitua o bloco `.faixa { background: linear-gradient(…) }` por:

```css
  /* Faixa de grupo: pincelada grossa na cor do grupo (--faixa, via estiloFaixa), do tamanho do texto */
  .faixa {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.45rem 1.6rem 0.45rem 0.75rem;
  }
  .faixa::before {
    content: '';
    position: absolute;
    inset: 0 0 0 -0.25rem;
    z-index: -1;
    background-color: var(--faixa);
    -webkit-mask: url('/arte/pincel-curto.webp') no-repeat left center / 100% 100%;
    mask: url('/arte/pincel-curto.webp') no-repeat left center / 100% 100%;
  }
```

Mantenha a regra `.selo` como está.

- [ ] **Step 2: Reestruturar `FaixaGrupo.tsx`**

```tsx
import { useNavigate } from 'react-router';
import { estiloFaixa } from '@/lib/format';
import type { BlocoBancada } from '@/lib/bancada';

/** Faixa do bloco (grupo, tarefa ou espécie) em pincelada: "DEBILITADA · 2 · 1 atrasada"; "Concluir todas" fica fora dela. */
export function FaixaGrupo({ bloco, concluirIds }: { bloco: BlocoBancada; concluirIds?: string[] }) {
  const navigate = useNavigate();
  return (
    <h3 className="-mx-4 flex items-center gap-2 px-4 py-1.5 font-sans">
      <span className="faixa min-w-0 text-xs font-bold uppercase tracking-[0.08em]" style={estiloFaixa(bloco.tom)}>
        <span className="truncate">{bloco.titulo}</span>
        <span className="shrink-0 font-semibold normal-case tracking-normal opacity-85">
          · {bloco.total}
          {bloco.atrasadas > 0 && ` · ${bloco.atrasadas} atrasada${bloco.atrasadas > 1 ? 's' : ''}`}
        </span>
      </span>
      {concluirIds && concluirIds.length > 1 && (
        <button
          type="button"
          className="-my-2 ml-auto shrink-0 px-2 py-2 text-xs font-semibold text-primary"
          aria-label={`Concluir todas: ${bloco.titulo}`}
          onClick={() => navigate(`/concluir?ids=${concluirIds.join(',')}`)}
        >
          Concluir todas
        </button>
      )}
    </h3>
  );
}
```

- [ ] **Step 3: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

- [ ] **Step 4: Verificação visual (390px)**

Na Bancada, confira os três agrupamentos (Preferências → Agrupar por grupo/tarefa/espécie):
- a pincelada tem a cor do grupo (texto escuro no Refinamento e no Recém transplantada, branco nos demais);
- em "por espécie", um nome longo trunca com "…" dentro da pincelada;
- "Concluir todas" (agrupar por tarefa, com 2 ou mais) aparece à direita, fora da pincelada, legível.

- [ ] **Step 5: Commit**

```bash
git add web/src/index.css web/src/components/bancada/FaixaGrupo.tsx
git commit -m "feat(web): faixa de grupo em pincelada sumi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Carimbo 流 e cabeçalho da Bancada

**Files:**
- Modify: `web/index.html` (fonte do carimbo)
- Modify: `web/src/index.css` (classe `.hanko`)
- Create: `web/src/components/Hanko.tsx`
- Modify: `web/src/pages/BancadaPage.tsx` (título com carimbo, divisória depois do cabeçalho)

**Interfaces:**
- Consumes: `.divisoria` e `#tinta-aspera` (Task 2).
- Produces: `Hanko({ tamanho?: number = 34, className?: string })`, usado também pela abertura (fase 5).

- [ ] **Step 1: Fonte só para o caractere 流 em `web/index.html`**

Logo abaixo do `<link>` das fontes existente (em um `<link>` **separado**: `text=` subsetaria as outras famílias):

```html
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@700&text=%E6%B5%81&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Classe `.hanko` em `@layer components`**

```css
  /* Carimbo 流 (marca Nagare): tamanho em --hanko-tam */
  .hanko {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: var(--hanko-tam, 34px);
    height: var(--hanko-tam, 34px);
    border-radius: 3px;
    background-color: var(--color-hanko);
    color: #f7e9e2;
    font-family: 'Noto Serif JP', serif;
    font-style: normal;
    font-weight: 700;
    font-size: calc(var(--hanko-tam, 34px) * 0.62);
    line-height: 1;
    transform: rotate(-4deg);
    filter: url(#tinta-aspera);
  }
```

- [ ] **Step 3: Criar `web/src/components/Hanko.tsx`**

```tsx
import type { CSSProperties } from 'react';

/** Carimbo vermelho 流 (marca Nagare). Decorativo. */
export function Hanko({ tamanho = 34, className = '' }: { tamanho?: number; className?: string }) {
  return (
    <span aria-hidden className={`hanko ${className}`} style={{ '--hanko-tam': `${tamanho}px` } as CSSProperties}>
      流
    </span>
  );
}
```

- [ ] **Step 4: Cabeçalho da Bancada**

Em `web/src/pages/BancadaPage.tsx`, importe `import { Hanko } from '@/components/Hanko';` e troque o título:

```tsx
          <h1 className="flex items-center gap-2.5 text-3xl font-semibold">
            Bancada <Hanko tamanho={26} />
          </h1>
```

Logo depois do `</header>` (antes de `<EstacaoDoAno />`), acrescente:

```tsx
      <span className="divisoria mb-3" aria-hidden />
```

- [ ] **Step 5: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

- [ ] **Step 6: Verificação visual (390px)**

Na Bancada, confira:
- o carimbo vermelho com 流 legível ao lado de "Bancada" (o título continua em itálico, o carimbo não);
- a pincelada fina entre o cabeçalho e o cartão da estação.

- [ ] **Step 7: Commit**

```bash
git add web/index.html web/src/index.css web/src/components/Hanko.tsx web/src/pages/BancadaPage.tsx
git commit -m "feat(web): carimbo 流 e divisória no cabeçalho da Bancada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Fim da fase 1, pedir OK para o push**

Mostre ao usuário o resultado (Bancada, Preferências, `/registrar`) e só faça `git push` com o OK dele.

---

## Fase 2 — Ícones

### Task 5: Nomes de ícone e mapeamento de atividades (`lib/icones.ts`)

**Files:**
- Create: `web/src/lib/icones.ts`
- Test: `web/src/lib/icones.test.ts`

**Interfaces:**
- Consumes: arquivos `/icones/*.svg` (Task 1).
- Produces:
  - `ICONES` (tupla readonly dos 30 nomes) e `type NomeIcone`;
  - `urlIcone(nome: NomeIcone, ativo?: boolean): string`;
  - `iconeDaAtividade(nome: string): NomeIcone`.

- [ ] **Step 1: Escrever o teste que falha**

`web/src/lib/icones.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { iconeDaAtividade, urlIcone } from './icones';

describe('iconeDaAtividade', () => {
  it.each([
    ['Rega', 'rega'],
    ['Adubação', 'adubacao'],
    ['Adubação líquida', 'adubacao-liquida'],
    ['Adubo líquido', 'adubacao-liquida'],
    ['Poda de manutenção', 'poda'],
    ['Poda estrutural', 'poda-estrutural'],
    ['Desfolha', 'desfolha'],
    ['Aramação', 'aramacao'],
    ['Desaramação', 'desaramacao'],
    ['Transplante', 'transplante'],
    ['Tratamento fitossanitário', 'fitossanitario'],
    ['Controle de pragas', 'fitossanitario'],
    ['Revisão', 'revisao'],
  ])('%s → %s', (nome, icone) => {
    expect(iconeDaAtividade(nome)).toBe(icone);
  });

  it('ignora maiúsculas, acentos e espaços nas pontas', () => {
    expect(iconeDaAtividade('  ADUBAÇÃO LÍQUIDA ')).toBe('adubacao-liquida');
  });

  it('atividade desconhecida ou vazia usa o genérico', () => {
    expect(iconeDaAtividade('Pinçamento')).toBe('generico');
    expect(iconeDaAtividade('')).toBe('generico');
  });
});

describe('urlIcone', () => {
  it('aponta para /icones/<nome>.svg', () => {
    expect(urlIcone('rega')).toBe('/icones/rega.svg');
  });

  it('só a navegação tem desenho ativo; os demais ignoram o pedido', () => {
    expect(urlIcone('bancada', true)).toBe('/icones/bancada-ativo.svg');
    expect(urlIcone('perfil', true)).toBe('/icones/perfil-ativo.svg');
    expect(urlIcone('rega', true)).toBe('/icones/rega.svg');
    expect(urlIcone('mais', true)).toBe('/icones/mais.svg');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd web && npm test -- icones`
Expected: FAIL ("Failed to resolve import './icones'" ou equivalente).

- [ ] **Step 3: Implementar `web/src/lib/icones.ts`**

```ts
/** Ícones próprios (traço sumi) servidos de web/public/icones — ver a skill criando-assets-sumi. */
export const ICONES = [
  'bancada', 'colecao', 'perfil', 'mais',
  'registrar', 'agendar', 'rotina', 'adicionar-planta', 'fotos-lote', 'preferencias', 'acesso-rapido', 'historico', 'reagendar',
  'rega', 'adubacao', 'adubacao-liquida', 'poda', 'poda-estrutural', 'desfolha', 'aramacao', 'desaramacao',
  'transplante', 'fitossanitario', 'revisao', 'generico', 'atrasada',
  'primavera', 'verao', 'outono', 'inverno',
] as const;

export type NomeIcone = (typeof ICONES)[number];

/** Só os ícones da barra de baixo têm desenho próprio para o estado ativo. */
const COM_ATIVO: readonly NomeIcone[] = ['bancada', 'colecao', 'perfil'];

export const urlIcone = (nome: NomeIcone, ativo = false) =>
  `/icones/${nome}${ativo && COM_ATIVO.includes(nome) ? '-ativo' : ''}.svg`;

/** Por trecho do nome (sem acento, minúsculo); a ordem importa: "liquid" antes de "adub", "poda estrutural" antes de "poda", "desaram" antes de "aram". */
const POR_TRECHO: [string, NomeIcone][] = [
  ['rega', 'rega'],
  ['liquid', 'adubacao-liquida'],
  ['adub', 'adubacao'],
  ['poda estrutural', 'poda-estrutural'],
  ['poda', 'poda'],
  ['desfolha', 'desfolha'],
  ['desaram', 'desaramacao'],
  ['aram', 'aramacao'],
  ['transplante', 'transplante'],
  ['fitossanit', 'fitossanitario'],
  ['praga', 'fitossanitario'],
  ['revis', 'revisao'],
];

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Ícone da atividade pelo nome; desconhecida usa o genérico. */
export function iconeDaAtividade(nome: string): NomeIcone {
  const n = normalizar(nome);
  return POR_TRECHO.find(([trecho]) => n.includes(trecho))?.[1] ?? 'generico';
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd web && npm test -- icones`
Expected: PASS (todos os casos).

- [ ] **Step 5: Conferir que cada nome tem arquivo**

```bash
cd web && for n in bancada colecao perfil mais registrar agendar rotina adicionar-planta fotos-lote preferencias acesso-rapido historico reagendar rega adubacao adubacao-liquida poda poda-estrutural desfolha aramacao desaramacao transplante fitossanitario revisao generico atrasada primavera verao outono inverno bancada-ativo colecao-ativo perfil-ativo; do test -f public/icones/$n.svg || echo "FALTA $n"; done
```

Expected: nenhuma linha "FALTA".

- [ ] **Step 6: Build, lint e commit**

```bash
cd web && npm run build && npm run lint && npm test
git add web/src/lib/icones.ts web/src/lib/icones.test.ts
git commit -m "feat(web): nomes de ícone e mapeamento de atividade (lib/icones)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Componente `Icone` e ícones de atividade

**Files:**
- Modify: `web/src/index.css` (classe `.icone`)
- Create: `web/src/components/Icone.tsx`
- Modify: `web/src/components/AtividadeIcone.tsx` (reescrita)
- Modify: `web/src/components/bancada/CabecalhoTarefa.tsx:9`

**Interfaces:**
- Consumes: `NomeIcone`, `urlIcone`, `iconeDaAtividade` (Task 5).
- Produces:
  - `Icone({ nome: NomeIcone, ativo?: boolean, size?: number = 22, className?: string })`;
  - `AtividadeIcone` com a mesma API de antes (`{ nome: string; size?: number; className?: string }`).

- [ ] **Step 1: Classe `.icone` em `@layer components`**

```css
  /* Ícone próprio: o SVG é a máscara, a cor vem de currentColor; URL em --icone */
  .icone {
    display: inline-block;
    flex-shrink: 0;
    background-color: currentColor;
    -webkit-mask: var(--icone) no-repeat center / contain;
    mask: var(--icone) no-repeat center / contain;
  }
```

- [ ] **Step 2: Criar `web/src/components/Icone.tsx`**

```tsx
import type { CSSProperties } from 'react';
import { urlIcone, type NomeIcone } from '@/lib/icones';

/** Ícone próprio (traço sumi). Decorativo: o nome acessível fica no botão/link que o contém. */
export function Icone({
  nome,
  ativo = false,
  size = 22,
  className = '',
}: {
  nome: NomeIcone;
  ativo?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`icone ${className}`}
      style={{ width: size, height: size, '--icone': `url(${urlIcone(nome, ativo)})` } as CSSProperties}
    />
  );
}
```

- [ ] **Step 3: Reescrever `web/src/components/AtividadeIcone.tsx`**

```tsx
import { Icone } from '@/components/Icone';
import { iconeDaAtividade } from '@/lib/icones';

/** Ícone da atividade em tinta (traço sumi); atividade desconhecida usa o genérico. */
export function AtividadeIcone({ nome, size = 18, className = '' }: { nome: string; size?: number; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center text-ink ${className}`} aria-hidden>
      <Icone nome={iconeDaAtividade(nome)} size={size} />
    </span>
  );
}
```

- [ ] **Step 4: Ícone maior no cabeçalho de tarefa**

Em `web/src/components/bancada/CabecalhoTarefa.tsx`, troque `<AtividadeIcone nome={g.nome} size={14} className="size-6" />` por:

```tsx
      <AtividadeIcone nome={g.nome} size={20} className="size-6" />
```

- [ ] **Step 5: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

- [ ] **Step 6: Verificação visual (390px)**

Confira os ícones sumi nos lugares que usam `AtividadeIcone`:
- Bancada (cabeçalho de cada tarefa);
- Acesso rápido (lista de atalhos);
- página da tarefa (`PendentesDaPlanta`);
- Agendar/Reagendar ("Já marcado nesta planta").

Uma atividade desconhecida mostra o ensō pequeno (genérico).

- [ ] **Step 7: Commit**

```bash
git add web/src/index.css web/src/components/Icone.tsx web/src/components/AtividadeIcone.tsx web/src/components/bancada/CabecalhoTarefa.tsx
git commit -m "feat(web): componente Icone e ícones sumi das atividades

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Barra de baixo F2 e ícones de ação

**Files:**
- Modify: `web/src/index.css` (classes `.linha-pincel`, `.aba-rotulo`, `.aba-nome`, `.aba-pincel`)
- Modify: `web/src/components/Layout.tsx`
- Modify: `web/src/components/Preferencias.tsx` (`BotaoPreferencias`)
- Modify: `web/src/components/bancada/AcessoRapido.tsx` (botão do topo)
- Modify: `web/src/pages/PlantDetailPage.tsx` (itens Registrar/Agendar)
- Modify: `web/src/components/tarefa/PendentesDaPlanta.tsx` (Reagendar e rótulo de rotina)

**Interfaces:**
- Consumes: `Icone`, `NomeIcone` (Tasks 5–6); `/arte/pincel-longo.webp`, `/arte/pincel-medio.webp` (Task 1); `#tinta-aspera` (Task 2).
- Produces: barra de baixo com o estado ativo F2 (desenho `-ativo` + pincelada vermelhão no lugar do nome).

- [ ] **Step 1: CSS da barra em `@layer components`**

```css
  /* Linha superior da barra de baixo em pincelada */
  .linha-pincel::before {
    content: '';
    position: absolute;
    left: 1rem;
    right: 1rem;
    top: 0;
    height: 6px;
    background-color: var(--color-ink);
    opacity: 0.55;
    -webkit-mask: url('/arte/pincel-medio.webp') no-repeat center / 100% 100%;
    mask: url('/arte/pincel-medio.webp') no-repeat center / 100% 100%;
  }
  /* Aba (F2): na ativa o nome some e uma pincelada vermelhão se pinta no lugar */
  .aba-rotulo {
    position: relative;
    display: flex;
    height: 12px;
    width: 100%;
    align-items: center;
    justify-content: center;
  }
  .aba-nome {
    transition: opacity 0.18s, transform 0.18s;
  }
  .aba-ativa .aba-nome {
    opacity: 0;
    transform: translateY(3px);
  }
  .aba-pincel {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 40px;
    height: 6px;
    transform: translate(-50%, -50%) translateX(2px);
    background-color: var(--color-hanko);
    -webkit-mask: url('/arte/pincel-longo.webp') no-repeat center / 100% 100%;
    mask: url('/arte/pincel-longo.webp') no-repeat center / 100% 100%;
    clip-path: inset(0 100% 0 0);
    transition: clip-path 0.38s cubic-bezier(0.3, 0.7, 0.2, 1) 0.05s;
  }
  .aba-ativa .aba-pincel {
    clip-path: inset(0 0 0 0);
  }
```

E, no bloco `@media (prefers-reduced-motion: reduce)` existente no fim do arquivo, acrescente os seletores:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-sheet-up,
  .animate-fade-in {
    animation: none;
  }
  .aba-nome,
  .aba-pincel {
    transition: none;
  }
}
```

- [ ] **Step 2: Reescrever a barra e o sheet em `web/src/components/Layout.tsx`**

Troque o import do Lucide por nenhum (todos os ícones do arquivo viram `Icone`) e importe:

```tsx
import { Icone } from '@/components/Icone';
import type { NomeIcone } from '@/lib/icones';
```

Troque a constante `tabs`:

```tsx
const tabs: ({ to: string; label: string; icone: NomeIcone; end?: boolean } | null)[] = [
  { to: '/', label: 'Bancada', icone: 'bancada', end: true },
  { to: '/colecao', label: 'Coleção', icone: 'colecao' },
  null, // espaço do botão +
  { to: '/perfil', label: 'Perfil', icone: 'perfil' },
];
```

Troque o `<nav>` inteiro:

```tsx
      <nav className="linha-pincel fixed inset-x-0 bottom-0 z-40 bg-bg/90 pb-safe backdrop-blur">
        <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center">
          {tabs.map((tab, i) =>
            tab ? (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                aria-label={tab.label}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'aba-ativa text-ink' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative size-[26px]">
                      <Icone nome={tab.icone} size={26} className={`absolute inset-0 transition-opacity duration-200 ${isActive ? 'opacity-0' : ''}`} />
                      <Icone nome={tab.icone} ativo size={26} className={`absolute inset-0 transition-opacity duration-200 ${isActive ? '' : 'opacity-0'}`} />
                    </span>
                    <span className="aba-rotulo">
                      <span className="aba-nome">{tab.label}</span>
                      <span className="aba-pincel" />
                    </span>
                  </>
                )}
              </NavLink>
            ) : (
              <div key={i} className="flex justify-center">
                <button
                  onClick={() => setAcoes(true)}
                  className="-mt-7 flex size-14 items-center justify-center rounded-full bg-ink text-bg shadow-lg shadow-ink/30 transition [filter:url(#tinta-aspera)] active:scale-90"
                  aria-label="Ações rápidas"
                >
                  <Icone nome="mais" size={26} />
                </button>
              </div>
            ),
          )}
        </div>
      </nav>
```

No sheet "O que você quer fazer?", troque os ícones dos `AcaoItem`:
- `<CalendarCheck size={22} />` → `<Icone nome="registrar" />`
- `<CalendarPlus size={22} />` → `<Icone nome="agendar" />`
- `<Repeat size={22} />` → `<Icone nome="rotina" />`
- `<Sprout size={22} />` → `<Icone nome="adicionar-planta" />`
- `<ImagePlus size={22} />` → `<Icone nome="fotos-lote" />`

Apague a linha `import { CalendarCheck, CalendarPlus, ClipboardList, ImagePlus, Leaf, Plus, Repeat, Sprout, User } from 'lucide-react';`.

- [ ] **Step 3: Botões do topo da Bancada**

Em `web/src/components/Preferencias.tsx`, `BotaoPreferencias`: troque `<SlidersHorizontal size={20} />` por `<Icone nome="preferencias" size={20} />`, importe `Icone` de `@/components/Icone` e apague `SlidersHorizontal` do import do Lucide (se o import ficar vazio, apague a linha).

Em `web/src/components/bancada/AcessoRapido.tsx`: troque `<Zap size={20} />` por `<Icone nome="acesso-rapido" size={20} />`, importe `Icone` e tire `Zap` do import do Lucide (`ChevronRight` e `Plus` continuam).

- [ ] **Step 4: Ações na planta e na tarefa**

Em `web/src/pages/PlantDetailPage.tsx`, nos dois `AcaoItem` (Registrar/Agendar cuidado):
- `icon={<CalendarCheck size={22} />}` → `icon={<Icone nome="registrar" />}`
- `icon={<CalendarPlus size={22} />}` → `icon={<Icone nome="agendar" />}`

Em `web/src/components/tarefa/PendentesDaPlanta.tsx`:
- `<CalendarClock size={16} /> Reagendar` → `<Icone nome="reagendar" size={16} /> Reagendar`
- `<Repeat size={12} className="inline align-[-1px]" />` → `<Icone nome="rotina" size={12} className="align-[-1px]" />`

Importe `Icone` nos dois arquivos e tire do import do Lucide os nomes que ficarem sem uso. O `npm run build` acusa os que sobrarem (`noUnusedLocals`).

- [ ] **Step 5: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

- [ ] **Step 6: Verificação visual (390px)**

Confira:
- a barra de baixo tem a linha de pincel em cima;
- tocar em Bancada/Coleção/Perfil troca o desenho para a versão cheia, o nome some e a pincelada vermelha se pinta embaixo do ícone, parecendo centrada;
- o botão + é um círculo de tinta de borda áspera;
- o sheet do + tem os 5 ícones sumi;
- os botões do topo da Bancada mostram Preferências e Acesso rápido em sumi;
- na planta, o sheet de ações mostra Registrar/Agendar em sumi;
- na tarefa, Reagendar e o rótulo de rotina aparecem em sumi;
- o leitor de tela (`aria-label`) continua dizendo o nome de cada aba.

- [ ] **Step 7: Commit**

```bash
git add web/src/index.css web/src/components/Layout.tsx web/src/components/Preferencias.tsx web/src/components/bancada/AcessoRapido.tsx web/src/pages/PlantDetailPage.tsx web/src/components/tarefa/PendentesDaPlanta.tsx
git commit -m "feat(web): barra de baixo F2 e ícones sumi das ações

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Chips de atividade em grade com mancha de tinta

**Files:**
- Modify: `web/src/index.css` (classes `.mancha`, `.mancha-on`)
- Modify: `web/src/components/care/AtividadeChips.tsx`

**Interfaces:**
- Consumes: `Icone`, `iconeDaAtividade` (Tasks 5–6); `#tinta-mancha` (Task 2).
- Produces: `AtividadeChips` com a mesma API (`value`, `onChange`, `label`, `dica`), agora em grade de ícones.

- [ ] **Step 1: CSS da mancha em `@layer components`**

```css
  /* Alvo de ícone selecionável: marcado = mancha de tinta com o ícone claro */
  .mancha {
    position: relative;
    isolation: isolate;
  }
  .mancha::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-color: var(--color-ink);
    border-radius: 48% 52% 50% 46% / 52% 47% 53% 48%;
    filter: url(#tinta-mancha);
    transform: scale(0.3);
    opacity: 0;
    transition: transform 0.28s cubic-bezier(0.3, 1.4, 0.5, 1), opacity 0.18s;
  }
  .mancha-on::before {
    transform: scale(1);
    opacity: 1;
  }
```

E acrescente `.mancha::before` aos seletores sem transição no bloco `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 2: Grade em `web/src/components/care/AtividadeChips.tsx`**

Importe `import { Icone } from '@/components/Icone';` e `import { iconeDaAtividade } from '@/lib/icones';`. Troque o `<div className="flex flex-wrap gap-2">…</div>` por:

```tsx
        <div className="grid grid-cols-4 gap-x-1.5 gap-y-3">
          {atividades.data.map((a) => {
            const marcado = value.includes(a.id);
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => tocar(a.id)}
                aria-pressed={marcado}
                className="flex flex-col items-center gap-1 text-center text-[11px] leading-tight text-ink transition active:scale-95"
              >
                <span className={`mancha flex size-12 items-center justify-center ${marcado ? 'mancha-on text-bg' : ''}`}>
                  <Icone nome={iconeDaAtividade(a.nome)} size={22} />
                </span>
                <span className={marcado ? 'font-semibold' : ''}>{a.nome}</span>
                {dica?.(a.id) && <span className="text-[10px] text-muted">{dica(a.id)}</span>}
              </button>
            );
          })}
        </div>
```

Atualize o comentário do componente para `/** Atividades em grade de ícones sumi, múltipla escolha; marcada = mancha de tinta. */`.

- [ ] **Step 3: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

- [ ] **Step 4: Verificação visual (390px)**

Em `/registrar` e `/agendar`, na etapa de atividades:
- a grade tem 4 colunas;
- tocar marca com a mancha (que "salta") e o ícone fica claro; tocar de novo desmarca;
- nomes longos ("Tratamento fitossanitário") quebram em 2 linhas sem empurrar a grade;
- a dica "há N dias" aparece sob o nome.

- [ ] **Step 5: Commit**

```bash
git add web/src/index.css web/src/components/care/AtividadeChips.tsx
git commit -m "feat(web): atividades em grade de ícones com mancha de tinta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Cartão da estação com ensō e progresso em pincelada

**Files:**
- Modify: `web/src/index.css` (classe `.progresso-pincel`)
- Modify: `web/src/components/bancada/EstacaoDoAno.tsx`
- Modify: `web/src/pages/BancadaPage.tsx` (divisória depois da estação)

**Interfaces:**
- Consumes: `Icone`, `NomeIcone` (Tasks 5–6); `/arte/enso.webp`, `/arte/pincel-fino.webp` (Task 1); `estacaoAtual()` de `@/lib/estacoes` (existente).
- Produces: `EstacaoDoAno` sem mudança de API (sem props).

- [ ] **Step 1: CSS do progresso em `@layer components`**

```css
  /* Progresso em pincelada: fundo claro + a mesma pincelada recortada até --pct */
  .progresso-pincel {
    position: relative;
    height: 8px;
  }
  .progresso-pincel::before,
  .progresso-pincel::after {
    content: '';
    position: absolute;
    inset: 0;
    -webkit-mask: url('/arte/pincel-fino.webp') no-repeat left center / 100% 100%;
    mask: url('/arte/pincel-fino.webp') no-repeat left center / 100% 100%;
  }
  .progresso-pincel::before {
    background-color: var(--color-accent-light);
  }
  .progresso-pincel::after {
    background-color: var(--color-accent);
    clip-path: inset(0 calc(100% - var(--pct)) 0 0);
  }
```

- [ ] **Step 2: Reescrever `web/src/components/bancada/EstacaoDoAno.tsx`**

```tsx
import type { CSSProperties } from 'react';
import { Icone } from '@/components/Icone';
import { ESTACOES_LISTA } from '@/lib/cuidados';
import { estacaoAtual } from '@/lib/estacoes';
import type { NomeIcone } from '@/lib/icones';
import type { Estacao } from '@/types';

const ICONE: Record<Estacao, NomeIcone> = { PRIMAVERA: 'primavera', VERAO: 'verao', OUTONO: 'outono', INVERNO: 'inverno' };
const DA_PROXIMA: Record<Estacao, string> = { PRIMAVERA: 'a primavera', VERAO: 'o verão', OUTONO: 'o outono', INVERNO: 'o inverno' };
const nome = (e: Estacao) => ESTACOES_LISTA.find((x) => x.valor === e)!.nome;

/** Estação de agora na Bancada: ensō com o ícone da estação, dias para a próxima e quanto já passou (em pincelada). */
export function EstacaoDoAno() {
  const { estacao, proxima, diasParaProxima, progresso } = estacaoAtual();
  const pct = Math.round(progresso * 100);

  return (
    <section className="mb-3 flex items-center gap-3.5" aria-label={`Estação: ${nome(estacao)}`}>
      <span className="relative size-14 shrink-0">
        <img src="/arte/enso.webp" alt="" className="absolute inset-0 size-full opacity-90" />
        <Icone nome={ICONE[estacao]} size={22} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold italic leading-tight">{nome(estacao)}</p>
        <p className="text-sm text-muted">
          {diasParaProxima === 1 ? 'amanhã começa' : `${diasParaProxima} dias para`} {DA_PROXIMA[proxima]}
        </p>
        <div
          className="progresso-pincel mt-1.5 w-40"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da estação"
          style={{ '--pct': `${Math.max(pct, 2)}%` } as CSSProperties}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Divisória depois da estação**

Em `web/src/pages/BancadaPage.tsx`, logo depois de `<EstacaoDoAno />`:

```tsx
      <span className="divisoria mb-3 w-3/4" aria-hidden />
```

- [ ] **Step 4: Build, lint e testes**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa (o `estacoes.test.ts` existente continua verde).

- [ ] **Step 5: Verificação visual (390px)**

Na Bancada, confira:
- o ensō com a flor de primavera no meio;
- "Primavera" em itálico e "70 dias para o verão" (data de hoje);
- a pincelada de progresso preenchida ~22%;
- a pincelada fina menor logo abaixo.

Compare com a tela 2 de `.superpowers/brainstorm/5764-1791838486/content/previa-geral.html`.

- [ ] **Step 6: Commit**

```bash
git add web/src/index.css web/src/components/bancada/EstacaoDoAno.tsx web/src/pages/BancadaPage.tsx
git commit -m "feat(web): estação com ensō e progresso em pincelada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Fim da fase 2, pedir OK para o push**

Mostre ao usuário a barra de baixo, `/registrar` e a Bancada lado a lado com a prévia geral, e só faça `git push` com o OK dele. Depois, atualize o `CLAUDE.md` (seção Frontend web) com uma linha:

```markdown
Visual "Caderno de sumi" (spec `2026-10-12-identidade-nagare-sumi-design.md`): peças em `web/public/arte`, ícones próprios em `web/public/icones` via `components/Icone.tsx` + `src/lib/icones.ts` (`iconeDaAtividade`), filtros de tinta em `components/FiltrosTinta.tsx` (raiz do App); `.chip-active` = mancha de tinta; novas peças pela skill `criando-assets-sumi`.
```

e faça o commit `docs: CLAUDE.md com o visual sumi`.
