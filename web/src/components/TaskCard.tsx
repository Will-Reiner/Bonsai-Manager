import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { PlantThumb } from './ui';
import { useCare } from '@/context/CareContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { dataRelativa, diasAte } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda } from '@/types';

/** Card de tarefa: toque no card abre detalhes; o botão ✓ conclui em um toque. */
export function TaskCard({ agenda, showPlanta = true }: { agenda: Agenda; showPlanta?: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { abrirTarefa } = useCare();
  const atrasada = diasAte(agenda.dataAgendada) < 0;

  const concluir = useMutation({
    mutationFn: () =>
      agendasApi.update(agenda.id, { status: 'CONCLUIDO', dataConcluida: new Date().toISOString() }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: keys.agendas });
      const anterior = queryClient.getQueryData<Agenda[]>(keys.agendas);
      queryClient.setQueryData<Agenda[]>(keys.agendas, (lista) =>
        lista?.map((a) => (a.id === agenda.id ? { ...a, status: 'CONCLUIDO', dataConcluida: new Date().toISOString() } : a)),
      );
      return { anterior };
    },
    onError: (error, _v, ctx) => {
      if (ctx?.anterior) queryClient.setQueryData(keys.agendas, ctx.anterior);
      toast(errorMessage(error), 'error');
    },
    onSuccess: () => toast(`${agenda.atividade?.nome ?? 'Tarefa'} concluída 🌿`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.agendas }),
  });

  return (
    <div className="card flex items-center gap-3 p-2.5 pr-3">
      <button onClick={() => abrirTarefa(agenda)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {showPlanta && <PlantThumb url={agenda.planta?.fotoCapaUrl} className="size-12 shrink-0 rounded-xl" />}
        <div className="min-w-0">
          <p className="truncate font-semibold">{agenda.atividade?.nome ?? 'Cuidado'}</p>
          <p className="truncate text-sm text-muted">
            {showPlanta && <>{agenda.planta?.nome || agenda.planta?.especie?.nomeComum || 'Planta'} · </>}
            <span className={atrasada ? 'font-medium text-danger' : ''}>{dataRelativa(agenda.dataAgendada)}</span>
          </p>
        </div>
      </button>
      <button
        onClick={() => concluir.mutate()}
        disabled={concluir.isPending}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-primary transition hover:bg-primary hover:text-white active:scale-90"
        aria-label={`Marcar ${agenda.atividade?.nome ?? 'tarefa'} como feita`}
      >
        <Check size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
