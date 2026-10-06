import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarClock, Check, Repeat, Settings2, SkipForward, StickyNote, Trash2 } from 'lucide-react';
import { ConfirmSheet } from '@/components/Sheet';
import { RotinaSheet } from '@/components/care/RotinaSheet';
import { HistoricoPlanta } from '@/components/HistoricoPlanta';
import { Button, EmptyState, ErrorState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { textoIntervalo } from '@/lib/cuidados';
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
  const [salvando, setSalvando] = useState<'cancelar' | 'excluir' | 'pular' | null>(null);
  const [rotinaAberta, setRotinaAberta] = useState<string | null>(null);
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
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast(
        tipo === 'excluir' ? 'Tarefa excluída' : agenda.rotinaId ? 'Tarefa cancelada · rotina sem próxima' : 'Tarefa cancelada',
      );
      if (window.history.state?.idx > 0) navigate(-1);
      else navigate('/', { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(null);
    }
  }

  async function pular() {
    if (!agenda) return;
    setSalvando('pular');
    try {
      const { proxima } = await agendasApi.pular(agenda.id);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast(proxima ? 'Pulada · próxima agendada' : 'Pulada · a rotina não tem próxima');
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
        {agenda.rotina && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Repeat size={14} /> Rotina {textoIntervalo(agenda.rotina.intervaloDias)}
            {agenda.rotina.pausada && ' · pausada'}
          </p>
        )}
        {agenda.pulada && <p className="mt-1 text-sm text-muted">Pulada</p>}

        {pendente && agenda.detalhes && (
          <div className="mt-4 flex gap-2.5 rounded-2xl bg-primary-light p-3 text-sm text-primary-dark">
            <StickyNote size={18} className="mt-0.5 shrink-0" />
            <p className="whitespace-pre-line">{agenda.detalhes}</p>
          </div>
        )}

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
            {agenda.rotinaId && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={pular} loading={salvando === 'pular'}>
                  <SkipForward size={16} /> Pular esta vez
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setRotinaAberta(agenda.rotinaId!)}>
                  <Settings2 size={16} /> Editar rotina
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <RotinaSheet rotinaId={rotinaAberta} onClose={() => setRotinaAberta(null)} />
      <ConfirmSheet
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={() => acao('excluir')}
        loading={salvando === 'excluir'}
        title="Excluir tarefa?"
        text={
          'A tarefa some do histórico. Para manter o registro, use “Cancelar”.' +
          (agenda.rotinaId ? ' A rotina fica sem próxima tarefa — para só adiar, use “Pular esta vez”.' : '')
        }
      />
    </div>
  );
}
