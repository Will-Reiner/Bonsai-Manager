# Nagare — Ilustrações e estados (fase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar os estados genéricos do `web/` pelas ilustrações sumi:
- vaso no lugar da foto que falta;
- telas vazias ilustradas;
- carregamento com ensō;
- erro de conexão com o galho quebrando;
- celebração ao registrar/concluir.

**Architecture:** As peças processadas pela skill `criando-assets-sumi` vão para `web/public/arte`. Regras puras ficam em `src/lib` com testes Vitest:
- `vasoDaPlanta` em `src/lib/arte.ts`;
- `ehErroDeRede` em `src/lib/api.ts`.

Os componentes centrais de `components/ui.tsx` (`PlantThumb`, `EmptyState`, `Spinner`, `ErrorState`) ganham a nova pele, e o app inteiro muda junto. A celebração é um novo tipo de aviso (`'celebra'`) no `ToastContext`, que já vive na raiz e sobrevive à navegação. As animações são só CSS, com `animation-delay` e remontagem por `key`, sem estado.

**Tech Stack:** React 19 + Vite 8 + TypeScript, Tailwind v4 (`src/index.css`), Vitest (ambiente `node`, `src/**/*.test.ts`), axios, Python 3 (Pillow, numpy, scipy) para as peças.

**Spec:** `docs/superpowers/specs/2026-10-12-identidade-nagare-sumi-design.md`, seção 4.

## Global Constraints

- Idioma: código, comentários e textos em **português**.
- Nenhuma dependência nova no `web/`.
- Peças em WebP (qualidade 85): ilustrações com maior lado ≤ 800px, vasos ≤ 400px. Sempre `alt=""` (decorativas) e `loading="lazy"`, exceto as peças do erro.
- Toda `mask` em CSS vai acompanhada de `-webkit-mask`.
- `prefers-reduced-motion: reduce`: nada se move.
  - O ensō aparece inteiro e parado.
  - O erro mostra a árvore inteira, parada.
  - A celebração aparece sem desenhar.
- Antes de cada commit: `cd web && npm run build && npm run lint && npm test` sem erro novo (os 3 avisos `only-export-components` já existiam).
- Commits na `main`. **Push = deploy**: só com o OK do usuário, ao fim do plano.
- Mensagens de commit terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Arquivos `.tsx` deste projeto podem estar em CRLF. Edições por script preservam a quebra de linha do arquivo.

## Review Focus

1. **Sem internet, as imagens do erro não carregam se não estiverem no cache.** Elas são pré-carregadas na abertura do app (`precarregarArteDeErro`, Task 5) e verificadas desligando a rede no DevTools com o app já aberto.
2. **Chamadas de `PlantThumb` sem `id`** (planta desconhecida) continuam mostrando o broto, sem quebrar (Task 2: o `id` é opcional; a verificação passa pela triagem de fotos com código novo).
3. **A celebração nunca prende a tela:** fecha sozinha (1,7s) e ao tocar, e duas celebrações seguidas não empilham (Task 6).
4. **Erros que não são de rede** (404 "Planta não encontrada", 500) continuam em texto, sem árvore (Task 5, com testes de `ehErroDeRede`).
5. **Movimento reduzido** desliga as animações do ensō, do galho e da celebração (Tasks 4–6, verificado com a emulação `prefers-reduced-motion` do DevTools).

---

### Task 1: Camadas na skill e peças da fase 3

**Files:**
- Modify: `.claude/skills/criando-assets-sumi/scripts/processar.py` (subcomando `camadas`)
- Modify: `.claude/skills/criando-assets-sumi/SKILL.md` (linha na tabela "Qual comando")
- Create: `web/public/arte/vasos/vaso-1.webp` … `vaso-7.webp`
- Create: `web/public/arte/bancada-vazia.webp`, `colecao-vazia.webp`, `planta-sem-tarefas.webp`
- Create: `web/public/arte/erro-inteira.webp`, `erro-tronco.webp`, `erro-galho.webp`

**Interfaces:**
- Produces:
  - URLs `/arte/vasos/vaso-N.webp` (N = 1…7; o 7 é o vaso do dragão);
  - `/arte/bancada-vazia.webp`, `/arte/colecao-vazia.webp`, `/arte/planta-sem-tarefas.webp`;
  - `/arte/erro-{inteira,tronco,galho}.webp` (mesma caixa, encaixe exato), com pivô do galho e proporção impressos pelo `camadas`.

- [ ] **Step 1: Subcomando `camadas` em `processar.py`**

Acrescente antes de `# ---------------------------------------------------------------- CLI`:

```python
# ---------------------------------------------------------------- camadas

def _alfa_rgb(caminho):
    arr = np.asarray(Image.open(caminho).convert("RGB"), dtype=np.float32)
    fundo = cor_de_fundo(arr)
    d = np.sqrt(((arr - fundo) ** 2).sum(-1))
    a = np.clip((d - 10) / 60, 0, 1)
    rgb = np.where(a[..., None] > 0.01, (arr - fundo * (1 - a[..., None])) / np.maximum(a[..., None], 0.01), 0)
    return np.clip(rgb, 0, 255), a


def cmd_camadas(a):
    """Cena inteira + a mesma cena sem uma parte -> inteira, base e parte na mesma caixa (para animar a parte)."""
    rgb_t, a_t = _alfa_rgb(a.inteira)
    rgb_s, a_s = _alfa_rgb(a.sem)
    if a_t.shape != a_s.shape:
        raise SystemExit("as duas imagens precisam ter o mesmo tamanho")
    dif = (a_t > 0.25) & ~ndimage.binary_dilation(a_s > 0.15, iterations=3)
    rot, n = ndimage.label(ndimage.binary_dilation(dif, iterations=8))
    if n == 0:
        raise SystemExit("não achei diferença entre as imagens")
    tam = ndimage.sum(dif, rot, range(1, n + 1))
    regiao = ndimage.binary_dilation(rot == 1 + int(np.argmax(tam)), iterations=4)
    a_p = a_t * regiao
    ys, xs = np.nonzero((a_t > 0.05) | (a_s > 0.05))
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    os.makedirs(a.saida, exist_ok=True)
    for nome, rgb, al in (("inteira", rgb_t, a_t), ("base", rgb_s, a_s), ("parte", rgb_t, a_p)):
        im = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8)[y0:y1, x0:x1])
        im.thumbnail((a.max, a.max), Image.LANCZOS)
        im.save(os.path.join(a.saida, f"{a.prefixo}-{nome}.png"), optimize=True)
    gy, gx = np.nonzero(a_p > 0.3)
    i = int(np.argmin(gx))  # ponto da parte mais à esquerda = onde ela se prende
    print(f"pivô: {(gx[i] - x0) / (x1 - x0) * 100:.1f}% {(gy[i] - y0) / (y1 - y0) * 100:.1f}% · proporção {x1 - x0} / {y1 - y0}")
```

E registre o parser em `main()`, antes de `a = ap.parse_args()`:

```python
    s = sub.add_parser("camadas", help="cena inteira + cena sem uma parte -> inteira/base/parte alinhadas")
    s.add_argument("--inteira", required=True)
    s.add_argument("--sem", required=True, help="a mesma cena sem a parte que vai se mover")
    s.add_argument("--saida", required=True)
    s.add_argument("--prefixo", required=True)
    s.add_argument("--max", type=int, default=800)
    s.set_defaults(fn=cmd_camadas)
```

No `SKILL.md`, na tabela "Qual comando", acrescente a linha:

```markdown
| Cena + a mesma cena sem uma parte (galho que quebra) | `camadas --inteira a.jpg --sem b.jpg --prefixo erro` | 3 PNGs alinhados (inteira/base/parte) + pivô e proporção |
```

- [ ] **Step 2: Gerar as peças (na raiz)**

```bash
export PYTHONIOENCODING=utf-8
P=.claude/skills/criando-assets-sumi/scripts/processar.py
E=test-assets/estilo
T=$(mktemp -d)
python -W ignore $P recorte $E/vasos/vasos_diversos.jpeg --solido --max 400 --saida $T --prefixo vaso
python -W ignore $P recorte $E/vasos/vaso_dragao.jpeg --solido --juntar 30 --max 400 --saida $T --prefixo dragao
for n in bancada_vazia colecao_vazia planta_sem_tarefas; do python -W ignore $P recorte $E/vazias/$n.jpeg --juntar 50 --minimo 150 --max 800 --saida $T --prefixo $n; done
python -W ignore $P camadas --inteira $E/erro/arvore.jpeg --sem $E/erro/arvore_sem_galho.jpeg --saida $T --prefixo erro
ls $T
```

Expected:
- `vaso-1.png` … `vaso-6.png`, `dragao-1.png`;
- `bancada_vazia-1.png`, `colecao_vazia-1.png`, `planta_sem_tarefas-1.png`;
- `erro-inteira.png erro-base.png erro-parte.png`;
- a linha `pivô: 57.8% 72.1% · proporção 1744 / 1123`. Anote os valores impressos: a Task 5 usa esses números.

Se alguma ilustração gerar `-2.png`, rode de novo aquele item com `--juntar 80`.

- [ ] **Step 3: Converter para WebP**

```bash
mkdir -p web/public/arte/vasos
python - "$T" <<'EOF'
import sys
from PIL import Image
t = sys.argv[1]
pares = [(f"vaso-{i}", f"vasos/vaso-{i}") for i in range(1, 7)] + [("dragao-1", "vasos/vaso-7"),
         ("bancada_vazia-1", "bancada-vazia"), ("colecao_vazia-1", "colecao-vazia"), ("planta_sem_tarefas-1", "planta-sem-tarefas"),
         ("erro-inteira", "erro-inteira"), ("erro-base", "erro-tronco"), ("erro-parte", "erro-galho")]
for src, dst in pares:
    Image.open(f"{t}/{src}.png").save(f"web/public/arte/{dst}.webp", "WEBP", quality=85, method=6)
EOF
ls web/public/arte web/public/arte/vasos && du -sh web/public/arte
```

Expected: 7 vasos e 6 peças novas. `du` total ≤ 1,2M.

- [ ] **Step 4: Conferir as peças**

Monte uma folha de conferência sobre o papel (Pillow: `papel.jpg` de fundo e cada WebP colado por cima) e abra com Read. Confira:
- os vasos estão sem fundo e inteiros;
- as ilustrações estão sem recortes;
- `erro-tronco` + `erro-galho` sobrepostos formam a árvore inteira.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/criando-assets-sumi web/public/arte
git commit -m "feat(web): vasos, ilustrações e camadas do erro (skill: subcomando camadas)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Vaso no lugar da foto (`vasoDaPlanta` + `PlantThumb`)

**Files:**
- Create: `web/src/lib/arte.ts`
- Test: `web/src/lib/arte.test.ts`
- Modify: `web/src/components/ui.tsx` (`PlantThumb`)
- Modify (passar `id`):
  - `components/bancada/FotoTarefa.tsx:20`, `components/bancada/LinhaTarefa.tsx:26`
  - `components/care/PlantasPicker.tsx:117`, `components/planta/CapaEInspiracao.tsx:68`
  - `components/tarefa/PendentesDaPlanta.tsx:101`, `components/TaskCard.tsx:18`, `components/TriagemFotos.tsx:104`
  - `pages/AddPlantPage.tsx:139`, `pages/BatchPhotosPage.tsx:203`
  - `pages/CollectionPage.tsx:180,206`, `pages/ConcluirPage.tsx:169,275`, `pages/RegistrarPage.tsx:124,397`

**Interfaces:**
- Consumes: `/arte/vasos/vaso-N.webp` (Task 1).
- Produces: `TOTAL_VASOS = 7`; `vasoDaPlanta(id: string): string`; `PlantThumb({ url?: string | null; id?: string; className?: string })`.

- [ ] **Step 1: Teste que falha (`web/src/lib/arte.test.ts`)**

```ts
import { describe, expect, it } from 'vitest';
import { TOTAL_VASOS, vasoDaPlanta } from './arte';

describe('vasoDaPlanta', () => {
  it('a mesma planta tem sempre o mesmo vaso', () => {
    const id = '2ea702b2-4f39-475d-95d0-9b4bb8f30880';
    expect(vasoDaPlanta(id)).toBe(vasoDaPlanta(id));
  });

  it('aponta para um dos vasos em /arte/vasos', () => {
    expect(vasoDaPlanta('abc')).toMatch(/^\/arte\/vasos\/vaso-[1-7]\.webp$/);
  });

  it('ids diferentes espalham pelos 7 vasos', () => {
    const usados = new Set(Array.from({ length: 200 }, (_, i) => vasoDaPlanta(`planta-${i}-${i * 7919}`)));
    expect(usados.size).toBe(TOTAL_VASOS);
  });
});
```

- [ ] **Step 2: Ver falhar**

Run: `cd web && npm test -- arte`
Expected: FAIL (`Cannot find module './arte'`).

- [ ] **Step 3: Implementar `web/src/lib/arte.ts`**

```ts
/** Vasos ilustrados (placeholder de planta sem foto) em web/public/arte/vasos. */
export const TOTAL_VASOS = 7;

/** Vaso estável por planta: hash djb2 do id → vaso-1…vaso-7. */
export function vasoDaPlanta(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  return `/arte/vasos/vaso-${(h % TOTAL_VASOS) + 1}.webp`;
}
```

- [ ] **Step 4: Ver passar**

Run: `cd web && npm test -- arte`
Expected: PASS (3 testes).

- [ ] **Step 5: `PlantThumb` com vaso (`components/ui.tsx`)**

Importe `import { vasoDaPlanta } from '@/lib/arte';` e troque a função:

```tsx
/** Foto da planta; sem foto, o vaso ilustrado dela (estável pelo id) ou, sem id, o broto. */
export function PlantThumb({ url, id, className = '' }: { url?: string | null; id?: string; className?: string }) {
  if (url) return <img src={url} alt="" loading="lazy" className={`bg-primary-light object-cover ${className}`} />;
  return (
    <div className={`flex items-end justify-center overflow-hidden bg-vazio text-primary/60 ${className}`}>
      {id ? (
        <img src={vasoDaPlanta(id)} alt="" loading="lazy" className="mb-[9%] max-h-[72%] w-[84%] object-contain" />
      ) : (
        <Sprout size={28} className="mb-auto mt-auto" />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Passar `id` nas chamadas**

Em cada chamada listada em **Files**, acrescente `id={…}` com o id da mesma planta cuja foto já é passada em `url`:

| Arquivo | Acrescentar |
|---|---|
| `FotoTarefa.tsx`, `LinhaTarefa.tsx`, `BatchPhotosPage.tsx` | `id={p?.id}` |
| `PlantasPicker.tsx`, `CapaEInspiracao.tsx`, `CollectionPage.tsx` (2×) | `id={p.id}` |
| `PendentesDaPlanta.tsx`, `TaskCard.tsx` | `id={agenda.planta?.id}` |
| `TriagemFotos.tsx` | `id={match.id}` |
| `AddPlantPage.tsx` | `id={criada.id}` |
| `ConcluirPage.tsx` (2×) | `id={t.planta?.id}` |
| `RegistrarPage.tsx:124` | `id={pid}` |
| `RegistrarPage.tsx:397` | `id={a.planta?.id}` |

Se o `tsc` acusar que `planta` não tem `id` em algum tipo, use o campo `plantaId` do mesmo objeto.

- [ ] **Step 7: Build, lint, testes e verificação visual**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

No navegador (390px, conta local), uma planta sem foto mostra o vaso:
- na Coleção (grade e lista);
- na Bancada (fotos e lista);
- na página da tarefa.

Recarregar mostra o mesmo vaso.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/arte.ts web/src/lib/arte.test.ts web/src/components web/src/pages
git commit -m "feat(web): vaso ilustrado no lugar da foto que falta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Telas vazias ilustradas (`EmptyState`)

**Files:**
- Modify: `web/src/components/ui.tsx` (`EmptyState`)
- Modify: `web/src/pages/BancadaPage.tsx` (sem plantas; nada pendente)
- Modify: `web/src/pages/CollectionPage.tsx:139` (coleção vazia)
- Modify: `web/src/pages/PlantDetailPage.tsx:139` (planta sem histórico)

**Interfaces:**
- Consumes: `/arte/bancada-vazia.webp`, `/arte/colecao-vazia.webp`, `/arte/planta-sem-tarefas.webp` (Task 1).
- Produces: `EmptyState({ icon?, ilustracao?: string, title, text?, action? })`.

- [ ] **Step 1: `EmptyState` com ilustração**

Leia a função atual em `components/ui.tsx` e acrescente a prop `ilustracao?: string`. Com ilustração, a imagem substitui o círculo do ícone e o título fica em Newsreader itálico:

```tsx
export function EmptyState({
  icon,
  ilustracao,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  /** URL de uma ilustração de /arte (substitui o círculo do ícone). */
  ilustracao?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {ilustracao ? (
        <img src={ilustracao} alt="" loading="lazy" className="mb-3 w-full max-w-[300px]" />
      ) : (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary-light text-primary">
          {icon ?? <Sprout size={26} />}
        </div>
      )}
      <h2 className={ilustracao ? 'font-display text-2xl font-semibold italic' : 'font-sans text-base font-semibold text-ink'}>{title}</h2>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

Mantenha qualquer classe ou estrutura da versão atual que não aparece acima (ex.: o ícone padrão). O que muda é só o ramo `ilustracao`.

- [ ] **Step 2: Usar nas telas**

- `BancadaPage.tsx`, `semPlantas`: acrescente `ilustracao="/arte/colecao-vazia.webp"` ao `EmptyState` existente.
- `BancadaPage.tsx`, `blocos.length === 0`: troque o `<div className="mt-4 flex items-center gap-3 border-y …">…</div>` (com `PartyPopper`) por:

```tsx
        <EmptyState
          ilustracao="/arte/bancada-vazia.webp"
          title={`Nada pendente ${periodoAtual.vazio}`}
          text="Tudo em dia. Bom momento para só olhar suas plantas."
        />
```

e tire `PartyPopper` do import do Lucide (apague a linha se ficar vazia).
- `CollectionPage.tsx:139`: troque `title="Sua coleção está vazia"` por `title="Um vaso esperando"` e acrescente `ilustracao="/arte/colecao-vazia.webp"`. O `text` e a `action` continuam.
- `PlantDetailPage.tsx:139`: acrescente `ilustracao="/arte/planta-sem-tarefas.webp"`.

- [ ] **Step 3: Build, lint, testes e verificação visual**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

No navegador:
- a Bancada sem pendências mostra a mesa com o bonsai e o chá e "Nada pendente nos próximos 7 dias" (o texto vem do período);
- uma planta sem histórico mostra o broto no vaso;
- as telas vazias sem ilustração (Admin, Concluir) continuam com o círculo.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ui.tsx web/src/pages/BancadaPage.tsx web/src/pages/CollectionPage.tsx web/src/pages/PlantDetailPage.tsx
git commit -m "feat(web): telas vazias com ilustrações sumi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Carregando com o ensō se desenhando (`Spinner`)

**Files:**
- Modify: `web/src/index.css` (`@property --enso`, keyframes, `.enso-carregando`, `.enso-uma-vez`, `.enso-icone`, movimento reduzido)
- Modify: `web/src/components/ui.tsx` (`Spinner`)

**Interfaces:**
- Consumes: `/arte/enso.webp` (fase 1).
- Produces:
  - classes `.enso-carregando` (loop), `.enso-uma-vez` (desenha uma vez) e `.enso-icone` (aparece depois do traço), usadas também pela Task 6;
  - `Spinner({ label? })` sem mudança de API.

- [ ] **Step 1: CSS do ensō**

No fim de `web/src/index.css`, **fora** de qualquer `@layer` (o `@property` precisa ficar no topo), antes do bloco `@media (prefers-reduced-motion: reduce)`:

```css
/* Ensō se desenhando: máscara cônica de 0 a 360° a partir de 180deg (base do círculo = abertura do traço; "270°" na convenção matemática), para começar e terminar exatamente na falha do pincel. Spinner em loop; celebração uma vez. */
@property --enso {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
@keyframes enso-desenha {
  from {
    --enso: 0deg;
  }
  to {
    --enso: 360deg;
  }
}
@keyframes enso-icone-aparece {
  to {
    opacity: 1;
  }
}
.enso-carregando,
.enso-uma-vez {
  -webkit-mask: conic-gradient(from 180deg, #000 var(--enso), transparent 0);
  mask: conic-gradient(from 180deg, #000 var(--enso), transparent 0);
}
.enso-carregando {
  animation: enso-desenha 1.1s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
}
.enso-uma-vez {
  animation: enso-desenha 1.1s cubic-bezier(0.45, 0.05, 0.25, 1) forwards;
}
.enso-icone {
  opacity: 0;
  animation: enso-icone-aparece 0.4s 0.8s forwards;
}
```

No bloco `@media (prefers-reduced-motion: reduce)`, acrescente:

```css
  .enso-carregando,
  .enso-uma-vez {
    animation: none;
    -webkit-mask: none;
    mask: none;
  }
  .enso-icone {
    animation: none;
    opacity: 1;
  }
```

- [ ] **Step 2: `Spinner` com ensō (`components/ui.tsx`)**

```tsx
export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted" role="status">
      <img src="/arte/enso.webp" alt="" className="enso-carregando size-12 opacity-80" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
```

O `Loader2` continua importado: o `Button` ainda usa.

- [ ] **Step 3: Build, lint, testes e verificação visual**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

No navegador, com a rede lenta no DevTools (*Slow 3G*), a Coleção ao carregar mostra o ensō se desenhando em loop. Com a emulação de `prefers-reduced-motion: reduce`, o ensō aparece inteiro e parado.

- [ ] **Step 4: Commit**

```bash
git add web/src/index.css web/src/components/ui.tsx
git commit -m "feat(web): carregando com o ensō se desenhando

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Erro de conexão com o galho quebrando

**Files:**
- Modify: `web/src/lib/api.ts` (`ehErroDeRede`)
- Test: `web/src/lib/api.test.ts`
- Modify: `web/src/lib/arte.ts` (`ARTE_ERRO`, `precarregarArteDeErro`)
- Modify: `web/src/main.tsx` (chamar o pré-carregamento)
- Create: `web/src/components/ErroDeRede.tsx`
- Modify: `web/src/index.css` (`.arvore-erro` e keyframes)
- Modify: `web/src/components/ui.tsx` (`ErrorState` com `erro`)
- Modify (passar `erro`):
  - `pages/AdminPage.tsx:104`, `pages/BancadaPage.tsx:93`, `pages/BatchPhotosPage.tsx:121`
  - `pages/CollectionPage.tsx:136`, `pages/ConcluirPage.tsx:149`, `pages/EditPlantPage.tsx:24`
  - `pages/PlantDetailPage.tsx:38`, `pages/RegistrarPage.tsx:241`, `pages/TarefaPage.tsx:21`

**Interfaces:**
- Consumes: `/arte/erro-{inteira,tronco,galho}.webp`, e o pivô e a proporção impressos na Task 1.
- Produces:
  - `ehErroDeRede(error: unknown): boolean`;
  - `ARTE_ERRO: readonly string[]` e `precarregarArteDeErro(): void`;
  - `ErroDeRede()`;
  - `ErrorState({ text, onRetry?, erro?: unknown })`.

- [ ] **Step 1: Teste que falha (`web/src/lib/api.test.ts`)**

```ts
import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { ehErroDeRede } from './api';

const resposta = (status: number) => ({ status, data: {}, statusText: '', headers: {}, config: {} }) as AxiosResponse;

describe('ehErroDeRede', () => {
  it('erro do axios sem resposta é de rede', () => {
    expect(ehErroDeRede(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true);
  });

  it('erro com resposta do servidor (404, 500) não é de rede', () => {
    expect(ehErroDeRede(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, resposta(404)))).toBe(false);
    expect(ehErroDeRede(new AxiosError('x', 'ERR_BAD_RESPONSE', undefined, undefined, resposta(500)))).toBe(false);
  });

  it('outros erros e vazio não são de rede', () => {
    expect(ehErroDeRede(new Error('boom'))).toBe(false);
    expect(ehErroDeRede(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Ver falhar**

Run: `cd web && npm test -- api`
Expected: FAIL (`ehErroDeRede` não é exportado / não é função).

- [ ] **Step 3: Implementar em `web/src/lib/api.ts`** (logo antes de `errorMessage`)

```ts
/** Erro sem resposta do servidor (internet caiu, servidor fora do ar): a tela mostra a árvore com o galho quebrando. */
export function ehErroDeRede(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
```

- [ ] **Step 4: Ver passar**

Run: `cd web && npm test -- api`
Expected: PASS (3 testes).

- [ ] **Step 5: Pré-carregar a arte do erro**

Em `web/src/lib/arte.ts`, acrescente:

```ts
/** Camadas da árvore do erro de conexão. */
export const ARTE_ERRO = ['/arte/erro-inteira.webp', '/arte/erro-tronco.webp', '/arte/erro-galho.webp'] as const;

const guardadas: HTMLImageElement[] = [];

/** Baixa a arte do erro na abertura: quando a internet cair no meio do uso, ela já está na memória. */
export function precarregarArteDeErro() {
  if (typeof Image === 'undefined' || guardadas.length) return;
  for (const src of ARTE_ERRO) {
    const img = new Image();
    img.src = src;
    guardadas.push(img);
  }
}
```

Em `web/src/main.tsx`, importe `import { precarregarArteDeErro } from '@/lib/arte';` e chame `precarregarArteDeErro();` logo depois do `createRoot(...).render(...)`.

- [ ] **Step 6: CSS da árvore**

Em `@layer components` de `index.css` (troque `57.8% 72.1%` e `1744 / 1123` pelos valores impressos na Task 1, se diferirem):

```css
  /* Erro de conexão: tronco e galho por baixo, árvore inteira por cima; aos 0,9s a inteira some e o galho cai */
  .arvore-erro {
    position: relative;
    width: 100%;
    aspect-ratio: 1744 / 1123;
  }
  .arvore-erro img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .arvore-erro .erro-inteira {
    animation: erro-some 0s 0.9s forwards;
  }
  .arvore-erro .erro-galho {
    transform-origin: 57.8% 72.1%;
    animation: erro-cai 2.2s cubic-bezier(0.5, 0, 0.75, 0.4) 0.9s forwards;
  }
  .arvore-erro .ponta {
    position: absolute;
    width: 9px;
    height: 6px;
    border-radius: 50%;
    background-color: rgb(43 31 23 / 0.5);
    opacity: 0;
    animation: erro-folhinha 2.6s ease-in forwards;
  }
```

E, fora dos `@layer`, junto dos outros `@keyframes`:

```css
@keyframes erro-some {
  to {
    opacity: 0;
  }
}
@keyframes erro-cai {
  0% {
    transform: rotate(0);
  }
  12% {
    transform: rotate(6deg);
  }
  22% {
    transform: rotate(4deg);
  }
  100% {
    transform: translate(-4%, 120%) rotate(62deg);
    opacity: 0;
  }
}
@keyframes erro-folhinha {
  15% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), 260px) rotate(var(--r));
  }
}
```

No bloco `@media (prefers-reduced-motion: reduce)`, acrescente:

```css
  .arvore-erro .erro-inteira,
  .arvore-erro .erro-galho,
  .arvore-erro .ponta {
    animation: none;
  }
```

- [ ] **Step 7: Criar `web/src/components/ErroDeRede.tsx`**

```tsx
import type { CSSProperties } from 'react';
import { ARTE_ERRO } from '@/lib/arte';

/** Pontinhos de tinta que caem com o galho (posições fixas, ao longo do galho). */
const PONTAS = [
  { x: '70%', y: '58%', dx: '12px', r: '140deg', atraso: '1.4s' },
  { x: '78%', y: '54%', dx: '-8px', r: '220deg', atraso: '1.6s' },
  { x: '84%', y: '60%', dx: '18px', r: '90deg', atraso: '1.5s' },
  { x: '90%', y: '52%', dx: '6px', r: '300deg', atraso: '1.8s' },
  { x: '74%', y: '64%', dx: '-14px', r: '60deg', atraso: '1.7s' },
];

/** Árvore cujo galho estala e cai. Para repetir a queda, remonte com outra `key`. */
export function ErroDeRede() {
  const [inteira, tronco, galho] = ARTE_ERRO;
  return (
    <div className="arvore-erro" aria-hidden>
      <img className="erro-tronco" src={tronco} alt="" />
      <img className="erro-galho" src={galho} alt="" />
      <img className="erro-inteira" src={inteira} alt="" />
      {PONTAS.map((p, i) => (
        <i
          key={i}
          className="ponta"
          style={{ left: p.x, top: p.y, '--dx': p.dx, '--r': p.r, animationDelay: p.atraso } as CSSProperties}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 8: `ErrorState` com a árvore (`components/ui.tsx`)**

Importe `useState` (de `react`), `ErroDeRede` (de `@/components/ErroDeRede`) e `ehErroDeRede` (de `@/lib/api`). Troque a função:

```tsx
export function ErrorState({ text, onRetry, erro }: { text: string; onRetry?: () => void; erro?: unknown }) {
  const [vez, setVez] = useState(0);
  if (ehErroDeRede(erro)) {
    return (
      <div className="mx-auto max-w-sm px-4 py-8 text-center">
        <ErroDeRede key={vez} />
        <h2 className="mt-4 font-display text-2xl font-semibold italic">Sem conexão</h2>
        <p className="mt-1 text-sm text-muted">Não foi possível falar com o servidor. Verifique a internet e tente de novo.</p>
        {onRetry && (
          <Button
            className="mt-4"
            onClick={() => {
              setVez((v) => v + 1);
              onRetry();
            }}
          >
            Tentar de novo
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-sm py-12 text-center">
      <p className="text-sm text-danger">{text}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Passar `erro` nas 9 chamadas**

Em cada `<ErrorState text={errorMessage(X, …)} …/>` listada em **Files**, acrescente `erro={X}` com o mesmo `X` passado ao `errorMessage`. Exemplos:
- `erro={plantas.error}`;
- na Bancada, `erro={agendas.error ?? plantas.error}`;
- em `PlantDetailPage`/`EditPlantPage`, `erro={planta.error}`.

- [ ] **Step 10: Build, lint, testes e verificação**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

No navegador, com a Coleção aberta:
1. `docker stop bonsai_api`;
2. recarregue os dados (troque de aba e volte, ou "Tentar de novo"). Depois das novas tentativas do TanStack, aparecem a árvore inteira, o galho estalando e caindo, os pontinhos e "Sem conexão". "Tentar de novo" repete a queda;
3. com a aba **Network → Offline** do DevTools (app já aberto), as imagens ainda aparecem, por causa do pré-carregamento;
4. `docker start bonsai_api` e "Tentar de novo" volta ao normal;
5. abra `/plantas/<id-inexistente>`: "Planta não encontrada." continua em texto, sem árvore.

- [ ] **Step 11: Commit**

```bash
git add web/src/lib/api.ts web/src/lib/api.test.ts web/src/lib/arte.ts web/src/main.tsx web/src/components/ErroDeRede.tsx web/src/components/ui.tsx web/src/index.css web/src/pages
git commit -m "feat(web): erro de conexão com o galho quebrando

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Celebração ao registrar e concluir

**Files:**
- Modify: `web/src/context/ToastContext.tsx` (tipo `'celebra'`)
- Modify: `web/src/pages/RegistrarPage.tsx:221`
- Modify: `web/src/pages/ConcluirPage.tsx:136`

**Interfaces:**
- Consumes: `.enso-uma-vez`, `.enso-icone` (Task 4); `Icone` (fase 2); `/arte/enso.webp`.
- Produces: `useToast()(texto, 'celebra')` abre a celebração (≈1,7s, fecha ao tocar, sobrevive à navegação).

- [ ] **Step 1: Tipo `'celebra'` no `ToastContext.tsx`**

Troque `type ToastKind = 'success' | 'error';` por:

```tsx
type ToastKind = 'success' | 'error' | 'celebra';
const DURACAO: Record<ToastKind, number> = { success: 3200, error: 3200, celebra: 1700 };
```

Importe `import { Icone } from '@/components/Icone';`. No `show`, use a duração por tipo. Uma celebração nova substitui a anterior em vez de empilhar:

```tsx
  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...(kind === 'celebra' ? list.filter((t) => t.kind !== 'celebra') : list), { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), DURACAO[kind]);
  }, []);
  const fechar = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));
  const celebracao = toasts.find((t) => t.kind === 'celebra');
```

No JSX, o `toasts.map` passa a percorrer `toasts.filter((t) => t.kind !== 'celebra')`. Depois do bloco de avisos (ainda dentro do `Provider`), acrescente:

```tsx
      {celebracao && (
        <div
          role="status"
          aria-live="polite"
          onClick={() => fechar(celebracao.id)}
          className="animate-fade-in fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg/90 px-8 text-center"
        >
          <span className="relative size-36">
            <img src="/arte/enso.webp" alt="" className="enso-uma-vez size-full" />
            <Icone nome="registrar" size={40} className="enso-icone absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold italic text-primary-dark">{celebracao.text}</p>
        </div>
      )}
```

- [ ] **Step 2: Usar nas duas telas**

- `RegistrarPage.tsx:221`: troque o `toast(…)` de sucesso por

```tsx
        toast(`Cuidado registrado${tocadas.length > 1 ? ` em ${tocadas.length} plantas` : ''}${extra}`, 'celebra');
```

- `ConcluirPage.tsx:136`: troque por

```tsx
      toast(marcadas.length > 1 ? `${marcadas.length} tarefas concluídas` : 'Tarefa concluída', 'celebra');
```

- [ ] **Step 3: Build, lint, testes e verificação**

Run: `cd web && npm run build && npm run lint && npm test`
Expected: tudo passa.

No navegador, conta local, com tarefas de teste criadas pela API e anotando os ids para apagar depois:
- registrar um cuidado mostra o ensō se desenhando, o ícone de registrar aparecendo e "Cuidado registrado", fechando sozinho em ~1,7s já na tela de destino;
- tocar fecha antes;
- concluir uma tarefa mostra "Tarefa concluída";
- os avisos de erro continuam como faixa no topo.

No fim, apague as tarefas e cuidados de teste.

- [ ] **Step 4: Commit**

```bash
git add web/src/context/ToastContext.tsx web/src/pages/RegistrarPage.tsx web/src/pages/ConcluirPage.tsx
git commit -m "feat(web): celebração com ensō ao registrar e concluir

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Fim do plano**

Atualize a linha do visual sumi no `CLAUDE.md` (seção Frontend web). Acrescente ao fim dela: `fase 3: vasoDaPlanta (src/lib/arte.ts) no PlantThumb sem foto, EmptyState({ilustracao}), Spinner ensō, ErrorState({erro}) com ErroDeRede (ehErroDeRede em api.ts, arte pré-carregada), toast 'celebra'.` Faça o commit `docs: CLAUDE.md com a fase 3 do visual sumi` e peça ao usuário o OK para o push.
