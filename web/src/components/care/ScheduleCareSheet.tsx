import { useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { AtividadeChips } from './AtividadeChips';
import { PlantasCampo } from './PlantasPicker';
import { RepetirCampo, repetirParaApi, repetirValido, type RepetirValor } from './RepetirCampo';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi, rotinasApi } from '@/lib/endpoints';
import { atalhosDeData } from '@/lib/estacoes';
import { daquiADias, dataNumerica, fromDateInput, toDateInput } from '@/lib/format';
import { keys, useAgendas, useRotinas } from '@/lib/queries';
import { medianaIntervaloDias, rotuloUltima, textoIntervalo, ultimasPorPlanta } from '@/lib/cuidados';
import type { Agenda } from '@/types';

/** Agendar cuidados para uma ou várias plantas — ou reagendar uma tarefa existente (quando `agenda` vem preenchida). */
export function ScheduleCareSheet({
  open,
  onClose,
  plantaId: plantaInicial,
  agenda,
}: {
  open: boolean;
  onClose: () => void;
  plantaId?: string;
  agenda?: Agenda;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [plantaIds, setPlantaIds] = useState<string[]>(plantaInicial ? [plantaInicial] : []);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [detalhes, setDetalhes] = useState('');
  const [data, setData] = useState(() => toDateInput(agenda?.dataAgendada ?? daquiADias(1)));
  const [salvando, setSalvando] = useState(false);
  const atalhos = useMemo(() => atalhosDeData(), []);
  const agendas = useAgendas();
  const ultimas = useMemo(() => ultimasPorPlanta(agendas.data ?? []), [agendas.data]);
  const dica = agendas.data && plantaIds.length
    ? (atividadeId: string) => rotuloUltima(plantaIds.map((p) => ultimas.get(p)?.get(atividadeId)))
    : undefined;
  const rotinas = useRotinas();
  const [repetir, setRepetir] = useState<RepetirValor | null>(null);
  const sugestao =
    plantaIds.length === 1 && atividadeIds.length === 1
      ? medianaIntervaloDias(agendas.data ?? [], plantaIds[0], atividadeIds[0])
      : null;
  const jaTem = (rotinas.data ?? []).filter((r) => plantaIds.includes(r.plantaId) && atividadeIds.includes(r.atividadeId));

  const total = plantaIds.length * atividadeIds.length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!agenda && (!plantaIds.length || !atividadeIds.length)) return toast('Escolha as plantas e o tipo de cuidado.', 'error');
    setSalvando(true);
    try {
      let mensagem: string;
      if (agenda) {
        await agendasApi.update(agenda.id, { dataAgendada: fromDateInput(data) });
        mensagem = 'Tarefa reagendada';
      } else if (repetir) {
        if (!repetirValido(repetir)) {
          setSalvando(false);
          return toast('Informe o intervalo em dias (1 a 3650).', 'error');
        }
        const r = await rotinasApi.create({
          plantaIds,
          atividadeIds,
          ...repetirParaApi(repetir),
          primeiraData: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        const n = r.criadas.length;
        const k = r.conflitos.length;
        mensagem = [
          n ? (n === 1 ? 'Rotina criada' : `${n} rotinas criadas`) : '',
          k ? (k === 1 ? '1 rotina já existia e foi mantida' : `${k} rotinas já existiam e foram mantidas`) : '',
        ]
          .filter(Boolean)
          .join(' · ');
      } else {
        await agendasApi.createLote({
          plantaIds,
          atividadeIds,
          dataAgendada: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        mensagem = total > 1 ? `${total} cuidados agendados` : 'Cuidado agendado';
      }
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast(mensagem);
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={agenda ? 'Reagendar tarefa' : 'Agendar cuidado'}>
      <form onSubmit={submit} className="space-y-5 pb-2">
        {agenda ? (
          <p className="text-sm text-muted">
            {agenda.atividade?.nome} · {agenda.planta?.nome || 'planta'}
          </p>
        ) : (
          <>
            <PlantasCampo ids={plantaIds} onChange={setPlantaIds} />
            <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} dica={dica} />
            <RepetirCampo value={repetir} onChange={setRepetir} sugestao={sugestao} />
            {repetir && jaTem.length > 0 && (
              <p className="text-xs text-danger">
                {jaTem.length === 1
                  ? `Já existe rotina de ${jaTem[0].atividade?.nome ?? 'cuidado'} (${textoIntervalo(jaTem[0].intervaloDias)}) — ela será mantida.`
                  : `${jaTem.length} rotinas já existem e serão mantidas.`}
              </p>
            )}
            <Field label="Observação (opcional)">
              <textarea
                className="input min-h-16"
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                placeholder="Ex.: usar adubo Bioplant"
              />
            </Field>
          </>
        )}
        <div>
          <Field label={repetir && !agenda ? 'Primeira vez' : 'Data'}>
            <input type="date" className="input" value={data} min={agenda ? undefined : toDateInput()} onChange={(e) => setData(e.target.value)} required />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            {atalhos.map((a) => (
              <button
                type="button"
                key={a.label}
                className={`chip py-1.5 text-xs ${data === a.data ? 'chip-active' : ''}`}
                onClick={() => setData(a.data)}
              >
                {a.label} <span className="opacity-60">· {dataNumerica(fromDateInput(a.data)).slice(0, 5)}</span>
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" block loading={salvando}>
          {agenda ? 'Salvar nova data' : repetir ? (total > 1 ? `Criar ${total} rotinas` : 'Criar rotina') : total > 1 ? `Agendar ${total} cuidados` : 'Agendar'}
        </Button>
      </form>
    </Sheet>
  );
}
