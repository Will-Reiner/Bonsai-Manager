import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, MessageSquareText } from 'lucide-react';
import { Sheet } from './Sheet';
import { NotasDoCuidado } from './NotasDoCuidado';
import { dataCurta, dataRelativa } from '@/lib/format';
import { chaveItem, linhaDoTempo, tituloCuidado, type ItemLinha } from '@/lib/linhaDoTempo';
import type { Agenda } from '@/types';

type Cuidado = Extract<ItemLinha, { tipo: 'cuidado' }>;

/** Linha do tempo horizontal da planta: um card por dia de cuidado (esmaecidos), atual em destaque, futuros tracejados. */
export function HistoricoPlanta({ agendas, atualId }: { agendas: Agenda[]; atualId: string }) {
  const atualRef = useRef<HTMLDivElement>(null);
  const [nota, setNota] = useState<Cuidado | null>(null);

  const itens = useMemo(() => {
    const { passado, pendentes } = linhaDoTempo(agendas);
    return [...passado, ...pendentes];
  }, [agendas]);

  useEffect(() => {
    atualRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [atualId, itens.length]);

  return (
    <>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {itens.map((item) => {
          if (item.tipo === 'fotos') return null;
          const passado = item.tipo === 'cuidado';
          const atual = passado ? item.agendas.some((a) => a.id === atualId) : item.agenda.id === atualId;
          const atrasada = item.tipo === 'tarefa' && item.estado === 'atrasada';
          const foto = passado ? item.fotos[0]?.caminhoArquivo : item.agenda.fotos?.[0]?.caminhoArquivo;
          const titulo = passado ? tituloCuidado(item.agendas) : (item.agenda.atividade?.nome ?? 'Cuidado');
          return (
            <div
              key={chaveItem(item)}
              ref={atual ? atualRef : undefined}
              className={`relative w-36 shrink-0 snap-center rounded-2xl p-3 ${
                atual
                  ? 'border-2 border-primary bg-primary-light'
                  : passado
                    ? 'border border-line bg-card opacity-70'
                    : 'border-2 border-dashed border-line bg-card'
              }`}
            >
              {atual && <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Agora</span>}
              {foto && <img src={foto} alt="" loading="lazy" className="mb-2 aspect-square w-full rounded-lg object-cover" />}
              <p className="flex items-center gap-1 text-sm font-semibold leading-tight">
                {passado && <Check size={14} className="shrink-0 text-primary" />}
                <span className="line-clamp-2">{titulo}</span>
              </p>
              <p className={`mt-0.5 text-xs ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
                {passado ? dataCurta(item.data) : dataRelativa(item.data)}
              </p>
              {passado && item.notas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNota(item)}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-accent-light text-accent"
                  aria-label="Ver observações"
                >
                  <MessageSquareText size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!nota} onClose={() => setNota(null)} title={nota ? tituloCuidado(nota.agendas) : 'Observações'}>
        {nota && (
          <div className="space-y-3 pb-safe">
            <p className="text-sm text-muted">{dataCurta(nota.data)}</p>
            <NotasDoCuidado notas={nota.notas} />
          </div>
        )}
      </Sheet>
    </>
  );
}
