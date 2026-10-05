import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CalendarPlus } from 'lucide-react';
import { Button, EmptyState, PageHeader, SectionTitle, Spinner } from '@/components/ui';
import { TaskCard } from '@/components/TaskCard';
import { useCare } from '@/context/CareContext';
import { dataLonga, plantaTitulo } from '@/lib/format';
import { chaveItem, linhaDoTempo } from '@/lib/linhaDoTempo';
import { useAgendas, useFotos, usePlanta } from '@/lib/queries';

/** Histórico completo da planta: primeiro o que precisa ser feito (atrasadas, próximas), depois o passado. */
export function PlantHistoryPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const planta = usePlanta(id);
  const agendas = useAgendas();
  const fotos = useFotos(id);
  const { agendarCuidado, abrirTarefa } = useCare();

  const daPlanta = useMemo(() => (agendas.data ?? []).filter((a) => a.plantaId === id), [agendas.data, id]);
  const { pendentes, passado } = useMemo(() => linhaDoTempo(daPlanta, fotos.data), [daPlanta, fotos.data]);
  const recentesPrimeiro = useMemo(() => [...passado].reverse(), [passado]);
  const abrirFoto = (fotoId: string) => navigate(`/plantas/${id}/galeria?foto=${fotoId}`);
  // Para fazer: a mais urgente primeiro (pendentes já vêm em ordem de data)
  const atrasadas = pendentes.filter((i) => i.tipo === 'tarefa' && i.estado === 'atrasada');
  const proximas = pendentes.filter((i) => i.tipo === 'tarefa' && i.estado === 'futura');

  return (
    <div className="pb-8">
      <PageHeader title={planta.data ? `Histórico · ${plantaTitulo(planta.data)}` : 'Histórico'} back />
      <div className="mx-auto max-w-2xl px-4">
        {agendas.isLoading || fotos.isLoading ? (
          <Spinner />
        ) : (
          <>
            {atrasadas.length > 0 && (
              <>
                <SectionTitle tone="danger">Atrasadas</SectionTitle>
                <div className="space-y-2">
                  {atrasadas.map((i) => i.tipo === 'tarefa' && <TaskCard key={i.agenda.id} agenda={i.agenda} showPlanta={false} />)}
                </div>
              </>
            )}

            <SectionTitle>Próximas</SectionTitle>
            {proximas.length === 0 ? (
              <p className="text-sm text-muted">Nada agendado.</p>
            ) : (
              <div className="space-y-2">
                {proximas.map((i) => i.tipo === 'tarefa' && <TaskCard key={i.agenda.id} agenda={i.agenda} showPlanta={false} />)}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => agendarCuidado(id)}>
              <CalendarPlus size={16} /> Agendar cuidado
            </Button>

            <SectionTitle>Já feito</SectionTitle>
            {passado.length === 0 ? (
              <EmptyState title="Sem histórico ainda" text="Cuidados concluídos e fotos aparecem aqui, do mais recente ao mais antigo." />
            ) : (
              <ol className="relative ml-1.5 space-y-5 border-l-2 border-line pl-5">
                {recentesPrimeiro.map((item) => (
                  <li key={chaveItem(item)} className="relative">
                    <span className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-bg bg-primary" />
                    <p className="text-xs text-muted">{dataLonga(item.data)}</p>
                    {item.tipo === 'tarefa' ? (
                      <>
                        <button onClick={() => abrirTarefa(item.agenda)} className="mt-1 block text-left">
                          <p className="font-semibold">{item.agenda.atividade?.nome ?? 'Cuidado'}</p>
                          {item.agenda.detalhes && <p className="mt-0.5 text-sm">{item.agenda.detalhes}</p>}
                          {item.agenda.observacaoFutura && (
                            <p className="mt-1 text-sm text-accent">Próxima vez: {item.agenda.observacaoFutura}</p>
                          )}
                        </button>
                        <Miniaturas fotos={item.agenda.fotos ?? []} abrir={abrirFoto} />
                      </>
                    ) : (
                      <Miniaturas fotos={item.fotos} abrir={abrirFoto} />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Miniaturas({ fotos, abrir }: { fotos: { id: string; caminhoArquivo: string }[]; abrir: (fotoId: string) => void }) {
  if (fotos.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {fotos.map((f) => (
        <button key={f.id} onClick={() => abrir(f.id)} className="size-20 overflow-hidden rounded-xl bg-primary-light">
          <img src={f.caminhoArquivo} alt="" loading="lazy" className="size-full object-cover" />
        </button>
      ))}
    </div>
  );
}
