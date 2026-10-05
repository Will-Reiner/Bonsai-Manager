import { useNavigate } from 'react-router';
import { Check, StickyNote } from 'lucide-react';
import { PlantThumb } from './ui';
import { useCare } from '@/context/CareContext';
import { dataRelativa, diasAte, plantaRotulo } from '@/lib/format';
import type { Agenda } from '@/types';

/** Card da bancada: foto grande com o ID da planta em destaque. */
export function BenchTaskCard({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const { abrirTarefa } = useCare();
  const atrasada = diasAte(agenda.dataAgendada) < 0;
  const p = agenda.planta;
  const subtitulo = p?.identificador ? p?.nome || p?.especie?.nomeComum : p?.especie?.nomeComum;

  return (
    <div className="card overflow-hidden">
      <button onClick={() => abrirTarefa(agenda)} className="relative block w-full text-left" aria-label={`Abrir tarefa de ${plantaRotulo(p)}`}>
        <PlantThumb url={p?.fotoCapaUrl} className="aspect-[4/3] w-full" />
        <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-lg bg-black/70 px-2 py-1 text-base font-bold text-white">
          {plantaRotulo(p)}
        </span>
      </button>
      <div className="flex items-center gap-2 p-2.5">
        <button onClick={() => abrirTarefa(agenda)} className="min-w-0 flex-1 text-left">
          {subtitulo && <p className="truncate text-sm font-medium">{subtitulo}</p>}
          <p className={`truncate text-xs ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
            {dataRelativa(agenda.dataAgendada)}
          </p>
          {agenda.detalhes && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-primary-dark">
              <StickyNote size={12} className="shrink-0" /> <span className="truncate">{agenda.detalhes}</span>
            </p>
          )}
        </button>
        <button
          onClick={() => navigate(`/concluir?ids=${agenda.id}`)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-primary transition hover:bg-primary hover:text-white active:scale-90"
          aria-label={`Concluir ${agenda.atividade?.nome ?? 'tarefa'} de ${plantaRotulo(p)}`}
        >
          <Check size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
