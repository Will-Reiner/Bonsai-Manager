# Fluxos de cuidado em etapas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar, Concluir e Agendar viram fluxos em etapas curtas, com etapas condicionais, desvio "Ajustar plantas" e "Mais opções" recolhido; "Mover para Recém transplantadas" vira preferência lembrada.

**Architecture:** Lógica pura de etapas em `web/src/lib/fluxos.ts` (Vitest). Hook `useEtapas` guarda a etapa em `?etapa=` com histórico (voltar do navegador volta uma etapa) e sabe sair do fluxo de uma vez. Componentes de fluxo compartilhados em `web/src/components/fluxo/`. As páginas mantêm seu estado e renderizam a etapa atual. Sem mudança na API (preferência usa `PUT /preferencias/:chave` existente).

**Tech Stack:** React 19 + react-router 7 + TanStack Query + Tailwind v4 + Vitest (web/).

**Spec:** `docs/superpowers/specs/2026-10-07-fluxos-em-etapas-design.md`

## Global Constraints

- Idioma de código/UI: português. Tokens de estilo existentes (`card`, `chip`, `chip-active`, `input`, `label`, `text-muted`, `text-primary`, `border-line`, `bg-card`).
- Nenhuma mudança em `server/`.
- Chave de preferência: `mover_recem_transplantada` = `sim` | `nao` (padrão `sim`).
- Aberto/fechado do Mais opções: `localStorage` chave `fluxo.maisOpcoes` (`aberto` | `fechado`, padrão `fechado`).
- Verificação: `cd web && npm test && npm run build && npm run lint`.
- Testes no navegador só com a conta `testeclaude@bonsai.dev`.

## File Structure

- Create `web/src/lib/fluxos.ts` + `web/src/lib/fluxos.test.ts` — etapas de cada fluxo, validação da etapa pedida, resumo do Mais opções.
- Create `web/src/components/fluxo/useEtapas.ts` — etapa na URL, `ir`/`avancar`/`voltar`/`sair`.
- Create `web/src/components/fluxo/FluxoLayout.tsx` — cabeçalho, barra de progresso, rodapé fixo.
- Create `web/src/components/fluxo/MaisOpcoes.tsx`, `QuandoCampo.tsx`, `AjustarPlantas.tsx`, `MoverTransplanteCampo.tsx`.
- Create `web/src/components/care/DataFuturaCampo.tsx` — data futura + atalhos (Agendar e Reagendar).
- Create `web/src/components/care/ReagendarSheet.tsx`; delete `ScheduleCareSheet.tsx`.
- Create `web/src/pages/AgendarPage.tsx`.
- Modify `web/src/pages/RegistrarPage.tsx`, `ConcluirPage.tsx`, `ProfilePages.tsx`, `web/src/components/care/PlantasPicker.tsx`, `web/src/context/CareContext.tsx`, `web/src/lib/queries.ts`, `web/src/types.ts`, `web/src/App.tsx`, `CLAUDE.md`.

---

### Task 1: Lógica pura dos fluxos

**Files:**
- Create: `web/src/lib/fluxos.ts`
- Test: `web/src/lib/fluxos.test.ts`

**Interfaces:**
- Produces:
  - `interface Fluxo<T extends string> { sequencia: T[]; alcance: number }`
  - `type EtapaRegistrar = 'inicio' | 'triagem' | 'feito' | 'tarefas' | 'final' | 'ajustar'`
  - `type EtapaConcluir = 'procedimento' | 'final' | 'ajustar'`
  - `type EtapaAgendar = 'plantas' | 'cuidados' | 'quando'`
  - `etapaValida<T>(fluxo: Fluxo<T>, desvios: readonly T[], pedida: string | null): T`
  - `fluxoRegistrar(s: { temFotos; temPlantas; plantaFixa; temTipos; temCandidatas: boolean }): Fluxo<EtapaRegistrar>`
  - `fluxoConcluir(s: { temMarcadas: boolean }): Fluxo<EtapaConcluir>`
  - `fluxoAgendar(s: { plantaFixa; temPlantas; temCuidados: boolean }): Fluxo<EtapaAgendar>`
  - `resumoMaisOpcoes(itens: (string | false | null | undefined)[]): string`

- [ ] **Step 1: Write the failing test** — `web/src/lib/fluxos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { etapaValida, fluxoAgendar, fluxoConcluir, fluxoRegistrar, resumoMaisOpcoes, type Fluxo } from './fluxos';

const base = { temFotos: false, temPlantas: false, plantaFixa: false, temTipos: false, temCandidatas: false };

describe('fluxoRegistrar', () => {
  it('sem fotos nem plantas só libera o início', () => {
    expect(fluxoRegistrar(base)).toEqual({ sequencia: ['inicio', 'feito', 'final'], alcance: 1 });
  });
  it('com fotos ainda sem planta libera até a triagem', () => {
    expect(fluxoRegistrar({ ...base, temFotos: true })).toEqual({
      sequencia: ['inicio', 'triagem', 'feito', 'final'],
      alcance: 2,
    });
  });
  it('planta fixa pula a triagem', () => {
    const f = fluxoRegistrar({ ...base, temFotos: true, temPlantas: true, plantaFixa: true });
    expect(f.sequencia).toEqual(['inicio', 'feito', 'final']);
    expect(f.alcance).toBe(2);
  });
  it('sem tipos escolhidos para no "feito"', () => {
    expect(fluxoRegistrar({ ...base, temFotos: true, temPlantas: true }).alcance).toBe(3);
  });
  it('tarefas só aparece com candidatas; com tipos libera tudo', () => {
    expect(fluxoRegistrar({ ...base, temPlantas: true, temTipos: true, temCandidatas: true })).toEqual({
      sequencia: ['inicio', 'feito', 'tarefas', 'final'],
      alcance: 4,
    });
  });
});

describe('fluxoConcluir', () => {
  it('sem plantas marcadas fica no procedimento', () => {
    expect(fluxoConcluir({ temMarcadas: false })).toEqual({ sequencia: ['procedimento', 'final'], alcance: 1 });
  });
  it('com plantas marcadas libera o final', () => {
    expect(fluxoConcluir({ temMarcadas: true }).alcance).toBe(2);
  });
});

describe('fluxoAgendar', () => {
  it('sem planta fixa começa escolhendo plantas', () => {
    expect(fluxoAgendar({ plantaFixa: false, temPlantas: false, temCuidados: false })).toEqual({
      sequencia: ['plantas', 'cuidados', 'quando'],
      alcance: 1,
    });
  });
  it('com plantas e sem cuidados para em "cuidados"', () => {
    expect(fluxoAgendar({ plantaFixa: false, temPlantas: true, temCuidados: false }).alcance).toBe(2);
  });
  it('planta fixa pula a escolha de plantas', () => {
    expect(fluxoAgendar({ plantaFixa: true, temPlantas: true, temCuidados: true })).toEqual({
      sequencia: ['cuidados', 'quando'],
      alcance: 2,
    });
  });
});

describe('etapaValida', () => {
  const f: Fluxo<'a' | 'b' | 'c' | 'x'> = { sequencia: ['a', 'b', 'c'], alcance: 2 };
  it('sem etapa pedida → primeira', () => expect(etapaValida(f, [], null)).toBe('a'));
  it('pedida liberada → ela', () => expect(etapaValida(f, [], 'b')).toBe('b'));
  it('pedida além do alcance → última liberada', () => expect(etapaValida(f, [], 'c')).toBe('b'));
  it('desconhecida → última liberada', () => expect(etapaValida(f, [], 'zzz')).toBe('b'));
  it('desvio permitido → ele', () => expect(etapaValida(f, ['x'], 'x')).toBe('x'));
  it('desvio não permitido → última liberada', () => expect(etapaValida(f, [], 'x')).toBe('b'));
});

describe('resumoMaisOpcoes', () => {
  it('junta só os itens preenchidos', () => {
    expect(resumoMaisOpcoes(['Nota', '', false, null, undefined, '1 próximo passo'])).toBe('Nota · 1 próximo passo');
  });
  it('nada preenchido → vazio', () => expect(resumoMaisOpcoes([false, ''])).toBe(''));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/fluxos.test.ts`
Expected: FAIL — `Failed to resolve import "./fluxos"`.

- [ ] **Step 3: Write minimal implementation** — `web/src/lib/fluxos.ts`:

```ts
/** Etapas de um fluxo em sequência e quantas, do início, o estado atual já libera. */
export interface Fluxo<T extends string> {
  sequencia: T[];
  alcance: number;
}

/** `ajustar` é desvio (fora da sequência): entra por link e sai com voltar. */
export type EtapaRegistrar = 'inicio' | 'triagem' | 'feito' | 'tarefas' | 'final' | 'ajustar';
export type EtapaConcluir = 'procedimento' | 'final' | 'ajustar';
export type EtapaAgendar = 'plantas' | 'cuidados' | 'quando';

/**
 * Etapa a mostrar para a pedida na URL: sem pedido → primeira; desvio permitido ou etapa liberada → ela;
 * qualquer outra (recarga, link direto, etapa que sumiu) → a última liberada.
 */
export function etapaValida<T extends string>(fluxo: Fluxo<T>, desvios: readonly T[], pedida: string | null): T {
  const { sequencia, alcance } = fluxo;
  if (pedida === null) return sequencia[0];
  if (desvios.includes(pedida as T)) return pedida as T;
  const i = sequencia.indexOf(pedida as T);
  if (i >= 0 && i < alcance) return pedida as T;
  return sequencia[Math.max(0, Math.min(alcance, sequencia.length) - 1)];
}

/** Registrar: início (fotos) → triagem (com fotos, sem planta fixa) → feito → tarefas (com candidatas) → final. */
export function fluxoRegistrar(s: {
  temFotos: boolean;
  temPlantas: boolean;
  plantaFixa: boolean;
  temTipos: boolean;
  temCandidatas: boolean;
}): Fluxo<EtapaRegistrar> {
  const sequencia: EtapaRegistrar[] = ['inicio'];
  if (s.temFotos && !s.plantaFixa) sequencia.push('triagem');
  const ateTriagem = sequencia.length;
  sequencia.push('feito');
  if (s.temCandidatas) sequencia.push('tarefas');
  sequencia.push('final');
  const alcance =
    !s.temFotos && !s.temPlantas ? 1 : !s.temPlantas ? ateTriagem : !s.temTipos ? ateTriagem + 1 : sequencia.length;
  return { sequencia, alcance };
}

/** Concluir: procedimento → final (exige ao menos uma planta marcada). */
export function fluxoConcluir(s: { temMarcadas: boolean }): Fluxo<EtapaConcluir> {
  return { sequencia: ['procedimento', 'final'], alcance: s.temMarcadas ? 2 : 1 };
}

/** Agendar: plantas (omitida com planta fixa) → cuidados → quando. */
export function fluxoAgendar(s: { plantaFixa: boolean; temPlantas: boolean; temCuidados: boolean }): Fluxo<EtapaAgendar> {
  const sequencia: EtapaAgendar[] = s.plantaFixa ? ['cuidados', 'quando'] : ['plantas', 'cuidados', 'quando'];
  const alcance = !s.temPlantas ? 1 : !s.temCuidados ? sequencia.indexOf('cuidados') + 1 : sequencia.length;
  return { sequencia, alcance };
}

/** Resumo do "Mais opções" fechado: só o que está preenchido/ativo, separado por " · ". */
export const resumoMaisOpcoes = (itens: (string | false | null | undefined)[]) =>
  itens.filter((i): i is string => !!i).join(' · ');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/fluxos.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/fluxos.ts web/src/lib/fluxos.test.ts
git commit -m "feat(web): lógica das etapas dos fluxos de cuidado, testada com Vitest"
```

---

### Task 2: Componentes de fluxo + preferência "Mover para Recém transplantadas"

**Files:**
- Create: `web/src/components/fluxo/useEtapas.ts`, `FluxoLayout.tsx`, `MaisOpcoes.tsx`, `QuandoCampo.tsx`, `AjustarPlantas.tsx`, `MoverTransplanteCampo.tsx`
- Modify: `web/src/lib/queries.ts` (hooks da preferência), `web/src/types.ts` (`Preferencias`), `web/src/pages/ProfilePages.tsx` (seção no Perfil)

**Interfaces:**
- Consumes: `Fluxo`, `etapaValida` (Task 1); `useEscolha` (`lib/escolhas.ts`); `preferenciasApi.set(chave, valor)`.
- Produces:
  - `useEtapas<T>(fluxo: Fluxo<T>, desvios?: readonly T[]): { etapa: T; ir(e: T, replace?: boolean): void; avancar(): void; voltar(): void; sair(fallback?: string): void }`
  - `FluxoLayout({ titulo: string; progresso?: { etapas: readonly string[]; atual: string }; rodape: ReactNode; children })`
  - `MaisOpcoes({ resumo: string; dica: string; children })`
  - `QuandoCampo({ value: string; onChange(v: string) })` — `value` em `AAAA-MM-DD`
  - `AjustarPlantas({ itens: PlantaAjuste[]; conteudo(id: string): ReactNode })`, `interface PlantaAjuste { id; thumb: ReactNode; titulo; subtitulo?; ajustado: boolean }`
  - `MoverTransplanteCampo({ checked: boolean; onChange(v: boolean); disabled?: boolean; hint?: string })`
  - `useMoverRecemTransplantada(): boolean`, `useLembrarMover(): (usado: boolean) => void` em `lib/queries.ts`

- [ ] **Step 1: `useEtapas.ts`**

```ts
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { etapaValida, type Fluxo } from '@/lib/fluxos';

const idxHistorico = (): number => (window.history.state as { idx?: number } | null)?.idx ?? 0;

/** Etapa atual em `?etapa=` (com histórico): o voltar do navegador/Android volta uma etapa em vez de sair do fluxo. */
export function useEtapas<T extends string>(fluxo: Fluxo<T>, desvios: readonly T[] = []) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pedida = params.get('etapa');
  const etapa = etapaValida(fluxo, desvios, pedida);
  // Posição no histórico ao entrar no fluxo — para sair de uma vez, pulando as etapas
  const entrada = useRef<number | null>(null);
  if (entrada.current === null) entrada.current = idxHistorico();

  const ir = (e: T, replace = false) => {
    const p = new URLSearchParams(params);
    if (e === fluxo.sequencia[0]) p.delete('etapa');
    else p.set('etapa', e);
    const s = p.toString();
    navigate({ search: s ? `?${s}` : '' }, { replace });
  };

  // Etapa pedida indisponível (recarga, link direto, etapa que sumiu): troca pela válida sem criar histórico
  const corrigir = pedida !== null && pedida !== etapa;
  useEffect(() => {
    if (corrigir) ir(etapa, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corrigir, etapa]);

  return {
    etapa,
    ir,
    avancar() {
      const i = fluxo.sequencia.indexOf(etapa);
      if (i >= 0 && i + 1 < fluxo.sequencia.length) ir(fluxo.sequencia[i + 1]);
    },
    voltar: () => navigate(-1),
    /** Sai do fluxo (após salvar): volta para antes da 1ª etapa; aberto por link direto, vai para `fallback`. */
    sair(fallback = '/') {
      const inicio = entrada.current ?? 0;
      if (inicio > 0) navigate(-(idxHistorico() - inicio + 1));
      else navigate(fallback, { replace: true });
    },
  };
}
```

- [ ] **Step 2: `FluxoLayout.tsx`**

```tsx
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui';

/** Tela de uma etapa: cabeçalho com voltar, barra de progresso (fora de desvios) e botão principal fixo embaixo. */
export function FluxoLayout({
  titulo,
  progresso,
  rodape,
  children,
}: {
  titulo: string;
  progresso?: { etapas: readonly string[]; atual: string };
  rodape: ReactNode;
  children: ReactNode;
}) {
  const passo = progresso ? progresso.etapas.indexOf(progresso.atual) : -1;
  const total = progresso?.etapas.length ?? 0;
  return (
    <div className="min-h-dvh pb-36">
      <PageHeader title={titulo} back />
      {passo >= 0 && total > 1 && (
        <div className="mx-auto flex max-w-2xl gap-1.5 px-4 pt-3" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={passo + 1} aria-label={`Etapa ${passo + 1} de ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-primary' : 'bg-line'}`} />
          ))}
        </div>
      )}
      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4">{children}</div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto mb-3 max-w-2xl space-y-2">{rodape}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `MaisOpcoes.tsx`**

```tsx
import type { ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useEscolha } from '@/lib/escolhas';

const ESTADOS = [{ value: 'aberto' as const }, { value: 'fechado' as const }];

/** Opções raras ou "configura uma vez", recolhidas; fechado mostra o resumo do que está preenchido. */
export function MaisOpcoes({ resumo, dica, children }: { resumo: string; dica: string; children: ReactNode }) {
  const [estado, setEstado] = useEscolha<'aberto' | 'fechado'>('fluxo.maisOpcoes', 'fechado', ESTADOS);
  const aberto = estado === 'aberto';
  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setEstado(aberto ? 'fechado' : 'aberto')}
        className="flex w-full items-center gap-3 p-3 text-left"
        aria-expanded={aberto}
      >
        <SlidersHorizontal size={18} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Mais opções</span>
          <span className={`block truncate text-xs ${resumo ? 'font-medium text-primary' : 'text-muted'}`}>{resumo || dica}</span>
        </span>
        <ChevronDown size={20} className={`shrink-0 text-muted transition ${aberto ? 'rotate-180' : ''}`} />
      </button>
      {aberto && <div className="space-y-5 border-t border-line p-3">{children}</div>}
    </section>
  );
}
```

- [ ] **Step 4: `QuandoCampo.tsx`**

```tsx
import { useState } from 'react';
import { daquiADias, toDateInput } from '@/lib/format';

/** Data de algo já feito: Hoje / Ontem / Outra data (nunca no futuro). */
export function QuandoCampo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hoje = toDateInput();
  const ontem = toDateInput(daquiADias(-1));
  const [outra, setOutra] = useState(value !== hoje && value !== ontem);
  const chip = (ativo: boolean) => `chip ${ativo ? 'chip-active' : ''}`;
  return (
    <div>
      <span className="label">Quando</span>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(!outra && value === hoje)} onClick={() => { setOutra(false); onChange(hoje); }}>
          Hoje
        </button>
        <button type="button" className={chip(!outra && value === ontem)} onClick={() => { setOutra(false); onChange(ontem); }}>
          Ontem
        </button>
        <button type="button" className={chip(outra)} onClick={() => setOutra(true)}>
          Outra data
        </button>
      </div>
      {outra && (
        <input type="date" className="input mt-2" value={value} max={hoje} onChange={(e) => onChange(e.target.value)} aria-label="Data" />
      )}
    </div>
  );
}
```

- [ ] **Step 5: `AjustarPlantas.tsx`**

```tsx
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface PlantaAjuste {
  id: string;
  thumb: ReactNode;
  titulo: string;
  subtitulo?: string;
  ajustado: boolean;
}

/** Lista de plantas para ajustar uma a uma — o que não for mudado segue o geral. */
export function AjustarPlantas({ itens, conteudo }: { itens: PlantaAjuste[]; conteudo: (id: string) => ReactNode }) {
  const [aberta, setAberta] = useState<string | null>(null);
  return (
    <section>
      <p className="mb-3 text-sm text-muted">Toque numa planta para mudar só nela. O que não for mudado segue o geral.</p>
      <div className="space-y-2">
        {itens.map((p) => (
          <div key={p.id} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setAberta(aberta === p.id ? null : p.id)}
              className="flex w-full items-center gap-3 p-2.5 text-left"
              aria-expanded={aberta === p.id}
            >
              {p.thumb}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{p.titulo}</span>
                {p.subtitulo && <span className="block truncate text-xs text-muted">{p.subtitulo}</span>}
                {p.ajustado && <span className="text-xs font-medium text-primary">Com ajuste próprio</span>}
              </span>
              <ChevronDown size={20} className={`shrink-0 text-muted transition ${aberta === p.id ? 'rotate-180' : ''}`} />
            </button>
            {aberta === p.id && <div className="space-y-3 border-t border-line p-3">{conteudo(p.id)}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: `MoverTransplanteCampo.tsx`**

```tsx
/** Checkbox "Mover para Recém transplantadas" (Registrar, Concluir e Perfil). */
export function MoverTransplanteCampo({
  checked,
  onChange,
  disabled,
  hint = 'Depois do prazo (ajustável no Perfil) a planta volta ao grupo de antes.',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Mover para Recém transplantadas</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}
```

- [ ] **Step 7: Preferência em `queries.ts` e `types.ts`**

Em `web/src/types.ts`, dentro de `interface Preferencias`, depois de `pre_transplante_dias?: string;`:

```ts
  mover_recem_transplantada?: string;
```

Em `web/src/lib/queries.ts`, trocar `import { useQuery } from '@tanstack/react-query';` por `import { useQuery, useQueryClient } from '@tanstack/react-query';` e adicionar depois de `usePreTransplanteDias`:

```ts
/** "Mover para Recém transplantadas" vem marcado ao registrar/concluir um Transplante? (padrão sim; última escolha). */
export function useMoverRecemTransplantada() {
  const prefs = usePreferencias();
  return prefs.data?.mover_recem_transplantada !== 'nao';
}

/** Lembra a escolha de "Mover para Recém transplantadas" como preferência da conta (em segundo plano). */
export function useLembrarMover() {
  const queryClient = useQueryClient();
  const atual = useMoverRecemTransplantada();
  return (usado: boolean) => {
    if (usado === atual) return;
    preferenciasApi
      .set('mover_recem_transplantada', usado ? 'sim' : 'nao')
      .then(() => queryClient.invalidateQueries({ queryKey: keys.preferencias }))
      .catch(() => {
        // falhou: só não lembra a escolha desta vez
      });
  };
}
```

- [ ] **Step 8: Seção no Perfil** — `web/src/pages/ProfilePages.tsx`

Importar `MoverTransplanteCampo` de `@/components/fluxo/MoverTransplanteCampo` e `useMoverRecemTransplantada` de `@/lib/queries` (junto aos hooks já importados). Adicionar antes de `export function ProfilePage()`:

```tsx
/** Valor inicial de "Mover para Recém transplantadas" — também muda sozinho com a última escolha ao registrar. */
function MoverTransplantePreferencia() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const prefs = usePreferencias();
  const marcado = useMoverRecemTransplantada();
  const [salvando, setSalvando] = useState(false);

  async function mudar(v: boolean) {
    setSalvando(true);
    try {
      await preferenciasApi.set('mover_recem_transplantada', v ? 'sim' : 'nao');
      await queryClient.invalidateQueries({ queryKey: keys.preferencias });
      toast('Preferência salva');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="card mt-4 p-4">
      <span className="label">Ao registrar cuidados</span>
      <MoverTransplanteCampo
        checked={marcado}
        onChange={mudar}
        disabled={prefs.isLoading || salvando}
        hint="Já vem marcado (ou não) ao registrar um Transplante. Muda sozinho conforme a sua última escolha."
      />
    </section>
  );
}
```

E renderizar `<MoverTransplantePreferencia />` logo após `<TempoTransplante />`.

- [ ] **Step 9: Verify**

Run: `cd web && npm run build && npm run lint`
Expected: build ok, lint sem erros (componentes ainda não usados pelas páginas é aceitável).

- [ ] **Step 10: Commit**

```bash
git add web/src/components/fluxo web/src/lib/queries.ts web/src/types.ts web/src/pages/ProfilePages.tsx
git commit -m "feat(web): peças dos fluxos em etapas e preferência de mover p/ Recém transplantadas"
```

---

### Task 3: Registrar em etapas

**Files:**
- Modify (reescrever): `web/src/pages/RegistrarPage.tsx`

**Interfaces:**
- Consumes: `fluxoRegistrar`, `resumoMaisOpcoes` (Task 1); `useEtapas`, `FluxoLayout`, `MaisOpcoes`, `QuandoCampo`, `AjustarPlantas`, `MoverTransplanteCampo`, `useMoverRecemTransplantada`, `useLembrarMover` (Task 2).

- [ ] **Step 1: Reescrever `RegistrarPage.tsx`** com o conteúdo:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronRight, ImagePlus, SlidersHorizontal } from 'lucide-react';
import { Button, ErrorState, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { FilePreview, Miniaturas } from '@/components/FilePreview';
import { TriagemFotos } from '@/components/TriagemFotos';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { PlantasPicker } from '@/components/care/PlantasPicker';
import { ProximosPassos, proximosParaApi, type Proximo } from '@/components/care/ProximosPassos';
import { repetirValido } from '@/components/care/RepetirCampo';
import { AjustarPlantas } from '@/components/fluxo/AjustarPlantas';
import { FluxoLayout } from '@/components/fluxo/FluxoLayout';
import { MaisOpcoes } from '@/components/fluxo/MaisOpcoes';
import { MoverTransplanteCampo } from '@/components/fluxo/MoverTransplanteCampo';
import { QuandoCampo } from '@/components/fluxo/QuandoCampo';
import { useEtapas } from '@/components/fluxo/useEtapas';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fluxoRegistrar, resumoMaisOpcoes } from '@/lib/fluxos';
import { diasAte, fromDateInput, plantaRotulo, plantaTitulo, toDateInput } from '@/lib/format';
import { ehNova, useLoteFotos } from '@/lib/loteFotos';
import { keys, useAgendas, useAtividades, useLembrarMover, useMoverRecemTransplantada, usePlantas } from '@/lib/queries';
import { ATIVIDADE_TRANSPLANTE } from '@/types';
import { candidatasReconciliacao, rotuloUltima, textoPrazo, ultimasPorPlanta } from '@/lib/cuidados';

interface Ajuste {
  /** undefined = segue os tipos gerais */
  atividadeIds?: string[];
  detalhes: string;
  observacaoFutura: string;
}
const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '' };
const temAjuste = (aj: Ajuste) => !!(aj.atividadeIds || aj.detalhes || aj.observacaoFutura);

/** Registrar cuidado em etapas: fotos → planta de cada foto → o que foi feito → tarefas a concluir → finalizar. */
export function RegistrarPage() {
  const [params] = useSearchParams();
  const plantaFixa = params.get('planta') ?? undefined;
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const lote = useLoteFotos(plantas.data);
  const agendas = useAgendas();
  const atividades = useAtividades();

  const [salvando, setSalvando] = useState(false);
  const [triagem, setTriagem] = useState({ inicio: 0, voltarDireto: false });
  const [semFoto, setSemFoto] = useState<string[] | null>(null);
  const [escolherPlantas, setEscolherPlantas] = useState(false);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [proximos, setProximos] = useState<Proximo[]>([]);
  /** Candidatas que o usuário desmarcou (as demais são concluídas pelo registro). */
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);
  const moverPadrao = useMoverRecemTransplantada();
  const lembrarMover = useLembrarMover();
  /** null = segue a preferência (última escolha). */
  const [moverEscolha, setMoverEscolha] = useState<boolean | null>(null);
  const moverTransplante = moverEscolha ?? moverPadrao;
  const ultimas = useMemo(() => ultimasPorPlanta(agendas.data ?? []), [agendas.data]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Plantas tocadas: as das fotos (na ordem da 1ª foto) ou as escolhidas sem foto
  const tocadas = semFoto ?? [...new Set(lote.items.map((i) => i.plantaId).filter((p): p is string => !!p))];
  const fotosDe = (pid: string) => lote.items.map((item, i) => ({ item, i })).filter(({ item }) => item.plantaId === pid);
  const ajuste = (pid: string) => ajustes[pid] ?? AJUSTE_VAZIO;
  const setAjuste = (pid: string, patch: Partial<Ajuste>) => setAjustes((a) => ({ ...a, [pid]: { ...ajuste(pid), ...patch } }));
  const tiposDe = (pid: string) => ajuste(pid).atividadeIds ?? atividadeIds;
  // Plantas novas (criadas só ao salvar) não têm histórico nem tarefas
  const reais = tocadas.filter((pid) => !ehNova(pid));
  const dicaPara = (pids: string[]) =>
    agendas.data && pids.length ? (aid: string) => rotuloUltima(pids.map((p) => ultimas.get(p)?.get(aid))) : undefined;
  const candidatas = candidatasReconciliacao(
    agendas.data ?? [],
    reais.map((pid) => ({ plantaId: pid, atividadeIds: tiposDe(pid) })),
  );
  const concluirAgendaIds = candidatas.filter((a) => !desmarcadas.includes(a.id)).map((a) => a.id);
  const transplanteId = atividades.data?.find((a) => a.nome === ATIVIDADE_TRANSPLANTE)?.id;
  const comTransplante = !!transplanteId && tocadas.some((pid) => tiposDe(pid).includes(transplanteId));

  const fluxo = fluxoRegistrar({
    temFotos: lote.items.length > 0,
    temPlantas: tocadas.length > 0,
    plantaFixa: !!plantaFixa,
    temTipos: tocadas.length > 0 && tocadas.every((pid) => tiposDe(pid).length > 0),
    temCandidatas: candidatas.length > 0,
  });
  const { etapa, ir, avancar, voltar, sair } = useEtapas(fluxo, tocadas.length > 1 ? ['ajustar'] : []);
  const progresso = { etapas: fluxo.sequencia.filter((e) => e !== 'inicio' && e !== 'triagem'), atual: etapa };

  const tituloDe = (pid: string) => {
    const alvo = lote.porId.get(pid);
    return `${alvo?.identificador ? `#${alvo.identificador} · ` : ''}${alvo?.nova ? 'Planta nova' : plantaTitulo(alvo)}`;
  };
  const thumbDe = (pid: string) => {
    const foto = fotosDe(pid)[0];
    return foto ? (
      <FilePreview file={foto.item.file} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
    ) : (
      <PlantThumb url={lote.porId.get(pid)?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
    );
  };

  function escolherArquivos(files: FileList | null) {
    const lista = [...(files ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!lista.length) return;
    setSemFoto(null);
    lote.trocarArquivos(lista, plantaFixa);
    setTriagem({ inicio: 0, voltarDireto: false });
    ir(plantaFixa ? 'feito' : 'triagem');
  }

  function semFotoEm(ids: string[]) {
    lote.trocarArquivos([]);
    setSemFoto(ids);
    ir('feito');
  }

  function continuarDeFeito() {
    if (tocadas.some((pid) => !tiposDe(pid).length)) return toast('Escolha o que foi feito em cada planta.', 'error');
    avancar();
  }

  function validarFinal(): boolean {
    const erro = !tocadas.length
      ? 'Nenhuma planta escolhida.'
      : !data || data > toDateInput()
        ? 'A data não pode ser no futuro.'
        : proximos.some((p) => !p.atividadeId || !p.data || !repetirValido(p.repetir))
          ? 'Complete os próximos passos (em Mais opções).'
          : null;
    if (erro) toast(erro, 'error');
    return !erro;
  }

  function salvar() {
    if (validarFinal()) setSalvando(true);
  }

  function reenviarESalvar() {
    if (!validarFinal()) return;
    lote.reenviarFalhas();
    setSalvando(true);
  }

  // Salvar: espera os uploads, cria plantas novas e registra tudo numa chamada
  const enviandoRef = useRef(false);
  useEffect(() => {
    if (!salvando || enviandoRef.current || lote.uploadsPendentes) return;
    if (lote.falhas.length) {
      toast(`${lote.falhas.length} foto(s) não foram enviadas.`, 'error');
      setSalvando(false);
      return;
    }
    enviandoRef.current = true;
    (async () => {
      try {
        const mapa = await lote.criarPlantasNovas();
        const real = (pid: string) => mapa.get(pid) ?? pid;
        const hoje = data === toDateInput();
        await agendasApi.registrar({
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
          proximos: proximosParaApi(proximos),
          concluirAgendaIds: concluirAgendaIds.length ? concluirAgendaIds : undefined,
          moverRecemTransplantada: comTransplante && moverTransplante ? true : undefined,
        });
        if (comTransplante) lembrarMover(moverTransplante);
        queryClient.invalidateQueries({ queryKey: keys.agendas });
        queryClient.invalidateQueries({ queryKey: keys.rotinas });
        queryClient.invalidateQueries({ queryKey: ['fotos'] });
        queryClient.invalidateQueries({ queryKey: keys.plantas });
        const k = concluirAgendaIds.length;
        const extra = k ? ` · ${k === 1 ? '1 tarefa concluída' : `${k} tarefas concluídas`}` : '';
        toast(`Cuidado registrado 🌿${tocadas.length > 1 ? ` em ${tocadas.length} plantas` : ''}${extra}`);
        if (montadoRef.current) sair();
      } catch (error) {
        toast(errorMessage(error), 'error');
        // Candidata obsoleta (tarefa concluída/apagada em outro lugar): atualiza a lista para a nova tentativa
        queryClient.invalidateQueries({ queryKey: keys.agendas });
        setSalvando(false);
      } finally {
        enviandoRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salvando, lote.uploadsPendentes]);

  if (plantas.isLoading) return <Spinner />;
  // Sem a lista não dá para reconhecer os códigos: a triagem ofereceria criar plantas que já existem
  if (plantas.isError && !salvando) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Registrar cuidado" back />
        <ErrorState text={errorMessage(plantas.error)} onRetry={() => plantas.refetch()} />
      </div>
    );
  }

  // ───────────── Triagem ─────────────
  if (etapa === 'triagem') {
    return (
      <TriagemFotos
        key={`${triagem.inicio}-${triagem.voltarDireto}`}
        lote={lote}
        inicio={triagem.inicio}
        voltarDireto={triagem.voltarDireto}
        onFim={() => (triagem.voltarDireto ? voltar() : ir('feito'))}
        onSair={voltar}
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
  if (etapa === 'inicio') {
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
          <button
            onClick={() => (plantaFixa ? semFotoEm([plantaFixa]) : setEscolherPlantas(true))}
            className="mt-4 text-sm font-medium text-primary underline"
          >
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
            semFotoEm(ids);
          }}
        />
      </div>
    );
  }

  // ───────────── Ajustar plantas (desvio) ─────────────
  if (etapa === 'ajustar') {
    return (
      <FluxoLayout titulo="Ajustar plantas" rodape={<Button block onClick={voltar}>Pronto</Button>}>
        <AjustarPlantas
          itens={tocadas.map((pid) => ({
            id: pid,
            thumb: thumbDe(pid),
            titulo: tituloDe(pid),
            subtitulo: `${fotosDe(pid).length ? `${fotosDe(pid).length} foto(s)` : 'Sem foto'}${ehNova(pid) ? ' · será criada ao salvar' : ''}`,
            ajustado: temAjuste(ajuste(pid)),
          }))}
          conteudo={(pid) => {
            const aj = ajuste(pid);
            const fotos = fotosDe(pid);
            return (
              <>
                <AtividadeChips value={tiposDe(pid)} onChange={(ids) => setAjuste(pid, { atividadeIds: ids })} label="O que foi feito nesta" dica={dicaPara(ehNova(pid) ? [] : [pid])} />
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
                      ir('triagem');
                    }}
                  />
                )}
              </>
            );
          }}
        />
      </FluxoLayout>
    );
  }

  // ───────────── O que foi feito ─────────────
  if (etapa === 'feito') {
    const ajustadas = tocadas.filter((pid) => temAjuste(ajuste(pid))).length;
    return (
      <FluxoLayout titulo="O que foi feito" progresso={progresso} rodape={<Button block onClick={continuarDeFeito}>Continuar</Button>}>
        <p className="text-sm text-muted">{tocadas.length > 1 ? `${tocadas.length} plantas` : tituloDe(tocadas[0])}</p>
        <AtividadeChips
          value={atividadeIds}
          onChange={setAtividadeIds}
          label={tocadas.length > 1 ? 'Em todas as plantas' : 'Tipos de cuidado'}
          dica={dicaPara(reais)}
        />
        {tocadas.length > 1 && (
          <button type="button" onClick={() => ir('ajustar')} className="card flex w-full items-center gap-3 p-3 text-left">
            <SlidersHorizontal size={18} className="shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Fez algo diferente em alguma?</span>
              <span className={`block text-xs ${ajustadas ? 'font-medium text-primary' : 'text-muted'}`}>
                {ajustadas ? `${ajustadas} planta(s) com ajuste próprio` : 'Ajustar plantas'}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </button>
        )}
      </FluxoLayout>
    );
  }

  // ───────────── Tarefas agendadas ─────────────
  if (etapa === 'tarefas') {
    return (
      <FluxoLayout titulo="Tarefas agendadas" progresso={progresso} rodape={<Button block onClick={avancar}>Continuar</Button>}>
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
      </FluxoLayout>
    );
  }

  // ───────────── Finalizar ─────────────
  const nFotos = lote.items.filter((i) => i.plantaId).length;
  const puladas = lote.items.filter((i) => i.plantaId === null).length;
  const nomes = atividadeIds.map((id) => atividades.data?.find((a) => a.id === id)?.nome).filter(Boolean).join(', ');
  const ajustadas = tocadas.filter((pid) => temAjuste(ajuste(pid))).length;
  const resumo = resumoMaisOpcoes([
    (detalhes.trim() || Object.values(ajustes).some((a) => a.detalhes.trim())) && 'Nota',
    (observacaoFutura.trim() || Object.values(ajustes).some((a) => a.observacaoFutura.trim())) && 'Obs. para o futuro',
    comTransplante && (moverTransplante ? 'Mover p/ Recém transplantadas' : 'Não mover p/ Recém transplantadas'),
    proximos.length > 0 && (proximos.length === 1 ? '1 próximo passo' : `${proximos.length} próximos passos`),
  ]);
  return (
    <FluxoLayout
      titulo="Finalizar"
      progresso={progresso}
      rodape={
        <>
          {lote.falhas.length > 0 && !salvando && (
            <Button block variant="secondary" onClick={reenviarESalvar}>
              Reenviar {lote.falhas.length} foto(s) e salvar
            </Button>
          )}
          <Button block onClick={salvar} loading={salvando}>
            {salvando && lote.uploadsPendentes ? `Enviando fotos… ${lote.enviados}/${lote.enviaveis}` : 'Registrar'}
          </Button>
        </>
      }
    >
      <section className="card flex items-center gap-3 p-3">
        {thumbDe(tocadas[0])}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{tocadas.length > 1 ? `${tocadas.length} plantas` : tituloDe(tocadas[0])}</span>
          <span className="block truncate text-xs text-muted">
            {nFotos ? `${nFotos} foto(s)` : 'Sem foto'}
            {nomes && ` · ${nomes}`}
            {ajustadas > 0 && ` · ${ajustadas} com ajuste`}
          </span>
        </span>
      </section>
      <QuandoCampo value={data} onChange={setData} />
      <MaisOpcoes resumo={resumo} dica="Nota, observação para o futuro, próximos passos">
        <Field label="Nota">
          <textarea className="input min-h-20" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="O que foi feito" />
        </Field>
        <Field label="Obs. para o futuro" hint="Aparece em destaque no histórico da planta.">
          <textarea className="input min-h-16" value={observacaoFutura} onChange={(e) => setObservacaoFutura(e.target.value)} placeholder="Ex.: arame apertado no galho da esquerda" />
        </Field>
        {comTransplante && <MoverTransplanteCampo checked={moverTransplante} onChange={setMoverEscolha} />}
        <ProximosPassos value={proximos} onChange={setProximos} />
      </MaisOpcoes>
      {puladas > 0 && <p className="text-xs text-muted">{puladas} foto(s) puladas não serão salvas.</p>}
      {inputs}
    </FluxoLayout>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd web && npm run build && npm run lint`
Expected: ok. (Se `lote.porId.get(pid)` não tiver `fotoCapaUrl` no tipo `Alvo`, manter o mesmo acesso usado antes — `PlantThumb url={alvo?.fotoCapaUrl}` já compilava.)

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/RegistrarPage.tsx
git commit -m "feat(web): Registrar cuidado em etapas com Ajustar plantas e Mais opções"
```

---

### Task 4: Concluir em etapas

**Files:**
- Modify (reescrever): `web/src/pages/ConcluirPage.tsx`

**Interfaces:**
- Consumes: `fluxoConcluir`, `resumoMaisOpcoes` (Task 1); peças da Task 2.

- [ ] **Step 1: Reescrever `ConcluirPage.tsx`**:

```tsx
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import { Button, EmptyState, ErrorState, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { ProximosPassos, proximosParaApi, type Proximo } from '@/components/care/ProximosPassos';
import { repetirValido } from '@/components/care/RepetirCampo';
import { PhotoInput } from '@/components/PhotoInput';
import { AjustarPlantas } from '@/components/fluxo/AjustarPlantas';
import { FluxoLayout } from '@/components/fluxo/FluxoLayout';
import { MaisOpcoes } from '@/components/fluxo/MaisOpcoes';
import { MoverTransplanteCampo } from '@/components/fluxo/MoverTransplanteCampo';
import { QuandoCampo } from '@/components/fluxo/QuandoCampo';
import { useEtapas } from '@/components/fluxo/useEtapas';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fluxoConcluir, resumoMaisOpcoes } from '@/lib/fluxos';
import { fromDateInput, plantaRotulo, toDateInput } from '@/lib/format';
import { keys, useAgendas, useAtividadesOrdenadas, useLembrarMover, useMoverRecemTransplantada } from '@/lib/queries';
import { ATIVIDADE_TRANSPLANTE } from '@/types';
import { uploadImage } from '@/lib/upload';

interface Ajuste {
  detalhes: string;
  observacaoFutura: string;
  foto: File | null;
}

const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '', foto: null };
const temAjuste = (aj: Ajuste) => !!(aj.detalhes || aj.observacaoFutura || aj.foto);

/** Concluir uma tarefa ou um grupo em etapas: procedimento → finalizar (+ desvio Ajustar plantas). */
export function ConcluirPage() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const agendas = useAgendas();
  const atividades = useAtividadesOrdenadas();

  const ids = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean), [params]);
  const tarefas = useMemo(
    () => (agendas.data ?? []).filter((a) => ids.includes(a.id) && a.status === 'PENDENTE'),
    [agendas.data, ids],
  );

  const [desmarcadas, setDesmarcadas] = useState<Set<string>>(new Set());
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [trocarAtividade, setTrocarAtividade] = useState(false);
  const [atividadeId, setAtividadeId] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [escolherExtra, setEscolherExtra] = useState(false);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [proximos, setProximos] = useState<Proximo[]>([]);
  const moverPadrao = useMoverRecemTransplantada();
  const lembrarMover = useLembrarMover();
  const [moverEscolha, setMoverEscolha] = useState<boolean | null>(null);
  const moverTransplante = moverEscolha ?? moverPadrao;
  const [salvando, setSalvando] = useState(false);

  const marcadas = tarefas.filter((t) => !desmarcadas.has(t.id));
  const atividadeAtual = tarefas[0]?.atividade;
  const nomeAtividade = (id: string) => atividades.data.find((a) => a.id === id)?.nome ?? '…';
  const transplanteId = atividades.data.find((a) => a.nome === ATIVIDADE_TRANSPLANTE)?.id;
  const comTransplante =
    !!transplanteId &&
    (marcadas.some((t) => (atividadeId || t.atividadeId) === transplanteId) || extras.includes(transplanteId));

  const fluxo = fluxoConcluir({ temMarcadas: marcadas.length > 0 });
  const { etapa, ir, avancar, voltar, sair } = useEtapas(fluxo, marcadas.length > 1 ? ['ajustar'] : []);
  const progresso = { etapas: fluxo.sequencia, atual: etapa };

  const alternar = (id: string) =>
    setDesmarcadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const ajuste = (id: string) => ajustes[id] ?? AJUSTE_VAZIO;
  const setAjuste = (id: string, patch: Partial<Ajuste>) =>
    setAjustes((a) => ({ ...a, [id]: { ...ajuste(id), ...patch } }));

  async function concluir() {
    if (!marcadas.length) return toast('Marque ao menos uma planta.', 'error');
    if (!data) return toast('Informe a data.', 'error');
    if (data > toDateInput()) return toast('A data não pode ser no futuro.', 'error');
    if (proximos.some((p) => !p.atividadeId || !p.data || !repetirValido(p.repetir)))
      return toast('Complete os próximos passos (em Mais opções).', 'error');
    setSalvando(true);
    try {
      const urlComum = foto ? await uploadImage(foto) : null;
      const itens = [];
      for (const t of marcadas) {
        const aj = ajuste(t.id);
        const urlPropria = aj.foto ? await uploadImage(aj.foto) : null;
        itens.push({
          agendaId: t.id,
          detalhes: aj.detalhes.trim() || undefined,
          observacaoFutura: aj.observacaoFutura.trim() || undefined,
          fotos: [urlComum, urlPropria].filter((u): u is string => !!u),
        });
      }
      const hoje = data === toDateInput();
      const principalId = atividadeId || atividadeAtual?.id;
      const extrasFinais = extras.filter((e) => e !== principalId);
      await agendasApi.concluir({
        dataConcluida: hoje ? new Date().toISOString() : fromDateInput(data),
        atividadeId: atividadeId || undefined,
        detalhes: detalhes.trim() || undefined,
        observacaoFutura: observacaoFutura.trim() || undefined,
        extras: extrasFinais.length ? extrasFinais : undefined,
        proximos: proximosParaApi(proximos),
        itens,
        moverRecemTransplantada: comTransplante && moverTransplante ? true : undefined,
      });
      if (comTransplante) lembrarMover(moverTransplante);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      queryClient.invalidateQueries({ queryKey: ['fotos'] });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast(`${marcadas.length > 1 ? `${marcadas.length} tarefas concluídas` : 'Tarefa concluída'} 🌿`);
      sair();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  if (agendas.isLoading || atividades.isLoading) return <><PageHeader title="Concluir" back /><Spinner /></>;
  if (agendas.isError) {
    return (
      <>
        <PageHeader title="Concluir" back />
        <ErrorState text={errorMessage(agendas.error)} onRetry={() => agendas.refetch()} />
      </>
    );
  }
  if (!tarefas.length) {
    return (
      <>
        <PageHeader title="Concluir" back />
        <EmptyState title="Nada para concluir" text="Essas tarefas já foram concluídas ou não existem mais." />
      </>
    );
  }

  // ───────────── Ajustar plantas (desvio) ─────────────
  if (etapa === 'ajustar') {
    return (
      <FluxoLayout titulo="Ajustar plantas" rodape={<Button block onClick={voltar}>Pronto</Button>}>
        <AjustarPlantas
          itens={marcadas.map((t) => ({
            id: t.id,
            thumb: <PlantThumb url={t.planta?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />,
            titulo: plantaRotulo(t.planta),
            subtitulo: t.planta?.identificador && t.planta?.nome ? t.planta.nome : undefined,
            ajustado: temAjuste(ajuste(t.id)),
          }))}
          conteudo={(id) => {
            const aj = ajuste(id);
            return (
              <>
                <Field label="Descrição desta planta">
                  <textarea className="input min-h-16" value={aj.detalhes} onChange={(e) => setAjuste(id, { detalhes: e.target.value })} placeholder={detalhes || 'Substitui a descrição geral'} />
                </Field>
                <Field label="Obs. desta planta">
                  <textarea className="input min-h-16" value={aj.observacaoFutura} onChange={(e) => setAjuste(id, { observacaoFutura: e.target.value })} placeholder={observacaoFutura || 'Substitui a obs. geral'} />
                </Field>
                <PhotoInput file={aj.foto} onChange={(f) => setAjuste(id, { foto: f })} label="Foto desta planta" aspect="aspect-[16/9]" />
              </>
            );
          }}
        />
      </FluxoLayout>
    );
  }

  // ───────────── Finalizar ─────────────
  if (etapa === 'final') {
    const resumo = resumoMaisOpcoes([
      detalhes.trim() && 'Descrição',
      observacaoFutura.trim() && 'Obs.',
      comTransplante && (moverTransplante ? 'Mover p/ Recém transplantadas' : 'Não mover p/ Recém transplantadas'),
      proximos.length > 0 && (proximos.length === 1 ? '1 próximo passo' : `${proximos.length} próximos passos`),
    ]);
    return (
      <FluxoLayout
        titulo="Finalizar"
        progresso={progresso}
        rodape={
          <Button block onClick={concluir} loading={salvando} disabled={!marcadas.length}>
            Concluir{marcadas.length > 1 ? ` (${marcadas.length})` : ''}
          </Button>
        }
      >
        <QuandoCampo value={data} onChange={setData} />
        <PhotoInput
          file={foto}
          onChange={setFoto}
          label={marcadas.length > 1 ? 'Foto (todas as plantas)' : 'Foto (opcional)'}
          aspect="aspect-[16/9]"
        />
        <MaisOpcoes resumo={resumo} dica="Descrição, observação, próximos passos">
          <Field label="Descrição" hint="Se preencher, substitui a observação do agendamento.">
            <textarea className="input min-h-20" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="O que foi feito" />
          </Field>
          <Field label="Obs." hint="Aparece em destaque no histórico da planta.">
            <textarea className="input min-h-16" value={observacaoFutura} onChange={(e) => setObservacaoFutura(e.target.value)} placeholder="Ex.: arame apertado no galho da esquerda" />
          </Field>
          {comTransplante && <MoverTransplanteCampo checked={moverTransplante} onChange={setMoverEscolha} />}
          <ProximosPassos value={proximos} onChange={setProximos} />
        </MaisOpcoes>
      </FluxoLayout>
    );
  }

  // ───────────── Procedimento ─────────────
  const ajustadas = marcadas.filter((t) => temAjuste(ajuste(t.id))).length;
  return (
    <FluxoLayout
      titulo={tarefas.length > 1 ? `Concluir ${atividadeAtual?.nome ?? 'grupo'}` : 'Concluir tarefa'}
      progresso={progresso}
      rodape={
        <Button block onClick={avancar} disabled={!marcadas.length}>
          Continuar
        </Button>
      }
    >
      {/* Plantas */}
      <section>
        <span className="label">{tarefas.length > 1 ? 'Plantas' : 'Planta'}</span>
        <div className="space-y-2">
          {tarefas.map((t) => {
            const marcada = !desmarcadas.has(t.id);
            return (
              <div key={t.id} className={`card flex items-center gap-3 p-2.5 ${marcada ? '' : 'opacity-50'}`}>
                {tarefas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => alternar(t.id)}
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                      marcada ? 'border-primary bg-primary text-white' : 'border-line'
                    }`}
                    aria-pressed={marcada}
                    aria-label={`Incluir ${plantaRotulo(t.planta)}`}
                  >
                    {marcada && <Check size={16} strokeWidth={3} />}
                  </button>
                )}
                <PlantThumb url={t.planta?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{plantaRotulo(t.planta)}</p>
                  {t.planta?.identificador && t.planta?.nome && <p className="truncate text-sm text-muted">{t.planta.nome}</p>}
                  {t.detalhes && (
                    <p className="truncate text-xs text-primary-dark" title={t.detalhes}>
                      Obs.: {t.detalhes}
                    </p>
                  )}
                  {marcada && temAjuste(ajuste(t.id)) && <p className="text-xs font-medium text-primary">Com ajuste próprio</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Atividade */}
      <section>
        <span className="label">Procedimento</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-active">{atividadeId ? nomeAtividade(atividadeId) : atividadeAtual?.nome}</span>
          <Button variant="ghost" size="sm" type="button" onClick={() => setTrocarAtividade((v) => !v)}>
            {trocarAtividade ? 'Fechar' : 'Trocar'}
          </Button>
        </div>
        {trocarAtividade && (
          <div className="mt-2 flex flex-wrap gap-2">
            {atividades.data.map((a) => (
              <button
                type="button"
                key={a.id}
                className={`chip ${(atividadeId || atividadeAtual?.id) === a.id ? 'chip-active' : ''}`}
                onClick={() => {
                  setAtividadeId(a.id === atividadeAtual?.id ? '' : a.id);
                  setExtras((x) => x.filter((e) => e !== a.id));
                  setTrocarAtividade(false);
                }}
              >
                {a.nome}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Feito junto */}
      <section>
        <span className="label">Feito junto (opcional)</span>
        <div className="flex flex-wrap gap-2">
          {extras.map((id) => (
            <button
              type="button"
              key={id}
              className="chip chip-active"
              onClick={() => setExtras((x) => x.filter((e) => e !== id))}
              aria-label={`Remover ${nomeAtividade(id)}`}
            >
              {nomeAtividade(id)} <X size={14} />
            </button>
          ))}
          <Button variant="ghost" size="sm" type="button" onClick={() => setEscolherExtra((v) => !v)}>
            <Plus size={16} /> Procedimento
          </Button>
        </div>
        {escolherExtra && (
          <div className="mt-2 flex flex-wrap gap-2">
            {atividades.data
              .filter((a) => !extras.includes(a.id) && a.id !== (atividadeId || atividadeAtual?.id))
              .map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className="chip"
                  onClick={() => {
                    setExtras((x) => [...x, a.id]);
                    setEscolherExtra(false);
                  }}
                >
                  {a.nome}
                </button>
              ))}
          </div>
        )}
      </section>

      {marcadas.length > 1 && (
        <button type="button" onClick={() => ir('ajustar')} className="card flex w-full items-center gap-3 p-3 text-left">
          <SlidersHorizontal size={18} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Algo diferente em alguma planta?</span>
            <span className={`block text-xs ${ajustadas ? 'font-medium text-primary' : 'text-muted'}`}>
              {ajustadas ? `${ajustadas} planta(s) com ajuste próprio` : 'Ajustar plantas (descrição, obs., foto)'}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </button>
      )}
    </FluxoLayout>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd web && npm run build && npm run lint`
Expected: ok.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/ConcluirPage.tsx
git commit -m "feat(web): Concluir em etapas com Ajustar plantas e Mais opções"
```

---

### Task 5: Agendar como página em etapas + Reagendar em sheet

**Files:**
- Modify: `web/src/components/care/PlantasPicker.tsx` (extrair `PlantasLista`, remover `PlantasCampo`)
- Create: `web/src/components/care/DataFuturaCampo.tsx`, `web/src/components/care/ReagendarSheet.tsx`, `web/src/pages/AgendarPage.tsx`
- Delete: `web/src/components/care/ScheduleCareSheet.tsx`
- Modify: `web/src/context/CareContext.tsx`, `web/src/App.tsx`

**Interfaces:**
- Consumes: `fluxoAgendar`, `resumoMaisOpcoes` (Task 1); `useEtapas`, `FluxoLayout`, `MaisOpcoes` (Task 2).
- Produces: `PlantasLista({ selecionadas: string[]; onChange(ids: string[]) })`; `DataFuturaCampo({ label?: string; value: string; onChange(v: string); livre?: boolean })`; `ReagendarSheet({ agenda: Agenda; onClose() })`; rota `/agendar?planta=&repetir=1`.

- [ ] **Step 1: `PlantasPicker.tsx`** — substituir o arquivo por:

```tsx
import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { Button, PlantThumb } from '@/components/ui';
import { especieNome, plantaTitulo } from '@/lib/format';
import { usePlantas } from '@/lib/queries';
import type { Planta } from '@/types';

const SEM_ESPECIE = 'sem-especie';
const grupoDe = (p: Planta) => p.especieId ?? SEM_ESPECIE;

/** Escolha de várias plantas (controlada): busca, "Todas", grupos por espécie e lista com checkbox. */
export function PlantasLista({ selecionadas, onChange }: { selecionadas: string[]; onChange: (ids: string[]) => void }) {
  const plantas = usePlantas();
  const [busca, setBusca] = useState('');
  const todas = useMemo(() => plantas.data ?? [], [plantas.data]);
  const sel = useMemo(() => new Set(selecionadas), [selecionadas]);

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
  const alternarGrupo = (ids: string[]) => {
    const n = new Set(sel);
    if (tudoMarcado(ids)) ids.forEach((id) => n.delete(id));
    else ids.forEach((id) => n.add(id));
    onChange([...n]);
  };
  const alternar = (id: string) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onChange([...n]);
  };

  return (
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
  );
}

/** `PlantasLista` num sheet com "Pronto". */
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
  const [sel, setSel] = useState(selecionadas);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={titulo}
      footer={
        <Button block disabled={!sel.length} onClick={() => onConfirmar(sel)}>
          Pronto{sel.length ? ` (${sel.length})` : ''}
        </Button>
      }
    >
      <PlantasLista selecionadas={sel} onChange={setSel} />
    </Sheet>
  );
}
```

- [ ] **Step 2: `DataFuturaCampo.tsx`**

```tsx
import { useMemo } from 'react';
import { Field } from '@/components/ui';
import { atalhosDeData } from '@/lib/estacoes';
import { dataNumerica, fromDateInput, toDateInput } from '@/lib/format';

/** Data de uma tarefa com atalhos (amanhã, semanas, estações). `livre` aceita datas passadas (reagendar). */
export function DataFuturaCampo({
  label = 'Data',
  value,
  onChange,
  livre,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  livre?: boolean;
}) {
  const atalhos = useMemo(() => atalhosDeData(), []);
  return (
    <div>
      <Field label={label}>
        <input type="date" className="input" value={value} min={livre ? undefined : toDateInput()} onChange={(e) => onChange(e.target.value)} required />
      </Field>
      <div className="mt-2 flex flex-wrap gap-2">
        {atalhos.map((a) => (
          <button
            type="button"
            key={a.label}
            className={`chip py-1.5 text-xs ${value === a.data ? 'chip-active' : ''}`}
            onClick={() => onChange(a.data)}
          >
            {a.label} <span className="opacity-60">· {dataNumerica(fromDateInput(a.data)).slice(0, 5)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `ReagendarSheet.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui';
import { DataFuturaCampo } from './DataFuturaCampo';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fromDateInput, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda } from '@/types';

/** Reagendar uma tarefa existente: só a nova data. */
export function ReagendarSheet({ agenda, onClose }: { agenda: Agenda; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [data, setData] = useState(() => toDateInput(agenda.dataAgendada));
  const [salvando, setSalvando] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await agendasApi.update(agenda.id, { dataAgendada: fromDateInput(data) });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast('Tarefa reagendada');
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title="Reagendar tarefa">
      <form onSubmit={submit} className="space-y-5 pb-2">
        <p className="text-sm text-muted">
          {agenda.atividade?.nome} · {agenda.planta?.nome || 'planta'}
        </p>
        <DataFuturaCampo value={data} onChange={setData} livre />
        <Button type="submit" block loading={salvando}>
          Salvar nova data
        </Button>
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 4: `AgendarPage.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field } from '@/components/ui';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { DataFuturaCampo } from '@/components/care/DataFuturaCampo';
import { PlantasLista } from '@/components/care/PlantasPicker';
import { RepetirCampo, repetirParaApi, repetirValido, type RepetirValor } from '@/components/care/RepetirCampo';
import { FluxoLayout } from '@/components/fluxo/FluxoLayout';
import { MaisOpcoes } from '@/components/fluxo/MaisOpcoes';
import { useEtapas } from '@/components/fluxo/useEtapas';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi, guiasSazonaisApi, rotinasApi } from '@/lib/endpoints';
import { daquiADias, fromDateInput, plantaTitulo, toDateInput } from '@/lib/format';
import { fluxoAgendar, resumoMaisOpcoes } from '@/lib/fluxos';
import { keys, useAgendas, usePlantas, useRotinas } from '@/lib/queries';
import { estacoesDoGuia, medianaIntervaloDias, rotuloUltima, textoIntervalo, ultimasPorPlanta } from '@/lib/cuidados';

/** Agendar cuidados (ou criar rotinas) em etapas: plantas → cuidados → quando. `?planta=` pula a 1ª; `?repetir=1` abre em Repetir. */
export function AgendarPage() {
  const [params] = useSearchParams();
  const plantaFixa = params.get('planta') ?? undefined;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [plantaIds, setPlantaIds] = useState<string[]>(plantaFixa ? [plantaFixa] : []);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [detalhes, setDetalhes] = useState('');
  const [data, setData] = useState(() => toDateInput(daquiADias(1)));
  const [salvando, setSalvando] = useState(false);
  const [repetir, setRepetir] = useState<RepetirValor | null>(() =>
    params.get('repetir') === '1'
      ? { intervaloDias: 14, dataFim: '', estacoes: ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'] }
      : null,
  );
  const agendas = useAgendas();
  const ultimas = useMemo(() => ultimasPorPlanta(agendas.data ?? []), [agendas.data]);
  const dica = agendas.data && plantaIds.length
    ? (atividadeId: string) => rotuloUltima(plantaIds.map((p) => ultimas.get(p)?.get(atividadeId)))
    : undefined;
  const rotinas = useRotinas();
  const sugestao =
    plantaIds.length === 1 && atividadeIds.length === 1
      ? medianaIntervaloDias(agendas.data ?? [], plantaIds[0], atividadeIds[0])
      : null;
  const plantas = usePlantas();
  const especieId = plantaIds.length === 1 ? plantas.data?.find((p) => p.id === plantaIds[0])?.especieId : undefined;
  const guias = useQuery({
    queryKey: ['guias-sazonais', especieId],
    queryFn: () => guiasSazonaisApi.porEspecie(especieId!),
    enabled: !!especieId,
    staleTime: 5 * 60_000,
  });
  const estacoesSugeridas = atividadeIds.length === 1 && especieId ? estacoesDoGuia(guias.data, atividadeIds[0]) : null;
  const jaTem = (rotinas.data ?? []).filter((r) => plantaIds.includes(r.plantaId) && atividadeIds.includes(r.atividadeId));
  const total = plantaIds.length * atividadeIds.length;

  const fluxo = fluxoAgendar({ plantaFixa: !!plantaFixa, temPlantas: plantaIds.length > 0, temCuidados: atividadeIds.length > 0 });
  const { etapa, avancar, sair } = useEtapas(fluxo);
  const progresso = { etapas: fluxo.sequencia, atual: etapa };
  const resumoPlantas =
    plantaIds.length === 1 ? plantaTitulo(plantas.data?.find((p) => p.id === plantaIds[0])) : `${plantaIds.length} plantas`;

  async function salvar() {
    if (!plantaIds.length || !atividadeIds.length) return toast('Escolha as plantas e o tipo de cuidado.', 'error');
    if (!data) return toast('Informe a data.', 'error');
    if (repetir && !repetir.estacoes.length) return toast('Escolha ao menos uma estação.', 'error');
    if (repetir && !repetirValido(repetir)) return toast('Informe o intervalo em dias (1 a 3650).', 'error');
    setSalvando(true);
    try {
      let mensagem: string;
      if (repetir) {
        const r = await rotinasApi.create({
          plantaIds,
          atividadeIds,
          ...repetirParaApi(repetir),
          primeiraData: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        const n = r.criadas.length;
        const k = r.conflitos.length;
        mensagem = [
          n ? (n === 1 ? 'Rotina criada' : `${n} rotinas criadas`) : '',
          k ? (k === 1 ? '1 rotina já existia e foi mantida' : `${k} rotinas já existiam e foram mantidas`) : '',
        ]
          .filter(Boolean)
          .join(' · ');
      } else {
        await agendasApi.createLote({
          plantaIds,
          atividadeIds,
          dataAgendada: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        mensagem = total > 1 ? `${total} cuidados agendados` : 'Cuidado agendado';
      }
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast(mensagem);
      sair();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  if (etapa === 'plantas') {
    return (
      <FluxoLayout
        titulo="Em quais plantas?"
        progresso={progresso}
        rodape={
          <Button block onClick={avancar} disabled={!plantaIds.length}>
            Continuar{plantaIds.length ? ` (${plantaIds.length})` : ''}
          </Button>
        }
      >
        <PlantasLista selecionadas={plantaIds} onChange={setPlantaIds} />
      </FluxoLayout>
    );
  }

  if (etapa === 'cuidados') {
    return (
      <FluxoLayout
        titulo="Quais cuidados?"
        progresso={progresso}
        rodape={
          <Button block onClick={avancar} disabled={!atividadeIds.length}>
            Continuar
          </Button>
        }
      >
        <p className="text-sm text-muted">{resumoPlantas}</p>
        <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} dica={dica} />
      </FluxoLayout>
    );
  }

  return (
    <FluxoLayout
      titulo="Quando?"
      progresso={progresso}
      rodape={
        <Button block onClick={salvar} loading={salvando}>
          {repetir ? (total > 1 ? `Criar ${total} rotinas` : 'Criar rotina') : total > 1 ? `Agendar ${total} cuidados` : 'Agendar'}
        </Button>
      }
    >
      <p className="text-sm text-muted">{resumoPlantas}</p>
      <DataFuturaCampo label={repetir ? 'Primeira vez' : 'Data'} value={data} onChange={setData} />
      <RepetirCampo value={repetir} onChange={setRepetir} sugestao={sugestao} estacoesSugeridas={estacoesSugeridas} />
      {repetir && jaTem.length > 0 && (
        <p className="text-xs text-muted">
          {jaTem.length === 1
            ? `Já existe rotina de ${jaTem[0].atividade?.nome ?? 'cuidado'} (${textoIntervalo(jaTem[0].intervaloDias)}) — ela será mantida.`
            : `${jaTem.length} rotinas já existem e serão mantidas.`}
        </p>
      )}
      <MaisOpcoes resumo={resumoMaisOpcoes([detalhes.trim() && 'Observação'])} dica="Observação para a tarefa">
        <Field label="Observação">
          <textarea className="input min-h-16" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="Ex.: usar adubo Bioplant" />
        </Field>
      </MaisOpcoes>
    </FluxoLayout>
  );
}
```

- [ ] **Step 5: `CareContext.tsx`** — substituir por:

```tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ReagendarSheet } from '@/components/care/ReagendarSheet';
import type { Agenda } from '@/types';

interface CareContextData {
  registrarCuidado: (plantaId?: string) => void;
  /** `repetir`: abre já em "Repetir" (ex.: + Nova rotina). */
  agendarCuidado: (plantaId?: string, opcoes?: { repetir?: boolean }) => void;
  abrirTarefa: (agenda: Agenda) => void;
  reagendar: (agenda: Agenda) => void;
}

const CareContext = createContext<CareContextData | null>(null);

/** Ações de cuidado acessíveis de qualquer tela (Bancada, Coleção, Detalhe, botão +). */
export function CareProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  // Remonta o sheet a cada abertura para começar com a data da tarefa
  const [reagendando, setReagendando] = useState<{ agenda: Agenda; versao: number } | null>(null);
  const fechar = useCallback(() => setReagendando(null), []);

  const value = useMemo(
    () => ({
      registrarCuidado: (plantaId?: string) => navigate(plantaId ? `/registrar?planta=${plantaId}` : '/registrar'),
      agendarCuidado: (plantaId?: string, opcoes?: { repetir?: boolean }) => {
        const p = new URLSearchParams();
        if (plantaId) p.set('planta', plantaId);
        if (opcoes?.repetir) p.set('repetir', '1');
        const s = p.toString();
        navigate(s ? `/agendar?${s}` : '/agendar');
      },
      abrirTarefa: (agenda: Agenda) => navigate(`/tarefas/${agenda.id}`),
      reagendar: (agenda: Agenda) => setReagendando((r) => ({ agenda, versao: (r?.versao ?? 0) + 1 })),
    }),
    [navigate],
  );

  return (
    <CareContext.Provider value={value}>
      {children}
      {reagendando && <ReagendarSheet key={reagendando.versao} agenda={reagendando.agenda} onClose={fechar} />}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error('useCare precisa estar dentro de <CareProvider>');
  return ctx;
}
```

- [ ] **Step 6: Rota** — em `web/src/App.tsx`, importar `AgendarPage` de `@/pages/AgendarPage` (mesmo estilo dos outros imports de páginas) e adicionar depois da rota `/registrar`:

```tsx
        <Route path="/agendar" element={<Privada><AgendarPage /></Privada>} />
```

- [ ] **Step 7: Apagar o sheet antigo**

Run: `git rm web/src/components/care/ScheduleCareSheet.tsx`
Then: `grep -rn "ScheduleCareSheet\|PlantasCampo" web/src` → Expected: nenhum resultado.

- [ ] **Step 8: Verify**

Run: `cd web && npm test && npm run build && npm run lint`
Expected: tudo ok.

- [ ] **Step 9: Commit**

```bash
git add -A web/src
git commit -m "feat(web): Agendar vira página em etapas; Reagendar fica num sheet só com a data"
```

---

### Task 6: Verificação no navegador + docs

**Files:**
- Modify: `CLAUDE.md` (estrutura do frontend), `docs/todo.md` (marcar item)

- [ ] **Step 1: Subir local** — `docker compose up -d` (API) e `cd web && npm run dev`; abrir `http://localhost:5173` em largura 390px com a conta de teste.

- [ ] **Step 2: Roteiro**
  1. Registrar pelo "+" sem foto, 3 plantas → feito (chips) → Ajustar plantas (mudar tipos de uma) → voltar → Continuar → (tarefas, se houver) → Finalizar → Mais opções fechado mostra resumo → Registrar. Toast ok e volta à tela de origem.
  2. Registrar com fotos da galeria (`test-assets/`) → triagem → feito → final; voltar do navegador entre etapas preserva escolhas; recarregar no meio volta ao início.
  3. Registrar Transplante: desmarcar "Mover p/ Recém transplantadas" → salvar → Perfil mostra desmarcado; novo Transplante já vem desmarcado. Restaurar para marcado.
  4. Concluir 1 tarefa e um grupo pela Bancada (procedimento → finalizar; Ajustar plantas com 2+).
  5. Agendar pelo "+" (plantas → cuidados → quando) e pela planta (pula plantas); "+ Nova rotina" abre com Repetir; Reagendar pela TarefaPage abre o sheet só com data.

- [ ] **Step 3: Docs** — em `CLAUDE.md`, na descrição de estrutura do frontend: citar `src/lib/fluxos.ts` + `src/components/fluxo/` (etapas em `?etapa=`, `useEtapas`, Mais opções, Ajustar plantas), `AgendarPage` `/agendar?planta=&repetir=1` (substitui o sheet de agendar; `ReagendarSheet` só para reagendar) e a preferência `mover_recem_transplantada`. Em `docs/todo.md`, marcar os dois itens de telas em etapas como `[x]` com nota "Feito em 2026-10-07 (spec em docs/superpowers/specs/2026-10-07-fluxos-em-etapas-design.md)".

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: fluxos de cuidado em etapas no CLAUDE.md"
```
