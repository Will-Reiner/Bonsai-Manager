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
          className="-my-2 shrink-0 px-2 py-2 text-xs font-semibold text-primary"
          aria-label={`Concluir todas: ${g.nome}`}
          onClick={() => navigate(`/concluir?ids=${g.agendas.map((a) => a.id).join(',')}`)}
        >
          Concluir todas
        </button>
      )}
    </div>
  );
}
