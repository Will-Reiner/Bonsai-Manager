import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarClock, Check, MoreHorizontal, Repeat, Settings2, SkipForward, Trash2 } from 'lucide-react';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { RotinaSheet } from '@/components/care/RotinaSheet';
import { Button, PageHeader, PlantThumb } from '@/components/ui';
import { useCare } from '@/context/CareContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { rotuloUltima, textoIntervalo, textoPrazo } from '@/lib/cuidados';
import { agendasApi } from '@/lib/endpoints';
import { diasAte, plantaCodigoNome, plantaNome, plantaRotulo } from '@/lib/format';
import { tarefasDoDia } from '@/lib/linhaDoTempo';
import { keys } from '@/lib/queries';
import { emLote, pendentesDaPlanta, ultimoCuidado } from '@/lib/tarefasDaPlanta';
import type { Agenda } from '@/types';
import { avisarLote } from './avisarLote';

/** Tarefa pendente: a planta, o último cuidado e todas as pendentes, com ações em lote. */
export function PendentesDaPlanta({ agenda, agendas }: { agenda: Agenda; agendas: Agenda[] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { reagendar } = useCare();
  const [marcadas, setMarcadas] = useState(() => new Set([agenda.id]));
  const [salvando, setSalvando] = useState<'excluir' | 'cancelar' | 'pular' | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const [rotinaAberta, setRotinaAberta] = useState<string | null>(null);

  const pendentes = useMemo(() => pendentesDaPlanta(agendas, agenda.plantaId), [agendas, agenda.plantaId]);
  const ultimo = useMemo(() => ultimoCuidado(agendas, agenda.plantaId), [agendas, agenda.plantaId]);
  const doUltimo = ultimo ? tarefasDoDia(agendas, ultimo) : [];
  const notaUltima = doUltimo.map((a) => (a.detalhes ?? a.observacaoFutura)?.trim()).find(Boolean);

  // Só as que ainda estão pendentes contam (uma marcada pode ter sido concluída noutro lugar)
  const selecionadas = pendentes.filter((a) => marcadas.has(a.id));
  const unica = selecionadas.length === 1 ? selecionadas[0] : null;

  const alternar = (id: string) =>
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: keys.agendas });
    queryClient.invalidateQueries({ queryKey: keys.rotinas });
  }

  /** A tarefa da página saiu das pendentes → volta; senão fica e limpa a seleção. */
  function depois(afetadas: Agenda[]) {
    if (afetadas.some((a) => a.id === agenda.id)) {
      if (window.history.state?.idx > 0) navigate(-1);
      else navigate('/', { replace: true });
    } else setMarcadas(new Set());
  }

  async function excluir() {
    setSalvando('excluir');
    const r = await emLote(selecionadas, (a) => agendasApi.remove(a.id));
    invalidar();
    avisarLote(toast, r, 'excluída');
    setSalvando(null);
    setConfirmarExclusao(false);
    if (r.feitos.length) depois(r.feitos);
  }

  async function cancelar() {
    if (!unica) return;
    setSalvando('cancelar');
    try {
      await agendasApi.update(unica.id, { status: 'CANCELADO' });
      invalidar();
      toast(unica.rotinaId ? 'Tarefa cancelada · rotina sem próxima' : 'Tarefa cancelada');
      setMaisAberto(false);
      depois([unica]);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(null);
    }
  }

  async function pular() {
    if (!unica) return;
    setSalvando('pular');
    try {
      const { proxima } = await agendasApi.pular(unica.id);
      invalidar();
      toast(proxima ? 'Pulada · próxima agendada' : 'Pulada · a rotina não tem próxima');
      setMaisAberto(false);
      depois([unica]);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(null);
    }
  }

  const n = selecionadas.length;
  const algumaDeRotina = selecionadas.some((a) => a.rotinaId);

  return (
    <div className="min-h-dvh pb-40">
      <PageHeader title={plantaCodigoNome(agenda.planta)} back />

      <div className="mx-auto max-w-2xl px-4">
        <Link to={`/plantas/${agenda.plantaId}`} className="relative mt-4 block overflow-hidden rounded-3xl">
          <PlantThumb url={agenda.planta?.fotoCapaUrl} className="aspect-[4/3] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
            <p className="text-3xl font-bold tracking-tight">{plantaRotulo(agenda.planta)}</p>
            {plantaNome(agenda.planta) && <p className="text-sm opacity-90">{plantaNome(agenda.planta)}</p>}
          </div>
        </Link>

        <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Último cuidado</h2>
        {ultimo ? (
          <Link to={`/tarefas/${ultimo.id}`} className="card flex items-start gap-3 p-3">
            <AtividadeIcone nome={ultimo.atividade?.nome ?? ''} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {doUltimo.map((a) => a.atividade?.nome ?? 'Cuidado').join(' + ')}
                <span className="font-normal text-muted"> · {rotuloUltima([ultimo.dataConcluida ?? ultimo.dataAgendada])}</span>
              </p>
              {notaUltima && <p className="line-clamp-2 text-sm text-muted">{notaUltima}</p>}
            </div>
          </Link>
        ) : (
          <p className="text-sm text-muted">Nenhum cuidado registrado ainda</p>
        )}

        <h2 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Pendentes · {pendentes.length}</h2>
        <ul className="space-y-2">
          {pendentes.map((a) => {
            const marcada = marcadas.has(a.id);
            const atrasada = diasAte(a.dataAgendada) < 0;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={marcada}
                  onClick={() => alternar(a.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99] ${
                    a.id === agenda.id ? 'bg-primary-light' : 'bg-card'
                  }`}
                >
                  <span
                    className={`mt-2 flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      marcada ? 'border-primary bg-primary text-white' : 'border-line bg-white'
                    }`}
                    aria-hidden
                  >
                    {marcada && <Check size={14} strokeWidth={3} />}
                  </span>
                  <AtividadeIcone nome={a.atividade?.nome ?? ''} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.atividade?.nome ?? 'Tarefa'}</p>
                    <p className={`text-sm ${atrasada ? 'font-medium text-danger' : 'text-muted'}`}>
                      {textoPrazo(a.dataAgendada)}
                      {a.rotina && (
                        <span className="text-muted">
                          {' · '}
                          <Repeat size={12} className="inline align-[-1px]" /> {textoIntervalo(a.rotina.intervaloDias)}
                          {a.rotina.pausada && ' (pausada)'}
                        </span>
                      )}
                    </p>
                    {a.detalhes?.trim() && <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm">{a.detalhes}</p>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto max-w-2xl space-y-2 pb-3">
          <Button block disabled={!n} onClick={() => navigate(`/concluir?ids=${selecionadas.map((a) => a.id).join(',')}`)}>
            <Check size={18} /> Concluir{n > 1 ? ` ${n} tarefas` : ''}
          </Button>
          <div className="grid grid-cols-3 gap-2 [&>button:disabled]:opacity-50">
            <Button variant="secondary" size="sm" disabled={!n} onClick={() => reagendar(selecionadas)}>
              <CalendarClock size={16} /> Reagendar
            </Button>
            <Button variant="danger" size="sm" disabled={!n} onClick={() => setConfirmarExclusao(true)}>
              <Trash2 size={16} /> Excluir
            </Button>
            <Button variant="secondary" size="sm" disabled={!unica} onClick={() => setMaisAberto(true)} aria-label="Mais opções">
              <MoreHorizontal size={16} /> Mais
            </Button>
          </div>
        </div>
      </div>

      <ConfirmSheet
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={excluir}
        loading={salvando === 'excluir'}
        title={n > 1 ? `Excluir ${n} tarefas?` : 'Excluir tarefa?'}
        text={
          'Some do histórico. Para manter o registro, use “Cancelar” em Mais.' +
          (algumaDeRotina ? ' A rotina fica sem próxima tarefa — para só adiar, use “Pular esta vez”.' : '')
        }
      />

      <Sheet open={maisAberto && !!unica} onClose={() => setMaisAberto(false)} title={unica?.atividade?.nome ?? 'Tarefa'}>
        <div className="space-y-2 pb-safe">
          <Button block variant="secondary" onClick={cancelar} loading={salvando === 'cancelar'}>
            <Ban size={18} /> Cancelar tarefa
          </Button>
          {unica?.rotinaId && (
            <>
              <Button block variant="secondary" onClick={pular} loading={salvando === 'pular'}>
                <SkipForward size={18} /> Pular esta vez
              </Button>
              <Button
                block
                variant="secondary"
                onClick={() => {
                  setMaisAberto(false);
                  setRotinaAberta(unica.rotinaId!);
                }}
              >
                <Settings2 size={18} /> Editar rotina
              </Button>
            </>
          )}
        </div>
      </Sheet>

      <RotinaSheet rotinaId={rotinaAberta} onClose={() => setRotinaAberta(null)} />
    </div>
  );
}
