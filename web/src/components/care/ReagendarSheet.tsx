import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui';
import { DataFuturaCampo } from './DataFuturaCampo';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fromDateInput, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda } from '@/types';

/** Reagendar uma tarefa existente: só a nova data. */
export function ReagendarSheet({ agenda, onClose }: { agenda: Agenda; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [data, setData] = useState(() => toDateInput(agenda.dataAgendada));
  const [salvando, setSalvando] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await agendasApi.update(agenda.id, { dataAgendada: fromDateInput(data) });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast('Tarefa reagendada');
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title="Reagendar tarefa">
      <form onSubmit={submit} className="space-y-5 pb-2">
        <p className="text-sm text-muted">
          {agenda.atividade?.nome} · {agenda.planta?.nome || 'planta'}
        </p>
        <DataFuturaCampo value={data} onChange={setData} livre />
        <Button type="submit" block loading={salvando}>
          Salvar nova data
        </Button>
      </form>
    </Sheet>
  );
}
