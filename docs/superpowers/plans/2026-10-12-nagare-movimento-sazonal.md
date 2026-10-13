# Nagare: movimento sazonal (fase 4). Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pétalas, folhas ou neve caindo atrás do conteúdo das telas principais, conforme a estação. A preferência "Animações sazonais" fica no aparelho, e a tela da estação abre ao tocar no cartão `EstacaoDoAno`.

**Architecture:**
- As regras puras ficam em `src/lib/particulas.ts`, testadas com Vitest: cena por estação, sorteio, passo do movimento, reposição e "ligado ou não".
- O componente `ParticulasEstacao` só desenha: um laço `requestAnimationFrame`, nós criados uma vez e mexidos só por `transform`. Ele é montado no `Layout`, numa camada `fixed` com `z-index` negativo, atrás de tudo.
- A preferência usa `useEscolha` (`localStorage`). `Layout` e `PreferenciasPage` nunca estão montados juntos, porque `/perfil/preferencias` fica fora do `Layout`. Por isso basta ler a escolha ao montar.
- A tela da estação é um `Sheet` novo (`EstacaoSheet`). Os textos (período, "N dias para…") viram funções puras em `src/lib/estacoes.ts`.

**Tech Stack:**
- React 19 + Vite + TypeScript;
- Tailwind v4 (`src/index.css`);
- Vitest (ambiente `node`, `src/**/*.test.ts`);
- Python 3 + Pillow para converter as peças.

**Spec:** `docs/superpowers/specs/2026-10-12-identidade-nagare-sumi-design.md`, seção 5 (e 7.4 e 8).

## Global Constraints

- Idioma: código, comentários e textos em **português**.
- Nenhuma dependência nova no `web/`.
- Valores aprovados das partículas, sem mudar:
  - **7 partículas na tela**;
  - **tamanho 17px (±35%)**;
  - **velocidade 112px/s × fator 0,55 (±30%)**;
  - **vento 40%**;
  - **opacidade 38%**.
- Primavera = pétalas (15 peças), outono = folhas (10 peças), inverno = neve (pontos de tinta clara feitos em código), verão = nada.
- Só `transform` no laço (nada de `top`/`left`/`width` por quadro). O laço pausa com `document.hidden`.
- Desligado quando `prefers-reduced-motion: reduce` ou quando a preferência "Animações sazonais" está desligada. A preferência fica no aparelho (`localStorage`) e vem **ligada** por padrão.
- Peças em WebP (qualidade 85), em `web/public/arte/`, sempre com `alt=""`:
  - partículas com maior lado 72px;
  - ilustrações da estação com maior lado ≤ 800px.
  - A ilustração da estação só baixa quando o sheet abre.
- Toda `mask` em CSS vai acompanhada de `-webkit-mask`.
- Antes de cada commit: `cd web && npm run build && npm run lint && npm test` sem erro novo (os avisos `only-export-components` já existiam).
- Commits na `main`. **Push = deploy**: só com o OK do usuário, ao fim do plano.
- Mensagens de commit terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Arquivos `.tsx` deste projeto podem estar em CRLF. Edições por script preservam a quebra de linha do arquivo.

## Review Focus

1. **As partículas nunca podem cobrir nem roubar toque**:
   - a camada é `pointer-events:none` e fica atrás dos cards e da barra de baixo (Task 3);
   - verificação: tocar num card com uma folha passando por cima.
2. **Aba em segundo plano / celular bloqueado**: ao voltar, as partículas não podem dar um salto nem se acumular. O `dt` é limitado a 0,05s e o relógio recomeça ao voltar (Task 2, teste de `mover` com `dt` limitado; Task 3, `visibilitychange`).
3. **Girar a tela ou mudar o tamanho da janela**: as partículas continuam caindo na largura nova, sem sumir todas de uma vez (Task 3: `resize` atualiza largura/altura; a reposição usa a medida atual).
4. **Preferência desligada ou movimento reduzido no meio do uso**: desligar em Preferências e voltar à Bancada mostra a tela sem partículas; mudar o movimento reduzido no sistema com o app aberto desliga na hora (Task 3, `useMenosMovimento` escuta `change`).
5. **`localStorage` indisponível** (aba anônima no Safari): a preferência vale como "ligada" e nada quebra (`useEscolha` já trata; Task 2 testa `animacoesLigadas` com o padrão).

---

### Task 1: Peças da fase 4 (partículas e estações)

**Files:**
- Create: `web/public/arte/particulas/folha-1.webp` … `folha-10.webp`
- Create: `web/public/arte/particulas/petala-1.webp` … `petala-15.webp`
- Create: `web/public/arte/estacao-primavera.webp`, `estacao-verao.webp`, `estacao-outono.webp`, `estacao-inverno.webp`

**Interfaces:**
- Produces:
  - URLs `/arte/particulas/folha-N.webp` (N = 1…10);
  - `/arte/particulas/petala-N.webp` (N = 1…15);
  - `/arte/estacao-{primavera,verao,outono,inverno}.webp`.

As peças já foram recortadas (fundo transparente) pela skill `criando-assets-sumi` durante o brainstorming e estão em `.superpowers/brainstorm/5764-1791838486/content/` (fora do git):
- `folha-1…10.png` são as folhas aprovadas na prévia `outono-folhas.html`;
- `g-petala-1…15.png` são as pétalas;
- `g-estacao-1…4.png` são, nesta ordem, primavera (brotos), verão (copa cheia), outono (folhas vermelhas caindo) e inverno (neve no vaso).

Esta task só converte para WebP no tamanho final.

- [ ] **Step 1: Converter as peças**

Rode da raiz do repositório:

```bash
python - <<'EOF'
from pathlib import Path
from PIL import Image

ORIGEM = Path('.superpowers/brainstorm/5764-1791838486/content')
ARTE = Path('web/public/arte')
(ARTE / 'particulas').mkdir(parents=True, exist_ok=True)

def salvar(src, dst, lado):
    im = Image.open(src).convert('RGBA')
    im.thumbnail((lado, lado), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=85, method=6)
    print(dst, im.size, dst.stat().st_size)

for i in range(1, 11):
    salvar(ORIGEM / f'folha-{i}.png', ARTE / 'particulas' / f'folha-{i}.webp', 72)
for i in range(1, 16):
    salvar(ORIGEM / f'g-petala-{i}.png', ARTE / 'particulas' / f'petala-{i}.webp', 72)
for i, nome in enumerate(['primavera', 'verao', 'outono', 'inverno'], 1):
    salvar(ORIGEM / f'g-estacao-{i}.png', ARTE / f'estacao-{nome}.webp', 700)
EOF
```

Expected: 29 linhas impressas. Partículas com maior lado 72 e cerca de 2–5 KB cada; estações com 700px de altura e menos de 120 KB cada.

- [ ] **Step 2: Conferir peso e aparência**

```bash
du -ch web/public/arte/particulas/*.webp web/public/arte/estacao-*.webp | tail -1
```

Expected: total abaixo de 600 KB. Somado às peças das fases 1–3, o total de imagens novas tem que ficar ≤ 1,5 MB:

```bash
du -ch web/public/arte | tail -1
```

Abra 2 ou 3 arquivos com o Read (imagens) e confira se ficaram com fundo transparente, sem borda branca.

- [ ] **Step 3: Commit**

```bash
git add web/public/arte/particulas web/public/arte/estacao-*.webp
git commit -m "feat(web): peças das partículas e das estações (sumi)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Regras puras das partículas (`particulas.ts`)

**Files:**
- Create: `web/src/lib/particulas.ts`
- Test: `web/src/lib/particulas.test.ts`

**Interfaces:**
- Consumes: `Estacao` de `@/types` (`'PRIMAVERA' | 'VERAO' | 'OUTONO' | 'INVERNO'`).
- Produces:
  - `PARAMETROS`, com `{ quantidade: 7, tamanho: 17, variacaoTamanho: 0.35, velocidade: 112, fatorVelocidade: 0.55, variacaoVelocidade: 0.3, vento: 0.4, opacidade: 0.38, dtMaximo: 0.05 }`;
  - `type TipoParticula = 'petala' | 'folha' | 'neve'`;
  - `interface CenaEstacao { tipo: TipoParticula; sprites: readonly string[] }`;
  - `cenaDaEstacao(e: Estacao): CenaEstacao | null`, que devolve **sempre o mesmo objeto** por estação (serve de dependência estável de `useEffect`);
  - `estacaoDasParticulas(real: Estacao, teste: string | null): Estacao`;
  - `type Sorteio = () => number`, com valor em [0, 1);
  - `interface Particula { sprite: string | null; tamanho: number; x: number; y: number; queda: number; amplitude: number; frequencia: number; fase: number; giro: number; velocidadeGiro: number; virada: number }`;
  - `sortearParticula(cena: CenaEstacao, largura: number, altura: number, sorteio: Sorteio, inicio: boolean): Particula`;
  - `ventoNoTempo(t: number): number`, em px/s;
  - `mover(p: Particula, dt: number, vento: number): Particula`, que devolve um objeto novo;
  - `interface Desenho { x: number; y: number; rotacao: number; escalaX: number }`;
  - `desenho(p: Particula, t: number, tipo: TipoParticula): Desenho`;
  - `saiuDaTela(p: Particula, largura: number, altura: number): boolean`;
  - `CHAVE_ANIMACOES = 'bonsai_animacoes_sazonais'`;
  - `OPCOES_ANIMACOES: { value: 'sim' | 'nao' }[]`;
  - `type Animacoes = 'sim' | 'nao'`;
  - `animacoesLigadas(o: { preferencia: Animacoes; menosMovimento: boolean; cena: CenaEstacao | null }): boolean`;
  - `CHAVE_ESTACAO_TESTE = 'bonsai_estacao_teste'`.

O movimento é o da prévia aprovada (`outono-folhas.html`), com os nomes em português:
- balanço lateral senoidal;
- giro constante;
- "virada" achatando o `scaleX`;
- vento que oscila devagar.

- [ ] **Step 1: Escrever os testes (falhando)**

`web/src/lib/particulas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  PARAMETROS,
  animacoesLigadas,
  cenaDaEstacao,
  desenho,
  estacaoDasParticulas,
  mover,
  saiuDaTela,
  sortearParticula,
  ventoNoTempo,
  type Sorteio,
} from './particulas';

/** Sorteio previsível: sempre o mesmo valor. */
const fixo = (v: number): Sorteio => () => v;
/** Sorteio pseudoaleatório com semente (LCG), para varrer muitos casos. */
function semente(s: number): Sorteio {
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('cenaDaEstacao', () => {
  it('primavera = 15 pétalas, outono = 10 folhas', () => {
    const p = cenaDaEstacao('PRIMAVERA')!;
    expect(p.tipo).toBe('petala');
    expect(p.sprites).toHaveLength(15);
    expect(p.sprites[0]).toBe('/arte/particulas/petala-1.webp');
    const o = cenaDaEstacao('OUTONO')!;
    expect(o.tipo).toBe('folha');
    expect(o.sprites).toHaveLength(10);
    expect(o.sprites[9]).toBe('/arte/particulas/folha-10.webp');
  });

  it('inverno = neve feita em código (sem imagens)', () => {
    expect(cenaDaEstacao('INVERNO')).toEqual({ tipo: 'neve', sprites: [] });
  });

  it('verão não tem partículas', () => {
    expect(cenaDaEstacao('VERAO')).toBeNull();
  });

  it('mesmo objeto a cada chamada (dependência estável)', () => {
    expect(cenaDaEstacao('OUTONO')).toBe(cenaDaEstacao('OUTONO'));
  });
});

describe('estacaoDasParticulas', () => {
  it('sem estação de teste, usa a real', () => {
    expect(estacaoDasParticulas('PRIMAVERA', null)).toBe('PRIMAVERA');
  });
  it('estação de teste válida substitui a real', () => {
    expect(estacaoDasParticulas('PRIMAVERA', 'INVERNO')).toBe('INVERNO');
  });
  it('valor estranho é ignorado', () => {
    expect(estacaoDasParticulas('OUTONO', 'nevasca')).toBe('OUTONO');
    expect(estacaoDasParticulas('OUTONO', 'toString')).toBe('OUTONO');
  });
});

describe('sortearParticula', () => {
  const folhas = cenaDaEstacao('OUTONO')!;

  it('tamanho em 17px ±35% e queda em ±30%', () => {
    const r = semente(7);
    for (let i = 0; i < 300; i++) {
      const p = sortearParticula(folhas, 390, 800, r, true);
      expect(p.tamanho).toBeGreaterThanOrEqual(17 * 0.65);
      expect(p.tamanho).toBeLessThanOrEqual(17 * 1.35);
      expect(p.queda).toBeGreaterThanOrEqual(0.7);
      expect(p.queda).toBeLessThanOrEqual(1.3);
      expect(folhas.sprites).toContain(p.sprite);
    }
  });

  it('no começo espalha pela tela inteira; na reposição nasce acima do topo', () => {
    const r = semente(3);
    const inicio = Array.from({ length: 200 }, () => sortearParticula(folhas, 390, 800, r, true));
    expect(Math.max(...inicio.map((p) => p.y))).toBeGreaterThan(400);
    const repostas = Array.from({ length: 200 }, () => sortearParticula(folhas, 390, 800, r, false));
    for (const p of repostas) expect(p.y).toBeLessThan(0);
  });

  it('nasce dentro da largura (com folga de 20px à esquerda)', () => {
    expect(sortearParticula(folhas, 390, 800, fixo(0), true).x).toBe(-20);
    expect(sortearParticula(folhas, 390, 800, fixo(0.999999), true).x).toBeCloseTo(390, 2);
  });

  it('neve não tem imagem e é menor que folha', () => {
    const neve = sortearParticula(cenaDaEstacao('INVERNO')!, 390, 800, fixo(0.5), true);
    const folha = sortearParticula(folhas, 390, 800, fixo(0.5), true);
    expect(neve.sprite).toBeNull();
    expect(neve.tamanho).toBeLessThan(folha.tamanho);
  });
});

describe('mover', () => {
  const p = sortearParticula(cenaDaEstacao('OUTONO')!, 390, 800, fixo(0.5), true);

  it('cai a 112 × 0,55 × queda px/s e o vento empurra para o lado', () => {
    const q = mover(p, 0.05, 10);
    expect(q.y - p.y).toBeCloseTo(112 * 0.55 * p.queda * 0.05, 5);
    expect(q.x - p.x).toBeCloseTo(10 * 0.05, 5);
    expect(q).not.toBe(p);
  });

  it('dt grande (aba voltando do fundo) é limitado: sem salto', () => {
    const q = mover(p, 5, 0);
    expect(q.y - p.y).toBeCloseTo(112 * 0.55 * p.queda * PARAMETROS.dtMaximo, 5);
  });
});

describe('ventoNoTempo', () => {
  it('vento de 40% oscila entre 0,2 e 1 × 0,4 × 28 px/s, sempre para a direita', () => {
    for (let t = 0; t < 60; t += 0.7) {
      const v = ventoNoTempo(t);
      expect(v).toBeGreaterThanOrEqual(0.4 * 28 * 0.2 - 1e-9);
      expect(v).toBeLessThanOrEqual(0.4 * 28 + 1e-9);
    }
  });
});

describe('desenho', () => {
  const p = sortearParticula(cenaDaEstacao('OUTONO')!, 390, 800, fixo(0.5), true);

  it('folha vira de lado: scaleX entre 0,35 e 1', () => {
    for (let t = 0; t < 20; t += 0.3) {
      const d = desenho(p, t, 'folha');
      expect(d.escalaX).toBeGreaterThanOrEqual(0.35);
      expect(d.escalaX).toBeLessThanOrEqual(1);
      expect(d.y).toBe(p.y);
    }
  });

  it('neve não gira nem vira', () => {
    const d = desenho(p, 3, 'neve');
    expect(d.rotacao).toBe(0);
    expect(d.escalaX).toBe(1);
  });
});

describe('saiuDaTela', () => {
  const base = sortearParticula(cenaDaEstacao('OUTONO')!, 390, 800, fixo(0.5), true);
  it('abaixo do fundo (com folga) ou passou da direita → repor', () => {
    expect(saiuDaTela({ ...base, y: 841 }, 390, 800)).toBe(true);
    expect(saiuDaTela({ ...base, x: 451 }, 390, 800)).toBe(true);
  });
  it('ainda caindo na tela → fica', () => {
    expect(saiuDaTela({ ...base, x: 200, y: 400 }, 390, 800)).toBe(false);
    expect(saiuDaTela({ ...base, x: 200, y: -60 }, 390, 800)).toBe(false);
  });
});

describe('animacoesLigadas', () => {
  const cena = cenaDaEstacao('OUTONO');
  it('ligadas por padrão, com movimento normal', () => {
    expect(animacoesLigadas({ preferencia: 'sim', menosMovimento: false, cena })).toBe(true);
  });
  it('preferência desligada → desligadas', () => {
    expect(animacoesLigadas({ preferencia: 'nao', menosMovimento: false, cena })).toBe(false);
  });
  it('sistema pede menos movimento → desligadas', () => {
    expect(animacoesLigadas({ preferencia: 'sim', menosMovimento: true, cena })).toBe(false);
  });
  it('verão (sem cena) → nada para desenhar', () => {
    expect(animacoesLigadas({ preferencia: 'sim', menosMovimento: false, cena: null })).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd web && npx vitest run src/lib/particulas.test.ts`
Expected: FAIL, "Failed to resolve import './particulas'".

- [ ] **Step 3: Implementar `web/src/lib/particulas.ts`**

```ts
import type { Estacao } from '@/types';

/** Valores aprovados na prévia (outono-folhas.html). */
export const PARAMETROS = {
  quantidade: 7,
  tamanho: 17, // px
  variacaoTamanho: 0.35,
  velocidade: 112, // px/s
  fatorVelocidade: 0.55,
  variacaoVelocidade: 0.3,
  vento: 0.4,
  opacidade: 0.38,
  /** Maior passo de tempo por quadro: a aba voltando do fundo não dá salto. */
  dtMaximo: 0.05,
} as const;

/** Neve é ponto de tinta, menor que folha e pétala. */
const ESCALA_NEVE = 0.4;

export type TipoParticula = 'petala' | 'folha' | 'neve';

export interface CenaEstacao {
  tipo: TipoParticula;
  sprites: readonly string[];
}

const sprites = (prefixo: string, total: number) =>
  Array.from({ length: total }, (_, i) => `/arte/particulas/${prefixo}-${i + 1}.webp`);

// Objetos fixos: a mesma estação devolve sempre a mesma cena (dependência estável de efeito)
const CENAS: Record<Estacao, CenaEstacao | null> = {
  PRIMAVERA: { tipo: 'petala', sprites: sprites('petala', 15) },
  VERAO: null,
  OUTONO: { tipo: 'folha', sprites: sprites('folha', 10) },
  INVERNO: { tipo: 'neve', sprites: [] },
};

/** O que cai em cada estação; verão = nada. */
export function cenaDaEstacao(e: Estacao): CenaEstacao | null {
  return CENAS[e];
}

/** Estação forçada para conferir as cenas no navegador (só em desenvolvimento). */
export const CHAVE_ESTACAO_TESTE = 'bonsai_estacao_teste';

export function estacaoDasParticulas(real: Estacao, teste: string | null): Estacao {
  return teste && Object.hasOwn(CENAS, teste) ? (teste as Estacao) : real;
}

/** Número em [0, 1), como Math.random. */
export type Sorteio = () => number;

export interface Particula {
  sprite: string | null;
  tamanho: number;
  x: number;
  y: number;
  /** Fator da velocidade de queda (±30%). */
  queda: number;
  /** Balanço lateral, em px. */
  amplitude: number;
  frequencia: number;
  fase: number;
  /** Rotação atual, em graus. */
  giro: number;
  velocidadeGiro: number;
  /** Ritmo da "virada" (achata como se girasse de lado). */
  virada: number;
}

const entre = (sorteio: Sorteio, min: number, max: number) => min + sorteio() * (max - min);

/** Partícula nova: no começo espalhada pela tela; na reposição, logo acima do topo. */
export function sortearParticula(cena: CenaEstacao, largura: number, altura: number, sorteio: Sorteio, inicio: boolean): Particula {
  const { tamanho, variacaoTamanho, variacaoVelocidade } = PARAMETROS;
  const escala = cena.tipo === 'neve' ? ESCALA_NEVE : 1;
  return {
    sprite: cena.sprites.length ? cena.sprites[Math.floor(sorteio() * cena.sprites.length)] : null,
    tamanho: tamanho * escala * entre(sorteio, 1 - variacaoTamanho, 1 + variacaoTamanho),
    x: entre(sorteio, -20, largura),
    y: inicio ? entre(sorteio, -altura * 0.2, altura) : entre(sorteio, -80, -30),
    queda: entre(sorteio, 1 - variacaoVelocidade, 1 + variacaoVelocidade),
    amplitude: entre(sorteio, 12, 34),
    frequencia: entre(sorteio, 0.5, 1.1),
    fase: entre(sorteio, 0, Math.PI * 2),
    giro: entre(sorteio, 0, 360),
    velocidadeGiro: entre(sorteio, -40, 40),
    virada: entre(sorteio, 0.6, 1.6),
  };
}

/** Vento em px/s: sopra para a direita e oscila devagar. */
export function ventoNoTempo(t: number): number {
  return PARAMETROS.vento * 28 * (0.6 + 0.4 * Math.sin(t * 0.25));
}

/** Avança a partícula `dt` segundos (limitado a `dtMaximo`). */
export function mover(p: Particula, dt: number, vento: number): Particula {
  const passo = Math.min(dt, PARAMETROS.dtMaximo);
  return {
    ...p,
    y: p.y + PARAMETROS.velocidade * PARAMETROS.fatorVelocidade * p.queda * passo,
    x: p.x + vento * passo,
    giro: p.giro + p.velocidadeGiro * passo,
  };
}

export interface Desenho {
  x: number;
  y: number;
  rotacao: number;
  escalaX: number;
}

/** Onde e como desenhar no instante `t` (balanço, giro e virada); neve só balança. */
export function desenho(p: Particula, t: number, tipo: TipoParticula): Desenho {
  const balanco = Math.sin(t * p.frequencia + p.fase) * p.amplitude;
  if (tipo === 'neve') return { x: p.x + balanco, y: p.y, rotacao: 0, escalaX: 1 };
  const vira = Math.cos(t * p.virada + p.fase);
  return { x: p.x + balanco, y: p.y, rotacao: p.giro + balanco * 0.8, escalaX: 0.35 + 0.65 * Math.abs(vira) };
}

/** Passou do fundo ou da borda direita: hora de repor no topo. */
export function saiuDaTela(p: Particula, largura: number, altura: number): boolean {
  return p.y > altura + 40 || p.x > largura + 60;
}

/** Preferência "Animações sazonais", guardada no aparelho. */
export const CHAVE_ANIMACOES = 'bonsai_animacoes_sazonais';
export type Animacoes = 'sim' | 'nao';
export const OPCOES_ANIMACOES: { value: Animacoes }[] = [{ value: 'sim' }, { value: 'nao' }];

export function animacoesLigadas({ preferencia, menosMovimento, cena }: { preferencia: Animacoes; menosMovimento: boolean; cena: CenaEstacao | null }): boolean {
  return preferencia === 'sim' && !menosMovimento && cena !== null;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd web && npx vitest run src/lib/particulas.test.ts`
Expected: PASS (todos os testes de `particulas.test.ts`).

- [ ] **Step 5: Lint, build e commit**

```bash
cd web && npm run build && npm run lint && npm test
git add web/src/lib/particulas.ts web/src/lib/particulas.test.ts
git commit -m "feat(web): regras das partículas sazonais

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `ParticulasEstacao` no `Layout` + preferência "Animações sazonais"

**Files:**
- Create: `web/src/lib/movimento.ts`
- Create: `web/src/components/ParticulasEstacao.tsx`
- Modify: `web/src/components/Layout.tsx` (montar a camada, primeira coisa dentro do `div` raiz)
- Modify: `web/src/pages/ProfilePages.tsx` (`AnimacoesSazonaisPreferencia` + seção "Neste aparelho" em `PreferenciasPage`)

**Interfaces:**
- Consumes:
  - da Task 2, `PARAMETROS`, `cenaDaEstacao`, `estacaoDasParticulas`, `CHAVE_ESTACAO_TESTE`, `sortearParticula`, `mover`, `desenho`, `ventoNoTempo`, `saiuDaTela`, `animacoesLigadas`, `CHAVE_ANIMACOES`, `OPCOES_ANIMACOES`, `type Particula`, `type CenaEstacao`;
  - `estacaoAtual()` de `@/lib/estacoes`;
  - `useEscolha(chave, padrao, validos)` de `@/lib/escolhas`.
- Produces:
  - `useMenosMovimento(): boolean`, em `@/lib/movimento` (a fase 5, abertura, reaproveita);
  - `<ParticulasEstacao />`, sem props.

- [ ] **Step 1: `web/src/lib/movimento.ts`**

```ts
import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function assinar(avisar: () => void) {
  if (typeof matchMedia === 'undefined') return () => {};
  const mq = matchMedia(CONSULTA);
  mq.addEventListener('change', avisar);
  return () => mq.removeEventListener('change', avisar);
}

const agora = () => typeof matchMedia !== 'undefined' && matchMedia(CONSULTA).matches;

/** O sistema pediu menos movimento? Acompanha a mudança com o app aberto. */
export function useMenosMovimento(): boolean {
  return useSyncExternalStore(assinar, agora, () => false);
}
```

- [ ] **Step 2: `web/src/components/ParticulasEstacao.tsx`**

O componente renderiza uma `div` vazia. Os nós das partículas são criados uma vez dentro do efeito e mexidos só por `style.transform`, sem re-render do React por quadro.

```tsx
import { useEffect, useRef } from 'react';
import { estacaoAtual } from '@/lib/estacoes';
import { useEscolha } from '@/lib/escolhas';
import { useMenosMovimento } from '@/lib/movimento';
import {
  CHAVE_ANIMACOES,
  CHAVE_ESTACAO_TESTE,
  OPCOES_ANIMACOES,
  PARAMETROS,
  animacoesLigadas,
  cenaDaEstacao,
  desenho,
  estacaoDasParticulas,
  mover,
  saiuDaTela,
  sortearParticula,
  ventoNoTempo,
  type CenaEstacao,
  type Particula,
} from '@/lib/particulas';

/** Só em desenvolvimento: localStorage bonsai_estacao_teste = OUTONO|INVERNO|… força a cena. */
function estacaoDeTeste(): string | null {
  if (!import.meta.env.DEV) return null;
  try {
    return localStorage.getItem(CHAVE_ESTACAO_TESTE);
  } catch {
    return null;
  }
}

function criarNo(cena: CenaEstacao): HTMLElement {
  if (cena.tipo === 'neve') {
    const ponto = document.createElement('span');
    ponto.className = 'particula-neve';
    return ponto;
  }
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  img.className = 'particula';
  return img;
}

/** Ajusta imagem e tamanho do nó para a partícula (só ao nascer ou repor, nunca por quadro). */
function vestir(no: HTMLElement, p: Particula) {
  if (p.sprite && no instanceof HTMLImageElement) no.src = p.sprite;
  no.style.width = `${p.tamanho}px`;
  if (!p.sprite) no.style.height = `${p.tamanho}px`;
}

/** Pétalas, folhas ou neve caindo atrás do conteúdo, conforme a estação. Verão: nada. */
export function ParticulasEstacao() {
  const [preferencia] = useEscolha(CHAVE_ANIMACOES, 'sim', OPCOES_ANIMACOES);
  const menosMovimento = useMenosMovimento();
  const cena = cenaDaEstacao(estacaoDasParticulas(estacaoAtual().estacao, estacaoDeTeste()));
  const ligada = animacoesLigadas({ preferencia, menosMovimento, cena });
  const camada = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = camada.current;
    if (!ligada || !cena || !el) return;

    let largura = window.innerWidth;
    let altura = window.innerHeight;
    const nos: HTMLElement[] = [];
    let particulas: Particula[] = [];
    for (let i = 0; i < PARAMETROS.quantidade; i++) {
      const p = sortearParticula(cena, largura, altura, Math.random, true);
      const no = criarNo(cena);
      vestir(no, p);
      el.appendChild(no);
      nos.push(no);
      particulas.push(p);
    }

    let raf = 0;
    let ultimo = performance.now();
    let t = 0;
    const quadro = (instante: number) => {
      const dt = Math.min((instante - ultimo) / 1000, PARAMETROS.dtMaximo);
      ultimo = instante;
      t += dt;
      const vento = ventoNoTempo(t);
      particulas = particulas.map((p, i) => {
        let q = mover(p, dt, vento);
        if (saiuDaTela(q, largura, altura)) {
          q = sortearParticula(cena, largura, altura, Math.random, false);
          vestir(nos[i], q);
        }
        const d = desenho(q, t, cena.tipo);
        nos[i].style.transform = `translate3d(${d.x}px, ${d.y}px, 0) rotate(${d.rotacao}deg) scaleX(${d.escalaX})`;
        return q;
      });
      raf = requestAnimationFrame(quadro);
    };

    // Aba no fundo: para o laço; ao voltar, recomeça o relógio (sem salto)
    const visibilidade = () => {
      cancelAnimationFrame(raf);
      if (document.hidden) return;
      ultimo = performance.now();
      raf = requestAnimationFrame(quadro);
    };
    const redimensionar = () => {
      largura = window.innerWidth;
      altura = window.innerHeight;
    };

    document.addEventListener('visibilitychange', visibilidade);
    window.addEventListener('resize', redimensionar);
    if (!document.hidden) raf = requestAnimationFrame(quadro);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibilidade);
      window.removeEventListener('resize', redimensionar);
      el.replaceChildren();
    };
  }, [ligada, cena]);

  if (!ligada) return null;
  return (
    <div
      ref={camada}
      aria-hidden="true"
      className="particulas-estacao pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: PARAMETROS.opacidade }}
    />
  );
}
```

- [ ] **Step 3: CSS das partículas em `web/src/index.css`**

Acrescente dentro do mesmo `@layer components` onde estão `.aba-pincel` e `.mancha`, logo depois de `.progresso-pincel::after { … }`:

```css
  /* Partículas sazonais (ParticulasEstacao): mexidas só por transform */
  .particulas-estacao .particula,
  .particulas-estacao .particula-neve {
    position: absolute;
    left: 0;
    top: 0;
    will-change: transform;
    user-select: none;
  }
  .particulas-estacao .particula-neve {
    border-radius: 50%;
    background: radial-gradient(circle, var(--color-muted) 0 45%, transparent 72%);
  }
```

Por que `-z-10` funciona: nem o `html` nem o `#root` nem o `div` raiz do `Layout` criam contexto de empilhamento, e o fundo do `body` (papel) se propaga para o canvas. Por isso a camada fica acima do papel e abaixo de todo o conteúdo. Se algum ancestral ganhar `transform`, `filter` ou `isolation`, a camada passa a ficar por cima do papel desse ancestral. Confira isso no Step 6.

- [ ] **Step 4: Montar no `Layout`**

Em `web/src/components/Layout.tsx`:

```tsx
import { ParticulasEstacao } from '@/components/ParticulasEstacao';
```

e, dentro do `return`, como primeiro filho do `div` raiz:

```tsx
    <div className="min-h-dvh pb-24">
      <ParticulasEstacao />
      <Outlet />
```

- [ ] **Step 5: Preferência em `PreferenciasPage`**

Em `web/src/pages/ProfilePages.tsx`, importe:

```tsx
import { useEscolha } from '@/lib/escolhas';
import { useMenosMovimento } from '@/lib/movimento';
import { CHAVE_ANIMACOES, OPCOES_ANIMACOES } from '@/lib/particulas';
```

Acrescente o componente antes de `export function PreferenciasPage()`:

```tsx
/** "Animações sazonais": guardada no aparelho, como o aberto/fechado de Mais opções. */
function AnimacoesSazonaisPreferencia() {
  const [valor, setValor] = useEscolha(CHAVE_ANIMACOES, 'sim', OPCOES_ANIMACOES);
  const menosMovimento = useMenosMovimento();

  return (
    <section className="card mt-4 p-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="size-5 shrink-0 accent-primary"
          checked={valor === 'sim'}
          onChange={(e) => setValor(e.target.checked ? 'sim' : 'nao')}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Animações sazonais</span>
          <span className="block text-xs text-muted">
            {menosMovimento
              ? 'O aparelho pediu menos movimento, então as animações ficam paradas.'
              : 'Pétalas, folhas ou neve caindo ao fundo, conforme a estação.'}
          </span>
        </span>
      </label>
    </section>
  );
}
```

E no fim de `PreferenciasPage`, depois de `<MoverTransplantePreferencia />`:

```tsx
        <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted">Neste aparelho</h2>
        <AnimacoesSazonaisPreferencia />
```

- [ ] **Step 6: Verificação no navegador local**

1. Suba o app: Docker com a API (`docker compose up`) e `cd web && npm run dev`. Use a conta local de teste da memória `local-browser-testing.md`, num iframe de 390px.
2. Com a data de hoje (primavera), a Bancada mostra pétalas caindo atrás dos cards.
   - Confira que um card tocado por cima de uma pétala abre normalmente.
   - Confira que a barra de baixo fica por cima das pétalas.
3. Force as outras cenas pelo console (`javascript_tool`): `localStorage.setItem('bonsai_estacao_teste','OUTONO')` e recarregue (folhas). Repita com `INVERNO` (pontos de neve claros e visíveis no papel) e `VERAO` (nada). No fim, `localStorage.removeItem('bonsai_estacao_teste')`.
4. Perfil → Preferências → desmarque "Animações sazonais" e volte à Bancada: sem partículas. Marque de novo: voltam.
5. DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce": as partículas somem na hora, e o texto da preferência muda.
6. Performance (DevTools, 6× CPU slowdown, 10s gravando): sem "Layout" nem "Recalculate Style" por quadro vindos da camada, só "Composite".
7. Troque de aba por 30s e volte: as partículas continuam de onde estavam, sem um bando entrando junto.

- [ ] **Step 7: Lint, build e commit**

```bash
cd web && npm run build && npm run lint && npm test
git add web/src/lib/movimento.ts web/src/components/ParticulasEstacao.tsx web/src/components/Layout.tsx web/src/pages/ProfilePages.tsx web/src/index.css
git commit -m "feat(web): pétalas, folhas e neve caindo conforme a estação

Preferência \"Animações sazonais\" no aparelho; desliga com movimento reduzido.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Tela da estação (`EstacaoSheet`)

**Files:**
- Modify: `web/src/lib/estacoes.ts` (`periodoDaEstacao`, `faltaParaProxima`)
- Modify: `web/src/lib/estacoes.test.ts`
- Modify: `web/src/lib/icones.ts` (`ICONE_DA_ESTACAO`)
- Modify: `web/src/lib/arte.ts` (`ilustracaoDaEstacao`)
- Modify: `web/src/lib/arte.test.ts`
- Create: `web/src/components/bancada/EstacaoSheet.tsx`
- Modify: `web/src/components/bancada/EstacaoDoAno.tsx` (vira botão que abre o sheet; usa as funções novas)
- Modify: `web/src/index.css` (`.estacao-pincel` + movimento reduzido)

**Interfaces:**
- Consumes:
  - `estacaoAtual()` (`{ estacao, proxima, diasParaProxima, progresso }`);
  - `ESTACOES_LISTA` de `@/lib/cuidados` (`{ valor, nome, curto }[]`, na ordem primavera → inverno);
  - `Sheet({ open, onClose, title, children })`;
  - `Icone({ nome, size, className })`;
  - as peças `/arte/estacao-*.webp` da Task 1.
- Produces:
  - `periodoDaEstacao(e: Estacao): string`, por exemplo "22 de setembro a 20 de dezembro";
  - `faltaParaProxima(a: { proxima: Estacao; diasParaProxima: number }): string`, por exemplo "70 dias para o verão" ou "amanhã começa o verão";
  - `ICONE_DA_ESTACAO: Record<Estacao, NomeIcone>`;
  - `ilustracaoDaEstacao(e: Estacao): string`;
  - `<EstacaoSheet open onClose />`.

- [ ] **Step 1: Testes (falhando)**

Acrescente ao fim de `web/src/lib/estacoes.test.ts`, trocando o import do topo por `import { estacaoAtual, faltaParaProxima, periodoDaEstacao } from './estacoes';`:

```ts
describe('periodoDaEstacao', () => {
  it('datas de começo e fim por extenso', () => {
    expect(periodoDaEstacao('PRIMAVERA')).toBe('22 de setembro a 20 de dezembro');
    expect(periodoDaEstacao('VERAO')).toBe('21 de dezembro a 19 de março');
    expect(periodoDaEstacao('OUTONO')).toBe('20 de março a 20 de junho');
    expect(periodoDaEstacao('INVERNO')).toBe('21 de junho a 21 de setembro');
  });
});

describe('faltaParaProxima', () => {
  it('dias até a próxima, com artigo', () => {
    expect(faltaParaProxima({ proxima: 'VERAO', diasParaProxima: 70 })).toBe('70 dias para o verão');
    expect(faltaParaProxima({ proxima: 'PRIMAVERA', diasParaProxima: 12 })).toBe('12 dias para a primavera');
  });
  it('véspera: "amanhã começa"', () => {
    expect(faltaParaProxima({ proxima: 'INVERNO', diasParaProxima: 1 })).toBe('amanhã começa o inverno');
  });
});
```

Em `web/src/lib/arte.test.ts`, troque o import por `import { TOTAL_VASOS, ilustracaoDaEstacao, vasoDaPlanta } from './arte';` e acrescente:

```ts
describe('ilustracaoDaEstacao', () => {
  it('uma ilustração por estação, sem acento no nome do arquivo', () => {
    expect(ilustracaoDaEstacao('PRIMAVERA')).toBe('/arte/estacao-primavera.webp');
    expect(ilustracaoDaEstacao('VERAO')).toBe('/arte/estacao-verao.webp');
    expect(ilustracaoDaEstacao('OUTONO')).toBe('/arte/estacao-outono.webp');
    expect(ilustracaoDaEstacao('INVERNO')).toBe('/arte/estacao-inverno.webp');
  });
});
```

Run: `cd web && npx vitest run src/lib/estacoes.test.ts src/lib/arte.test.ts`
Expected: FAIL (`periodoDaEstacao`, `faltaParaProxima` e `ilustracaoDaEstacao` não existem).

- [ ] **Step 2: Implementar as funções**

Em `web/src/lib/estacoes.ts`, ao fim do arquivo:

```ts
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const porExtenso = ([mes, dia]: readonly [number, number]) => `${dia} de ${MESES[mes - 1]}`;

/** "22 de setembro a 20 de dezembro". */
export function periodoDaEstacao(e: Estacao): string {
  const { comeco, final } = ESTACOES.find((x) => x.estacao === e)!;
  return `${porExtenso(comeco)} a ${porExtenso(final)}`;
}

const COM_ARTIGO: Record<Estacao, string> = { PRIMAVERA: 'a primavera', VERAO: 'o verão', OUTONO: 'o outono', INVERNO: 'o inverno' };

/** "70 dias para o verão" / "amanhã começa o verão". */
export function faltaParaProxima({ proxima, diasParaProxima }: Pick<EstacaoAtual, 'proxima' | 'diasParaProxima'>): string {
  return diasParaProxima === 1 ? `amanhã começa ${COM_ARTIGO[proxima]}` : `${diasParaProxima} dias para ${COM_ARTIGO[proxima]}`;
}
```

Em `web/src/lib/icones.ts`, acrescente `import type { Estacao } from '@/types';` no topo e, ao fim:

```ts
export const ICONE_DA_ESTACAO: Record<Estacao, NomeIcone> = { PRIMAVERA: 'primavera', VERAO: 'verao', OUTONO: 'outono', INVERNO: 'inverno' };
```

Em `web/src/lib/arte.ts`, acrescente `import type { Estacao } from '@/types';` no topo e, depois de `vasoDaPlanta`:

```ts
const ARQUIVO_ESTACAO: Record<Estacao, string> = { PRIMAVERA: 'primavera', VERAO: 'verao', OUTONO: 'outono', INVERNO: 'inverno' };

/** Ilustração grande da estação (tela da estação). */
export const ilustracaoDaEstacao = (e: Estacao) => `/arte/estacao-${ARQUIVO_ESTACAO[e]}.webp`;
```

Run: `cd web && npx vitest run src/lib/estacoes.test.ts src/lib/arte.test.ts`
Expected: PASS.

- [ ] **Step 3: `web/src/components/bancada/EstacaoSheet.tsx`**

```tsx
import { Icone } from '@/components/Icone';
import { Sheet } from '@/components/Sheet';
import { ilustracaoDaEstacao } from '@/lib/arte';
import { ESTACOES_LISTA } from '@/lib/cuidados';
import { estacaoAtual, faltaParaProxima, periodoDaEstacao } from '@/lib/estacoes';
import { ICONE_DA_ESTACAO } from '@/lib/icones';

/** Tela da estação: período, dias para a próxima, ilustração grande e as 4 estações (a atual com a pincelada vermelhão). */
export function EstacaoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const atual = estacaoAtual();
  const nome = ESTACOES_LISTA.find((e) => e.valor === atual.estacao)!.nome;

  return (
    <Sheet open={open} onClose={onClose} title={nome}>
      <div className="pb-safe">
        <p className="text-sm text-muted">{periodoDaEstacao(atual.estacao)}</p>
        <p className="text-sm text-muted">{faltaParaProxima(atual)}</p>
        <img src={ilustracaoDaEstacao(atual.estacao)} alt="" className="mx-auto my-4 h-64 w-auto max-w-full object-contain" />
        <ul className="grid grid-cols-4 gap-2 pb-4" aria-label="Estações do ano">
          {ESTACOES_LISTA.map((e) => {
            const eAtual = e.valor === atual.estacao;
            return (
              <li
                key={e.valor}
                aria-current={eAtual ? 'true' : undefined}
                className={`flex flex-col items-center gap-1.5 text-xs font-medium ${eAtual ? 'text-ink' : 'text-muted'}`}
              >
                <Icone nome={ICONE_DA_ESTACAO[e.valor]} size={26} />
                <span className="relative pb-2">
                  {e.nome}
                  {eAtual && <span className="estacao-pincel" />}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
```

O `Sheet` já envolve o conteúdo em `px-5 pb-4` (`Sheet.tsx`), por isso aqui não há margem lateral.

- [ ] **Step 4: CSS da pincelada da estação atual**

Em `web/src/index.css`, logo depois de `.aba-ativa .aba-pincel { … }`:

```css
  /* Estação atual na tela da estação: pincelada vermelhão que se pinta sob o nome */
  .estacao-pincel {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 40px;
    height: 6px;
    transform: translateX(-50%);
    background-color: var(--color-hanko);
    -webkit-mask: url('/arte/pincel-longo.webp') no-repeat center / 100% 100%;
    mask: url('/arte/pincel-longo.webp') no-repeat center / 100% 100%;
    animation: pincel-pinta 0.38s cubic-bezier(0.3, 0.7, 0.2, 1) 0.2s both;
  }
```

Junto dos outros `@keyframes` (fora do `@layer`):

```css
@keyframes pincel-pinta {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}
```

E dentro do `@media (prefers-reduced-motion: reduce)` já existente, acrescente:

```css
  .estacao-pincel {
    animation: none;
  }
```

- [ ] **Step 5: Cartão vira botão que abre o sheet**

Substitua `web/src/components/bancada/EstacaoDoAno.tsx` inteiro por:

```tsx
import { useState, type CSSProperties } from 'react';
import { Icone } from '@/components/Icone';
import { EstacaoSheet } from '@/components/bancada/EstacaoSheet';
import { ESTACOES_LISTA } from '@/lib/cuidados';
import { estacaoAtual, faltaParaProxima } from '@/lib/estacoes';
import { ICONE_DA_ESTACAO } from '@/lib/icones';

/** Estação de agora na Bancada: ensō com o ícone da estação, dias para a próxima e quanto já passou (em pincelada). Toque abre a tela da estação. */
export function EstacaoDoAno() {
  const [aberta, setAberta] = useState(false);
  const atual = estacaoAtual();
  const nome = ESTACOES_LISTA.find((x) => x.valor === atual.estacao)!.nome;
  const falta = faltaParaProxima(atual);
  const pct = Math.round(atual.progresso * 100);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        aria-label={`${nome}: ${falta}. Ver a estação`}
        className="mb-3 flex w-full items-center gap-3.5 rounded-2xl text-left transition active:scale-[0.99]"
      >
        <span className="relative size-14 shrink-0">
          <img src="/arte/enso.webp" alt="" className="absolute inset-0 size-full opacity-90" />
          <Icone nome={ICONE_DA_ESTACAO[atual.estacao]} size={22} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold italic leading-tight">{nome}</span>
          <span className="block text-sm text-muted">{falta}</span>
          <span className="progresso-pincel mt-1.5 block w-40" style={{ '--pct': `${Math.max(pct, 2)}%` } as CSSProperties} />
        </span>
      </button>
      <EstacaoSheet open={aberta} onClose={() => setAberta(false)} />
    </>
  );
}
```

O `role="progressbar"` sai porque dentro de um botão os filhos são apresentacionais e o leitor de tela lê só o `aria-label`. O progresso continua visível. O texto "amanhã começa"/"N dias para" mudou de forma, mas não de sentido: "70 dias para o verão" é o mesmo de antes.

- [ ] **Step 6: Verificação no navegador local (390px, conta de teste)**

1. A Bancada mostra o cartão como antes, com "70 dias para o verão" (em 12/10).
2. Tocar no cartão abre o sheet "Primavera", com:
   - "22 de setembro a 20 de dezembro";
   - "N dias para o verão";
   - o bonsai com brotos;
   - a tira com as 4 estações, em que Primavera fica em `ink` e a pincelada vermelhão se pinta sob o nome.
3. Teclado: o Tab chega ao cartão, Enter abre o sheet e Esc fecha.
4. Rede (DevTools): `estacao-primavera.webp` só é pedido ao abrir o sheet, não ao carregar a Bancada.
5. Confira as quatro ilustrações abrindo `/arte/estacao-verao.webp`, `/arte/estacao-outono.webp` e `/arte/estacao-inverno.webp` direto no navegador.
6. Com movimento reduzido emulado, a pincelada aparece pronta, sem se pintar.

- [ ] **Step 7: Lint, build e commit**

```bash
cd web && npm run build && npm run lint && npm test
git add web/src/lib/estacoes.ts web/src/lib/estacoes.test.ts web/src/lib/icones.ts web/src/lib/arte.ts web/src/lib/arte.test.ts web/src/components/bancada/EstacaoSheet.tsx web/src/components/bancada/EstacaoDoAno.tsx web/src/index.css
git commit -m "feat(web): tela da estação ao tocar no cartão

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Documentação e fechamento

**Files:**
- Modify: `CLAUDE.md` (parágrafo do frontend web, depois do trecho "Fase 3: …")
- Modify: `C:\Users\willi\.claude\projects\C--Users-willi-Cursor-Projects-Bonsai-Manager\memory\redesign-nagare-sumi.md` (estado das fases)

- [ ] **Step 1: CLAUDE.md**

No parágrafo "Structure" do frontend, logo depois da frase que termina em `toast(texto, 'celebra')`, acrescente:

```markdown
Fase 4: `ParticulasEstacao` no `Layout` (pétalas/folhas/neve atrás do conteúdo; regras puras em `src/lib/particulas.ts`; preferência no aparelho `bonsai_animacoes_sazonais` em Perfil → Preferências; desliga com `useMenosMovimento` de `src/lib/movimento.ts`; em dev, `localStorage.bonsai_estacao_teste` força a estação), tela da estação `components/bancada/EstacaoSheet.tsx` aberta pelo cartão `EstacaoDoAno` (`periodoDaEstacao`/`faltaParaProxima` em `src/lib/estacoes.ts`).
```

- [ ] **Step 2: Memória**

Em `redesign-nagare-sumi.md`, troque a frase "Próximo: plano da fase 3 …" por:

```markdown
Fase 3 publicada; fase 4 (movimento sazonal, plano `docs/superpowers/plans/2026-10-12-nagare-movimento-sazonal.md`) implementada em 2026-10-12. Próximo: fase 5 (abertura com vídeo + renomear para Nagare).
```

- [ ] **Step 3: Verificação final**

```bash
cd web && npm run build && npm run lint && npm test
git status --short
```

Expected: build e lint sem erro novo, todos os testes passando, árvore limpa depois do commit abaixo.

- [ ] **Step 4: Commit e pedir o push**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md com a fase 4 do visual sumi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Peça o OK do usuário para `git push` (push = deploy no Cloudflare Pages).
