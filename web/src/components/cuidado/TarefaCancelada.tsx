import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Repeat, Trash2 } from 'lucide-react';
import { ConfirmSheet } from '@/components/Sheet';
import { PageHeader } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { textoIntervalo } from '@/lib/cuidados';
import { agendasApi } from '@/lib/endpoints';
import { dataLonga, distanciaRelativa, plantaCodigoNome } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Agenda } from '@/types';

/** Tarefa cancelada (status antigo): só leitura + excluir. */
export function TarefaCancelada({ agenda }: { agenda: Agenda }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmar, setConfirmar] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    setExcluindo(true);
    try {
      await agendasApi.remove(agenda.id);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast('Tarefa excluída');
      navigate(`/plantas/${agenda.plantaId}`, { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setExcluindo(false);
    }
  }

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader
        title={plantaCodigoNome(agenda.planta)}
        titleTo={`/plantas/${agenda.plantaId}`}
        back
        right={
          <button
            onClick={() => setConfirmar(true)}
            className="flex size-10 items-center justify-center rounded-full text-danger hover:bg-danger/10"
            aria-label="Excluir tarefa"
          >
            <Trash2 size={20} />
          </button>
        }
      />
      <section className="mx-auto max-w-2xl px-4 pt-5">
        <h2 className="font-display text-2xl font-semibold">{agenda.atividade?.nome ?? 'Tarefa'}</h2>
        <p className="mt-1 text-sm text-muted">
          Cancelada · {distanciaRelativa(agenda.dataAgendada).toLowerCase()} ({dataLonga(agenda.dataAgendada)})
        </p>
        {agenda.rotina && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Repeat size={14} /> Rotina {textoIntervalo(agenda.rotina.intervaloDias)}
          </p>
        )}
        {agenda.pulada && <p className="mt-1 text-sm text-muted">Pulada</p>}
        {!!agenda.fotos?.length && (
          <div className="mt-5 grid grid-cols-3 gap-1.5">
            {agenda.fotos.map((f) => (
              <Link
                key={f.id}
                to={`/plantas/${agenda.plantaId}/galeria?foto=${f.id}`}
                className="aspect-square overflow-hidden rounded-xl bg-primary-light"
              >
                <img src={f.caminhoArquivo} alt="" loading="lazy" className="size-full object-cover" />
              </Link>
            ))}
          </div>
        )}
      </section>
      <ConfirmSheet
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={excluir}
        loading={excluindo}
        title="Excluir tarefa?"
        text="Ela some do histórico. As fotos continuam na galeria da planta."
      />
    </div>
  );
}
