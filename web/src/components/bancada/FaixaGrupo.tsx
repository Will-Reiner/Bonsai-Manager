import { useNavigate } from 'react-router';
import { estiloFaixa } from '@/lib/format';
import type { BlocoBancada } from '@/lib/bancada';

/** Faixa de ponta a ponta do bloco (grupo, tarefa ou espécie): "DEBILITADA · 2 · 1 atrasada". */
export function FaixaGrupo({ bloco, concluirIds }: { bloco: BlocoBancada; concluirIds?: string[] }) {
  const navigate = useNavigate();
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
      {concluirIds && concluirIds.length > 1 && (
        <button
          type="button"
          className="-my-2 ml-auto shrink-0 px-2 py-2 text-xs font-semibold normal-case tracking-normal"
          aria-label={`Concluir todas: ${bloco.titulo}`}
          onClick={() => navigate(`/concluir?ids=${concluirIds.join(',')}`)}
        >
          Concluir todas
        </button>
      )}
    </h3>
  );
}
