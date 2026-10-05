import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarClock, Check, Trash2 } from 'lucide-react';
import { ConfirmSheet } from '@/components/Sheet';
import { HistoricoPlanta } from '@/components/HistoricoPlanta';
import { Button, EmptyState, ErrorState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { dataLonga, dataRelativa, diasAte, plantaRotulo } from '@/lib/format';
import { keys, useAgendas } from '@/lib/queries';

/** Detalhe da tarefa: planta em destaque + histórico horizontal + ações. */
export function TarefaPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { reagendar } = useCare();
  const agendas = useAgendas();
  const [salvando, setSalvando] = useState<'cancelar' | 'excluir' | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const agenda = agendas.data?.find((a) => a.id === id);
  const daPlanta = agendas.data?.filter((a) => a.plantaId === agenda?.plantaId) ?? [];

  async function acao(tipo: 'cancelar' | 'excluir') {
    if (!agenda) return;
    setSalvando(tipo);
    try {
      if (tipo === 'cancelar') await agendasApi.update(agenda.id, { status: 'CANCELADO' });
      else await agendasApi.remove(agenda.id);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast(tipo === 'cancelar' ? 'Tarefa cancelada' : 'Tarefa excluída');
      if (window.history.state?.idx > 0) navigate(-1);
      else navigate('/', { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(null);
    }
  }

  if (agendas.isLoading) return <><PageHeader title="Tarefa" back /><Spinner /></>;
  if (agendas.isError) {
    return (
      <>
        <PageHeader title="Tarefa" back />
        <ErrorState text={errorMessage(agendas.error)} onRetry={() => agendas.refetch()} />
      </>
    );
  }
  if (!agenda) {
    return (
      <>
        <PageHeader title="Tarefa" back />
        <EmptyState title="Tarefa não encontrada" />
      </>
    );
  }

  const pendente = agenda.status === 'PENDENTE';
  const atrasada = pendente && diasAte(agenda.dataAgendada) < 0;
  const rotuloStatus = pendente ? 'Agendada' : agenda.status === 'CONCLUIDO' ? 'Concluída' : 'Cancelada';
  const dataStatus = agenda.status === 'CONCLUIDO' ? (agenda.dataConcluida ?? agenda.dataAgendada) : agenda.dataAgendada;

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader title={agenda.atividade?.nome ?? 'Tarefa'} back />

      <div className="mx-auto max-w-2xl px-4">
        <Link to={`/plantas/${agenda.plantaId}`} className="relative mt-4 block overflow-hidden rounded-3xl">
          <PlantThumb url={agenda.planta?.fotoCapaUrl} className="aspect-[4/3] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
            <p className="text-3xl font-bold tracking-tight">{plantaRotulo(agenda.planta)}</p>
            {agenda.planta?.identificador && agenda.planta?.nome && <p className="text-sm opacity-90">{agenda.planta.nome}</p>}
          </div>
        </Link>

        <p className={`mt-4 text-sm ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
          {rotuloStatus} · {dataRelativa(dataStatus)} ({dataLonga(dataStatus)})
        </p>

        <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Histórico da planta</h2>
        <HistoricoPlanta agendas={daPlanta} atualId={agenda.id} />

        {pendente && (
          <div className="mt-6 space-y-3">
            <Button block onClick={() => navigate(`/concluir?ids=${agenda.id}`)}>
              <Check size={18} /> Concluir
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" onClick={() => reagendar(agenda)}>
                <CalendarClock size={16} /> Reagendar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => acao('cancelar')} loading={salvando === 'cancelar'}>
                <Ban size={16} /> Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmarExclusao(true)}>
                <Trash2 size={16} /> Excluir
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmSheet
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={() => acao('excluir')}
        loading={salvando === 'excluir'}
        title="Excluir tarefa?"
        text="A tarefa some do histórico. Para manter o registro, use “Cancelar”."
      />
    </div>
  );
}
