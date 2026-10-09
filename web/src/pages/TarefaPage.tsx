import { Link, useNavigate, useParams } from 'react-router';
import { Repeat } from 'lucide-react';
import { CarrosselDoDia } from '@/components/CarrosselDoDia';
import { HistoricoPlanta } from '@/components/HistoricoPlanta';
import { PendentesDaPlanta } from '@/components/tarefa/PendentesDaPlanta';
import { EmptyState, ErrorState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { textoIntervalo } from '@/lib/cuidados';
import { dataLonga, dataRelativa, plantaNome, plantaRotulo } from '@/lib/format';
import { tarefasDoDia } from '@/lib/linhaDoTempo';
import { MANTER_ROLAGEM } from '@/lib/rolagem';
import { useAgendas } from '@/lib/queries';

/** Detalhe da tarefa. Pendente: a planta e suas pendentes (ações em lote). Concluída/cancelada: tarefas do dia + histórico. */
export function TarefaPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const agendas = useAgendas();

  const agenda = agendas.data?.find((a) => a.id === id);
  const daPlanta = agendas.data?.filter((a) => a.plantaId === agenda?.plantaId) ?? [];

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
  if (agenda.status === 'PENDENTE') return <PendentesDaPlanta agenda={agenda} agendas={agendas.data ?? []} />;

  const concluida = agenda.status === 'CONCLUIDO';
  const dataStatus = concluida ? (agenda.dataConcluida ?? agenda.dataAgendada) : agenda.dataAgendada;

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader title={agenda.atividade?.nome ?? 'Tarefa'} back />

      <div className="mx-auto max-w-2xl px-4">
        <Link to={`/plantas/${agenda.plantaId}`} className="relative mt-4 block overflow-hidden rounded-3xl">
          <PlantThumb url={agenda.planta?.fotoCapaUrl} className="aspect-[4/3] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
            <p className="text-3xl font-bold tracking-tight">{plantaRotulo(agenda.planta)}</p>
            {plantaNome(agenda.planta) && <p className="text-sm opacity-90">{plantaNome(agenda.planta)}</p>}
          </div>
        </Link>

        {concluida ? (
          <CarrosselDoDia
            tarefas={tarefasDoDia(daPlanta, agenda)}
            atualId={agenda.id}
            onTrocar={(outra) => navigate(`/tarefas/${outra}`, { replace: true, state: MANTER_ROLAGEM })}
          />
        ) : (
          <>
            <p className="mt-4 text-sm text-muted">
              Cancelada · {dataRelativa(dataStatus)} ({dataLonga(dataStatus)})
            </p>
            {agenda.rotina && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <Repeat size={14} /> Rotina {textoIntervalo(agenda.rotina.intervaloDias)}
                {agenda.rotina.pausada && ' · pausada'}
              </p>
            )}
            {agenda.pulada && <p className="mt-1 text-sm text-muted">Pulada</p>}

            {!!agenda.fotos?.length && (
              <>
                <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">
                  Fotos do cuidado · {agenda.fotos.length}
                </h2>
                <div className="grid grid-cols-3 gap-1.5">
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
              </>
            )}
          </>
        )}

        <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Histórico da planta</h2>
        <HistoricoPlanta agendas={daPlanta} atualId={agenda.id} />
      </div>
    </div>
  );
}
