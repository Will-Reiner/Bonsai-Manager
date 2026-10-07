import { useEffect, useRef, useState } from 'react';
import { Check, MessageSquareText } from 'lucide-react';
import { Sheet } from './Sheet';
import { dataCurta, dataRelativa, diasAte } from '@/lib/format';
import type { Agenda } from '@/types';

const dataDe = (a: Agenda) => (a.status === 'CONCLUIDO' ? a.dataConcluida ?? a.dataAgendada : a.dataAgendada);

/** Linha do tempo horizontal da planta: passados esmaecidos, atual em destaque, futuros tracejados. */
export function HistoricoPlanta({ agendas, atualId }: { agendas: Agenda[]; atualId: string }) {
  const atualRef = useRef<HTMLDivElement>(null);
  const [nota, setNota] = useState<Agenda | null>(null);

  const itens = agendas
    .filter((a) => a.status !== 'CANCELADO')
    .sort((x, y) => dataDe(x).localeCompare(dataDe(y)));

  useEffect(() => {
    atualRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [atualId, itens.length]);

  return (
    <>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {itens.map((a) => {
          const atual = a.id === atualId;
          const passado = a.status === 'CONCLUIDO';
          const atrasada = !passado && diasAte(a.dataAgendada) < 0;
          const foto = a.fotos?.[0]?.caminhoArquivo;
          return (
            <div
              key={a.id}
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
                <span className="line-clamp-2">{a.atividade?.nome ?? 'Cuidado'}</span>
              </p>
              <p className={`mt-0.5 text-xs ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
                {passado ? dataCurta(dataDe(a)) : dataRelativa(a.dataAgendada)}
              </p>
              {passado && a.observacaoFutura && (
                <button
                  type="button"
                  onClick={() => setNota(a)}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-accent-light text-accent"
                  aria-label="Ver observação"
                >
                  <MessageSquareText size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!nota} onClose={() => setNota(null)} title={nota?.atividade?.nome ?? 'Observação'}>
        {nota && (
          <div className="space-y-4 pb-safe">
            <p className="text-sm text-muted">{dataCurta(dataDe(nota))}</p>
            <div>
              <span className="label">Obs.</span>
              <p className="whitespace-pre-line">{nota.observacaoFutura}</p>
            </div>
            {nota.detalhes && (
              <div>
                <span className="label">Descrição</span>
                <p className="whitespace-pre-line text-sm">{nota.detalhes}</p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
