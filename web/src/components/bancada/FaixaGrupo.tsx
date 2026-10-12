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
