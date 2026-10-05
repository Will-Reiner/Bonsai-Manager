import { useNavigate } from 'react-router';
import { Check, StickyNote } from 'lucide-react';
import { PlantThumb } from './ui';
import { useCare } from '@/context/CareContext';
import { dataRelativa, diasAte } from '@/lib/format';
import type { Agenda } from '@/types';

/** Card de tarefa: toque no card abre detalhes; o botão ✓ abre a tela de conclusão. */
export function TaskCard({ agenda, showPlanta = true }: { agenda: Agenda; showPlanta?: boolean }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = diasAte(agenda.dataAgendada) < 0;

  return (
    <div className="card flex items-center gap-3 p-2.5 pr-3">
      <button onClick={() => abrirTarefa(agenda)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {showPlanta && <PlantThumb url={agenda.planta?.fotoCapaUrl} className="size-12 shrink-0 rounded-xl" />}
        <div className="min-w-0">
          <p className="truncate font-semibold">{agenda.atividade?.nome ?? 'Cuidado'}</p>
          <p className="truncate text-sm text-muted">
            {showPlanta && <>{agenda.planta?.nome || agenda.planta?.especie?.nomeComum || 'Planta'} · </>}
            <span className={atrasada ? 'font-medium text-danger' : ''}>{dataRelativa(agenda.dataAgendada)}</span>
          </p>
          {agenda.status === 'PENDENTE' && agenda.detalhes && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-primary-dark">
              <StickyNote size={12} className="shrink-0" /> <span className="truncate">{agenda.detalhes}</span>
            </p>
          )}
        </div>
      </button>
      <button
        onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-primary transition hover:bg-primary hover:text-white active:scale-90"
        aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'}`}
      >
        <Check size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
