import { useParams } from 'react-router';
import { CuidadoFeito } from '@/components/cuidado/CuidadoFeito';
import { TarefaCancelada } from '@/components/cuidado/TarefaCancelada';
import { PendentesDaPlanta } from '@/components/tarefa/PendentesDaPlanta';
import { EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useAgendas } from '@/lib/queries';

/** Detalhe da tarefa. Pendente: a planta e suas pendentes. Concluída: o cuidado do dia, deslizando entre os da planta. Cancelada: leitura + excluir. */
export function TarefaPage() {
  const { id = '' } = useParams();
  const agendas = useAgendas();

  const agenda = agendas.data?.find((a) => a.id === id);

  if (agendas.isLoading) return <><PageHeader title="Tarefa" back /><Spinner /></>;
  if (agendas.isError) {
    return (
      <>
        <PageHeader title="Tarefa" back />
        <ErrorState text={errorMessage(agendas.error)} erro={agendas.error} onRetry={() => agendas.refetch()} />
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
  if (agenda.status === 'PENDENTE') return <PendentesDaPlanta key={agenda.id} agenda={agenda} agendas={agendas.data ?? []} />;
  if (agenda.status === 'CANCELADO') return <TarefaCancelada agenda={agenda} />;
  return <CuidadoFeito agenda={agenda} agendas={agendas.data ?? []} />;
}
