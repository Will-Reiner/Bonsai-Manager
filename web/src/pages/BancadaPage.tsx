import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PartyPopper } from 'lucide-react';
import { Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { AcessoRapido } from '@/components/bancada/AcessoRapido';
import { CabecalhoTarefa } from '@/components/bancada/CabecalhoTarefa';
import { FaixaGrupo } from '@/components/bancada/FaixaGrupo';
import { FotoTarefa } from '@/components/bancada/FotoTarefa';
import { LinhaTarefa } from '@/components/bancada/LinhaTarefa';
import { BotaoPreferencias, OpcoesChips } from '@/components/Preferencias';
import { Sheet } from '@/components/Sheet';
import { useAuth } from '@/context/AuthContext';
import {
  AGRUPAMENTOS,
  PERIODOS,
  VIEWS_BANCADA,
  ehAtrasada,
  montarBancada,
  pendentesDaBancada,
  type Agrupar,
  type Periodo,
  type View,
} from '@/lib/bancada';
import { useEscolha } from '@/lib/escolhas';
import type { GrupoAtividade } from '@/lib/format';
import { useAgendas, usePlantas } from '@/lib/queries';
import { errorMessage } from '@/lib/api';
import type { Planta } from '@/types';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Bancada de trabalho: pendentes do período (atrasadas sempre) em faixas por grupo, tarefa ou espécie. */
export function BancadaPage() {
  const { user } = useAuth();
  const agendas = useAgendas();
  const plantas = usePlantas();
  const [prefs, setPrefs] = useState(false);
  const [periodo, setPeriodo] = useEscolha<Periodo>('bonsai_bancada_periodo', 'semana', PERIODOS);
  const [agrupar, setAgrupar] = useEscolha<Agrupar>('bonsai_bancada_agrupar', 'grupos', AGRUPAMENTOS);
  const [view, setView] = useEscolha<View>('bonsai_bancada_view', 'fotos', VIEWS_BANCADA);

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const semPlantas = plantas.data?.length === 0;
  const plantasPorId = useMemo(() => new Map<string, Planta>((plantas.data ?? []).map((p) => [p.id, p])), [plantas.data]);
  const pendentes = pendentesDaBancada(agendas.data ?? [], periodo);
  const atrasadas = pendentes.filter(ehAtrasada).length;
  const blocos = montarBancada(pendentes, agrupar, plantasPorId);
  const periodoAtual = PERIODOS.find((p) => p.value === periodo)!;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="flex items-end justify-between gap-3 pb-3 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {saudacao()}
            {nome && `, ${nome}`}
          </p>
          <h1 className="text-3xl font-semibold">Bancada</h1>
          {!semPlantas && agendas.data && (
            <p className="text-sm text-muted">
              {periodoAtual.label} · {pendentes.length} tarefa{pendentes.length === 1 ? '' : 's'}
              {atrasadas > 0 && (
                <span className="font-semibold text-late">
                  {' · '}
                  {atrasadas} atrasada{atrasadas > 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>
        {!semPlantas && <BotaoPreferencias ativos={0} onClick={() => setPrefs(true)} />}
      </header>

      {!semPlantas && plantas.data && agendas.data && <AcessoRapido />}

      {agendas.isLoading || plantas.isLoading ? (
        <Spinner />
      ) : agendas.isError || plantas.isError ? (
        <ErrorState text={errorMessage(agendas.error ?? plantas.error)} onRetry={() => { if (agendas.isError) agendas.refetch(); if (plantas.isError) plantas.refetch(); }} />
      ) : semPlantas ? (
        <EmptyState
          title="Adicione sua primeira planta"
          text="Cadastre seus bonsais para acompanhar tarefas, cuidados e fotos."
          action={
            <Link to="/plantas/nova">
              <Button>Adicionar planta</Button>
            </Link>
          }
        />
      ) : blocos.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 border-y border-line py-4">
          <PartyPopper className="shrink-0 text-primary" size={24} />
          <p className="text-sm">
            <span className="font-semibold">Nada pendente {periodoAtual.vazio}.</span>{' '}
            <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-6">
          {blocos.map((b) => (
            <section key={b.chave}>
              <FaixaGrupo
                bloco={b}
                concluirIds={agrupar === 'tarefas' ? b.grupos[0]?.agendas.map((a) => a.id) : undefined}
              />
              {b.grupos.map((g) => (
                <div key={g.atividadeId}>
                  {agrupar !== 'tarefas' && <CabecalhoTarefa grupo={g} />}
                  <Plantas grupo={g} view={view} />
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <Sheet
        open={prefs}
        onClose={() => setPrefs(false)}
        title="Preferências"
        footer={
          <Button block onClick={() => setPrefs(false)}>
            Pronto
          </Button>
        }
      >
        <div className="space-y-5">
          <OpcoesChips titulo="Período" opcoes={PERIODOS} value={periodo} onChange={setPeriodo} />
          <OpcoesChips titulo="Agrupar por" opcoes={AGRUPAMENTOS} value={agrupar} onChange={setAgrupar} />
          <OpcoesChips titulo="Visualização" opcoes={VIEWS_BANCADA} value={view} onChange={setView} />
        </div>
      </Sheet>
    </div>
  );
}

/** Plantas de uma tarefa: linhas recuadas (lista) ou faixa horizontal de fotos com encaixe. */
function Plantas({ grupo, view }: { grupo: GrupoAtividade; view: View }) {
  if (view === 'lista') {
    return (
      <div>
        {grupo.agendas.map((a) => (
          <LinhaTarefa key={a.id} agenda={a} />
        ))}
      </div>
    );
  }
  return (
    <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 pl-12 pt-2 [scrollbar-width:none]">
      {grupo.agendas.map((a) => (
        <FotoTarefa key={a.id} agenda={a} />
      ))}
    </div>
  );
}
