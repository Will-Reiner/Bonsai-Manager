import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { PlantThumb } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { ehAtrasada } from '@/lib/bancada';
import { dataRelativa, plantaRotulo } from '@/lib/format';
import type { Agenda } from '@/types';

/** Planta na faixa de fotos: cantos orgânicos, rótulo e ✓ sobre a foto; atrasada ganha contorno. */
export function FotoTarefa({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = ehAtrasada(agenda);
  const p = agenda.planta;

  return (
    <div className="w-28 shrink-0 snap-start">
      <div className={`relative rounded-[20px_20px_20px_6px] ${atrasada ? 'ring-2 ring-late ring-offset-2 ring-offset-bg' : ''}`}>
        <button type="button" onClick={() => abrirTarefa(agenda)} className="block w-full" aria-label={`Abrir tarefa de ${plantaRotulo(p)}`}>
          <PlantThumb url={p?.fotoCapaUrl} className="h-32 w-28 rounded-[20px_20px_20px_6px]" />
        </button>
        <span className="pointer-events-none absolute left-2 top-2 max-w-[80%] truncate rounded-full bg-bg/90 px-2 py-0.5 text-[11px] font-bold">
          {plantaRotulo(p)}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
          className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-bg text-primary shadow-sm transition active:scale-90"
          aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'} de ${plantaRotulo(p)}`}
        >
          <Check size={15} strokeWidth={2.5} />
        </button>
      </div>
      <p className={`mt-1.5 truncate text-[11px] ${atrasada ? 'font-bold text-late' : 'text-muted'}`}>{dataRelativa(agenda.dataAgendada)}</p>
    </div>
  );
}
