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
