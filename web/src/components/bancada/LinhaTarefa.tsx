import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { PlantThumb } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { ehAtrasada } from '@/lib/bancada';
import { dataRelativa, diasAte, plantaNome, plantaRotulo } from '@/lib/format';
import type { Agenda } from '@/types';

/** Planta na lista: miniatura, rótulo e prazo; atrasada ganha fundo em degradê e traço à esquerda. */
export function LinhaTarefa({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = ehAtrasada(agenda);
  const p = agenda.planta;
  const dias = -diasAte(agenda.dataAgendada);
  const nome = plantaNome(p);

  return (
    <div
      className={`relative -mx-4 flex items-center gap-3 py-2 pl-12 pr-4 [&+&]:border-t [&+&]:border-line ${
        atrasada ? 'bg-gradient-to-r from-late-light via-late-light/70 to-transparent' : ''
      }`}
    >
      {atrasada && <span className="absolute bottom-3 left-9 top-3 w-[3px] rounded-full bg-late" aria-hidden />}
      <button type="button" onClick={() => abrirTarefa(agenda)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PlantThumb url={p?.fotoCapaUrl} className="size-11 shrink-0 rounded-[14px]" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {plantaRotulo(p)}
            {nome && <span className="font-normal text-muted"> · {nome}</span>}
          </span>
          <span className={`block truncate text-xs ${atrasada ? 'font-bold text-late' : 'text-muted'}`}>
            {atrasada ? `atrasada há ${dias} dia${dias > 1 ? 's' : ''}` : dataRelativa(agenda.dataAgendada)}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
        className="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary text-primary transition active:scale-90"
        aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'} de ${plantaRotulo(p)}`}
      >
        <Check size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
