import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { PlantaAtividadeFields } from './PlantaAtividadeFields';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fromDateInput, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda } from '@/types';

const daquiA = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString();

const ATALHOS = [
  { label: 'Amanhã', dias: 1 },
  { label: 'Em 3 dias', dias: 3 },
  { label: 'Em 1 semana', dias: 7 },
  { label: 'Em 1 mês', dias: 30 },
];

/** Agendar um cuidado futuro — ou reagendar uma tarefa existente (quando `agenda` vem preenchida). */
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
  const [plantaId, setPlantaId] = useState(agenda?.plantaId ?? plantaInicial ?? '');
  const [atividadeId, setAtividadeId] = useState(agenda?.atividadeId ?? '');
  const [data, setData] = useState(() => toDateInput(agenda?.dataAgendada ?? daquiA(1)));
  const [salvando, setSalvando] = useState(false);

  const atalho = (dias: number) => setData(toDateInput(daquiA(dias)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!plantaId || !atividadeId) return toast('Escolha a planta e o tipo de cuidado.', 'error');
    setSalvando(true);
    try {
      if (agenda) {
        await agendasApi.update(agenda.id, { dataAgendada: fromDateInput(data) });
      } else {
        await agendasApi.create({ plantaId, atividadeId, dataAgendada: fromDateInput(data) });
      }
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast(agenda ? 'Tarefa reagendada' : 'Cuidado agendado');
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
          <PlantaAtividadeFields
            plantaId={plantaId}
            onPlanta={setPlantaId}
            atividadeId={atividadeId}
            onAtividade={setAtividadeId}
            lockPlanta={!!plantaInicial}
          />
        )}
        <div>
          <Field label="Data">
            <input type="date" className="input" value={data} onChange={(e) => setData(e.target.value)} required />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            {ATALHOS.map((a) => (
              <button type="button" key={a.dias} className="chip py-1.5 text-xs" onClick={() => atalho(a.dias)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" block loading={salvando}>
          {agenda ? 'Salvar nova data' : 'Agendar'}
        </Button>
      </form>
    </Sheet>
  );
}
