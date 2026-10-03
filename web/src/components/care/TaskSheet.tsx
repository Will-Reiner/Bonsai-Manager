import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Ban, Trash2 } from 'lucide-react';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { PhotoInput } from '@/components/PhotoInput';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi, fotosApi } from '@/lib/endpoints';
import { dataLonga, dataRelativa } from '@/lib/format';
import { keys } from '@/lib/queries';
import { uploadImage } from '@/lib/upload';
import type { Agenda } from '@/types';

/** Detalhe de uma tarefa pendente: concluir com nota/foto, reagendar, cancelar ou excluir. */
export function TaskSheet({
  agenda,
  onClose,
  onReschedule,
}: {
  agenda: Agenda;
  onClose: () => void;
  onReschedule: (agenda: Agenda) => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [nota, setNota] = useState('');
  const [proxima, setProxima] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState<'concluir' | 'cancelar' | 'excluir' | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const done = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: keys.agendas });
    toast(msg);
    onClose();
  };

  async function concluir() {
    setSalvando('concluir');
    try {
      const agora = new Date().toISOString();
      await agendasApi.update(agenda.id, {
        status: 'CONCLUIDO',
        dataConcluida: agora,
        ...(nota.trim() ? { detalhes: nota.trim() } : {}),
        ...(proxima.trim() ? { observacaoFutura: proxima.trim() } : {}),
      });
      if (foto) {
        const url = await uploadImage(foto);
        await fotosApi.create({
          caminhoArquivo: url,
          plantaId: agenda.plantaId,
          titulo: agenda.atividade?.nome,
          dataCaptura: agora,
        });
        queryClient.invalidateQueries({ queryKey: keys.fotos(agenda.plantaId) });
      }
      done('Tarefa concluída 🌿');
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(null);
    }
  }

  async function cancelar() {
    setSalvando('cancelar');
    try {
      await agendasApi.update(agenda.id, { status: 'CANCELADO' });
      done('Tarefa cancelada');
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(null);
    }
  }

  async function excluir() {
    setSalvando('excluir');
    try {
      await agendasApi.remove(agenda.id);
      done('Tarefa excluída');
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(null);
    }
  }

  return (
    <>
      <Sheet open onClose={onClose} title={agenda.atividade?.nome ?? 'Tarefa'}>
        <p className="text-sm text-muted">
          {agenda.planta?.nome || 'Planta'} · {dataRelativa(agenda.dataAgendada)} ({dataLonga(agenda.dataAgendada)})
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Como foi? (opcional)">
            <textarea className="input min-h-20" value={nota} onChange={(e) => setNota(e.target.value)} />
          </Field>
          <Field label="Lembrete para a próxima vez (opcional)">
            <input
              className="input"
              value={proxima}
              onChange={(e) => setProxima(e.target.value)}
              placeholder="Ex.: usar menos adubo"
            />
          </Field>
          <PhotoInput file={foto} onChange={setFoto} label="Foto (opcional)" aspect="aspect-[16/9]" />
          <Button block onClick={concluir} loading={salvando === 'concluir'}>
            Concluir tarefa
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 pb-safe">
          <Button variant="secondary" size="sm" onClick={() => onReschedule(agenda)}>
            <CalendarClock size={16} /> Reagendar
          </Button>
          <Button variant="secondary" size="sm" onClick={cancelar} loading={salvando === 'cancelar'}>
            <Ban size={16} /> Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmarExclusao(true)}>
            <Trash2 size={16} /> Excluir
          </Button>
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={excluir}
        loading={salvando === 'excluir'}
        title="Excluir tarefa?"
        text="A tarefa some do histórico. Para manter o registro, use “Cancelar”."
      />
    </>
  );
}
