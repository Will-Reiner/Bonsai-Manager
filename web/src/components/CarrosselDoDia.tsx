import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Repeat } from 'lucide-react';
import { textoIntervalo } from '@/lib/cuidados';
import { dataLonga, dataRelativa } from '@/lib/format';
import type { Agenda } from '@/types';

/** Tarefas concluídas no mesmo dia na planta: um painel por tarefa, deslizando para o lado. */
export function CarrosselDoDia({ tarefas, atualId, onTrocar }: { tarefas: Agenda[]; atualId: string; onTrocar: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const atual = Math.max(0, tarefas.findIndex((t) => t.id === atualId));

  // Abre no painel da tarefa da URL (antes de pintar, sem pular do 1º painel)
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.clientWidth && Math.round(el.scrollLeft / el.clientWidth) !== atual) el.scrollLeft = atual * el.clientWidth;
  }, [atual]);

  function aoRolar() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (tarefas[i] && i !== atual) onTrocar(tarefas[i].id);
  }

  return (
    <div className="mt-4">
      <div ref={ref} onScroll={aoRolar} className="-mx-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        {tarefas.map((t) => (
          <Painel key={t.id} tarefa={t} />
        ))}
      </div>
      {tarefas.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {tarefas.map((t, i) => (
            <span key={t.id} className={`size-1.5 rounded-full ${i === atual ? 'bg-primary' : 'bg-line'}`} />
          ))}
          <span className="ml-1.5 text-xs text-muted">
            {atual + 1} de {tarefas.length}
          </span>
        </div>
      )}
    </div>
  );
}

function Painel({ tarefa: t }: { tarefa: Agenda }) {
  const quando = t.dataConcluida ?? t.dataAgendada;
  return (
    <section className="w-full shrink-0 snap-center px-4">
      <h2 className="text-lg font-semibold">{t.atividade?.nome ?? 'Cuidado'}</h2>
      <p className="text-sm text-muted">
        Concluída · {dataRelativa(quando)} ({dataLonga(quando)})
      </p>
      {t.rotina && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Repeat size={14} /> Rotina {textoIntervalo(t.rotina.intervaloDias)}
          {t.rotina.pausada && ' · pausada'}
        </p>
      )}
      {t.detalhes && <p className="mt-3 whitespace-pre-line text-sm">{t.detalhes}</p>}
      {t.observacaoFutura && <p className="mt-2 whitespace-pre-line text-sm text-accent">Próxima vez: {t.observacaoFutura}</p>}
      {!!t.fotos?.length && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {t.fotos.map((f) => (
            <Link
              key={f.id}
              to={`/plantas/${t.plantaId}/galeria?foto=${f.id}`}
              className="aspect-square overflow-hidden rounded-xl bg-primary-light"
            >
              <img src={f.caminhoArquivo} alt="" loading="lazy" className="size-full object-cover" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
