import { useLayoutEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Cuidado } from '@/lib/cuidadoDoDia';
import { deveReposicionarCarrossel } from '@/lib/rolagem';
import { PainelCuidado } from './PainelCuidado';

/** Cuidados feitos da planta lado a lado; deslizar troca de cuidado. Só o atual e os vizinhos são montados. */
export function CuidadosDaPlanta({
  cuidados,
  atual,
  onTrocar,
}: {
  cuidados: Cuidado[];
  atual: number;
  onTrocar: (indice: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const emitido = useRef<number | null>(null);

  // Abre no cuidado da URL; a troca que veio do próprio deslizar não puxa de volta
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const veioDaRolagem = emitido.current !== null;
    if (emitido.current === atual) emitido.current = null;
    if (deveReposicionarCarrossel({ painelVisivel: Math.round(el.scrollLeft / el.clientWidth), atual, veioDaRolagem })) {
      el.scrollLeft = atual * el.clientWidth;
    }
  }, [atual, cuidados.length]);

  function aoRolar() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (cuidados[i] && i !== atual && emitido.current !== i) {
      emitido.current = i;
      onTrocar(i);
    }
  }

  const irPara = (i: number) => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' });

  return (
    <div>
      <div ref={ref} onScroll={aoRolar} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        {cuidados.map((c, i) => (
          <div key={c.agendas[0].id} className="w-full shrink-0 snap-center snap-always">
            {Math.abs(i - atual) <= 1 && <PainelCuidado cuidado={c} />}
          </div>
        ))}
      </div>
      {cuidados.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-xs text-muted">
          <button
            onClick={() => irPara(atual - 1)}
            disabled={atual === 0}
            className="hidden size-8 items-center justify-center rounded-full hover:bg-primary-light disabled:opacity-30 sm:flex"
            aria-label="Cuidado anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="tabular-nums">
            {atual + 1} de {cuidados.length}
          </span>
          <button
            onClick={() => irPara(atual + 1)}
            disabled={atual === cuidados.length - 1}
            className="hidden size-8 items-center justify-center rounded-full hover:bg-primary-light disabled:opacity-30 sm:flex"
            aria-label="Próximo cuidado"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
