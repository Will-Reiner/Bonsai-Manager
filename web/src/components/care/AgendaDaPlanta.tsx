import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Repeat } from 'lucide-react';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import { agendaDaPlanta, recortarAgenda, type ItemAgenda } from '@/lib/agendaDaPlanta';
import { dataCurta, fromDateInput, plantaTitulo } from '@/lib/format';
import { useAgendas, usePlantas } from '@/lib/queries';

interface Props {
  data: string;
  atividadeIds: string[];
  /** Nome da tarefa nova na linha do tempo (ex.: "Adubação", "Adubação + Poda"). */
  rotuloNova: string;
  /** Texto extra da nova (ex.: "primeira vez" numa rotina). */
  notaNova?: string;
}

const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? '' : 's'}`;

function textoDias(dias: number) {
  if (dias < 0) return `atrasada há ${plural(-dias, 'dia')}`;
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  return `em ${dias} dias`;
}

function textoDistancia(distancia: number) {
  if (distancia === 0) return 'no mesmo dia';
  return `${plural(Math.abs(distancia), 'dia')} ${distancia > 0 ? 'depois' : 'antes'}`;
}

/** Linhas da linha do tempo: existentes com prazo e distância até a nova; a nova em destaque. */
function Linhas({ itens, rotuloNova, notaNova, data }: { itens: ItemAgenda[]; data: string } & Pick<Props, 'rotuloNova' | 'notaNova'>) {
  return (
    <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-line">
      {itens.map((i) => {
        if (i.tipo === 'nova') {
          return (
            <li key="nova" className="relative flex items-center gap-3 rounded-xl bg-primary-light py-2 pl-1.5 pr-3">
              <span className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary ring-4 ring-primary-light" aria-hidden>
                <span className="size-2 rounded-full bg-white" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-primary-dark">
                  {rotuloNova} <span className="font-medium">({notaNova ?? 'nova'})</span>
                </span>
                <span className="block text-xs text-primary-dark/80">
                  {dataCurta(fromDateInput(data))} · {textoDias(i.dias)}
                </span>
              </span>
            </li>
          );
        }
        const { agenda, atrasada, aviso } = i;
        const nome = agenda.atividade?.nome ?? 'Cuidado';
        return (
          <li key={agenda.id} className="relative flex items-center gap-3 py-1.5 pr-3">
            <AtividadeIcone nome={nome} size={14} className={`relative z-10 size-8 ${atrasada ? 'bg-late-light! text-late!' : ''}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="truncate">{nome}</span>
                {agenda.rotinaId && <Repeat size={12} className="shrink-0 text-muted" aria-label="Rotina" />}
              </span>
              <span className={`block truncate text-xs ${atrasada ? 'font-bold text-late' : 'text-muted'}`}>
                {dataCurta(agenda.dataAgendada)} · {textoDias(i.dias)}
                {!aviso && data && <span className="font-normal text-muted"> · {textoDistancia(i.distancia)}</span>}
              </span>
              {aviso && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${aviso === 'duplicada' ? 'text-danger' : 'text-warning'}`}>
                  <AlertTriangle size={12} className="shrink-0" aria-hidden />
                  {aviso === 'duplicada' ? `Já marcado · ${textoDistancia(i.distancia)}` : textoDistancia(i.distancia)}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Linha do tempo de uma planta, recortada em `max` com "+N" que expande. */
function LinhaDoTempo({ itens, max, janela, ...props }: Props & { itens: ItemAgenda[]; max: number; janela?: number }) {
  const [tudo, setTudo] = useState(false);
  const r = recortarAgenda(itens, { max, janela });
  const escondidas = r.antes + r.depois;
  const botao = 'flex items-center gap-1 py-1 pl-11 text-xs font-semibold text-primary';
  if (tudo || (!escondidas && !janela)) {
    return (
      <>
        <Linhas itens={itens} {...props} />
        {tudo && (
          <button type="button" className={botao} onClick={() => setTudo(false)}>
            Mostrar menos
          </button>
        )}
      </>
    );
  }
  return (
    <>
      {r.antes > 0 && (
        <button type="button" className={botao} onClick={() => setTudo(true)}>
          <ChevronDown size={14} className="rotate-180" /> + {r.antes} antes
        </button>
      )}
      <Linhas itens={r.visiveis} {...props} />
      {r.depois > 0 && (
        <button type="button" className={botao} onClick={() => setTudo(true)}>
          <ChevronDown size={14} /> + {r.depois} mais adiante
        </button>
      )}
      {janela !== undefined && !escondidas && itens.length > r.visiveis.length && (
        <button type="button" className={botao} onClick={() => setTudo(true)}>
          Ver tudo desta planta
        </button>
      )}
    </>
  );
}

/** "Já marcado nesta planta": pendentes da planta com a tarefa nova encaixada na data escolhida. */
export function AgendaDaPlanta({ plantaId, ignorarId, ...props }: Props & { plantaId: string; ignorarId?: string }) {
  const agendas = useAgendas();
  const itens = useMemo(
    () => agendaDaPlanta(agendas.data ?? [], { plantaId, data: props.data, atividadeIds: props.atividadeIds, ignorarId }),
    [agendas.data, plantaId, props.data, props.atividadeIds, ignorarId],
  );
  if (!agendas.data) return null;
  const vazia = !itens.some((i) => i.tipo === 'existente');
  return (
    <section>
      <span className="label">Já marcado nesta planta</span>
      {vazia ? <p className="text-sm text-muted">Nada marcado nesta planta.</p> : <LinhaDoTempo itens={itens} max={5} {...props} />}
    </section>
  );
}

/** Janela (em dias) e máximo de tarefas por planta no resumo de várias plantas. */
const JANELA_PLANTAS = 90;
const MAX_POR_PLANTA = 3;

/** Várias plantas: por planta, só o que está a até 90 dias da data escolhida; plantas com aviso primeiro. */
export function AgendaDasPlantas({ plantaIds, ...props }: Props & { plantaIds: string[] }) {
  const agendas = useAgendas();
  const plantas = usePlantas();
  const porPlanta = useMemo(() => {
    const lista = plantaIds.map((plantaId, ordem) => {
      const itens = agendaDaPlanta(agendas.data ?? [], { plantaId, data: props.data, atividadeIds: props.atividadeIds });
      const perto = itens.filter((i) => i.tipo === 'existente' && Math.abs(i.distancia) <= JANELA_PLANTAS);
      return { plantaId, ordem, itens, perto: perto.length, aviso: perto.some((i) => i.tipo === 'existente' && i.aviso) };
    });
    return lista.sort((a, b) => Number(b.aviso) - Number(a.aviso) || a.ordem - b.ordem);
  }, [agendas.data, plantaIds, props.data, props.atividadeIds]);
  if (!agendas.data) return null;
  return (
    <section>
      <span className="label">Já marcado perto dessa data</span>
      <div className="space-y-2">
        {porPlanta.map((p) => (
          <div key={p.plantaId} className="card p-3">
            <p className="mb-1 flex items-center gap-1.5 truncate text-sm font-semibold">
              {p.aviso && <AlertTriangle size={14} className="shrink-0 text-warning" aria-label="Com aviso" />}
              {plantaTitulo(plantas.data?.find((x) => x.id === p.plantaId))}
            </p>
            {p.perto ? (
              <LinhaDoTempo itens={p.itens} max={MAX_POR_PLANTA} janela={JANELA_PLANTAS} {...props} />
            ) : (
              <p className="text-xs text-muted">Nada a até {JANELA_PLANTAS} dias dessa data.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
