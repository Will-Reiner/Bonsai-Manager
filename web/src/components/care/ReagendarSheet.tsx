import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { avisarLote } from '@/components/tarefa/avisarLote';
import { AgendaDaPlanta } from './AgendaDaPlanta';
import { DataFuturaCampo } from './DataFuturaCampo';
import { useToast } from '@/context/ToastContext';
import { agendasApi } from '@/lib/endpoints';
import { dataNumerica, fromDateInput, plantaCodigoNome, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import { adiarData, diasDeAdiamento, emLote } from '@/lib/tarefasDaPlanta';
import type { Agenda } from '@/types';

const ATALHOS_ADIAR = [1, 3, 7, 14, 30];
const diaMes = (iso: string) => dataNumerica(iso).slice(0, 5);

/** Reagendar uma ou várias tarefas: todas numa nova data, ou cada uma adiada N dias. */
export function ReagendarSheet({ agendas, onClose }: { agendas: Agenda[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modo, setModo] = useState<'data' | 'adiar'>('data');
  const [data, setData] = useState(() => toDateInput(agendas[0].dataAgendada));
  const [diasTexto, setDiasTexto] = useState('7');
  const [salvando, setSalvando] = useState(false);

  const unica = agendas.length === 1 ? agendas[0] : null;
  const dias = diasDeAdiamento(diasTexto);
  const novaData = (a: Agenda) => (modo === 'data' ? fromDateInput(data) : dias ? adiarData(a.dataAgendada, dias) : null);
  const invalido = modo === 'adiar' ? dias == null : !data;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (invalido) return;
    setSalvando(true);
    const r = await emLote(agendas, (a) => agendasApi.update(a.id, { dataAgendada: novaData(a)! }));
    queryClient.invalidateQueries({ queryKey: keys.agendas });
    queryClient.invalidateQueries({ queryKey: keys.rotinas });
    avisarLote(toast, r, 'reagendada');
    setSalvando(false);
    if (r.feitos.length) onClose();
  }

  return (
    <Sheet open onClose={onClose} title={unica ? 'Reagendar tarefa' : `Reagendar ${agendas.length} tarefas`}>
      <form onSubmit={submit} className="space-y-5 pb-2">
        <p className="text-sm text-muted">
          {unica ? `${unica.atividade?.nome ?? 'Tarefa'} · ` : ''}
          {plantaCodigoNome(agendas[0].planta)}
        </p>

        <div className="grid grid-cols-2 gap-2" role="tablist">
          {(
            [
              ['data', 'Nova data'],
              ['adiar', 'Adiar'],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={modo === valor}
              className={`chip justify-center ${modo === valor ? 'chip-active' : ''}`}
              onClick={() => setModo(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {modo === 'data' ? (
          <DataFuturaCampo value={data} onChange={setData} livre />
        ) : (
          <div>
            <Field label="Adiar quantos dias">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={3650}
                className="input w-28"
                value={diasTexto}
                onChange={(e) => setDiasTexto(e.target.value)}
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              {ATALHOS_ADIAR.map((d) => (
                <button
                  type="button"
                  key={d}
                  className={`chip py-1.5 text-xs ${dias === d ? 'chip-active' : ''}`}
                  onClick={() => setDiasTexto(String(d))}
                >
                  +{d} {d === 1 ? 'dia' : 'dias'}
                </button>
              ))}
            </div>
          </div>
        )}

        {unica && modo === 'data' ? (
          <AgendaDaPlanta
            plantaId={unica.plantaId}
            ignorarId={unica.id}
            data={data}
            atividadeIds={[unica.atividadeId]}
            rotuloNova={unica.atividade?.nome ?? 'Tarefa'}
            notaNova="nova data"
          />
        ) : (
          <ul className="space-y-1 rounded-2xl bg-card p-3 text-sm">
            {agendas.map((a) => {
              const nova = novaData(a);
              return (
                <li key={a.id} className="flex justify-between gap-3">
                  <span className="truncate">{a.atividade?.nome ?? 'Tarefa'}</span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {diaMes(a.dataAgendada)} → <span className="font-semibold text-ink">{nova ? diaMes(nova) : '—'}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <Button type="submit" block loading={salvando} disabled={invalido}>
          {unica ? 'Salvar nova data' : `Reagendar ${agendas.length} tarefas`}
        </Button>
      </form>
    </Sheet>
  );
}
