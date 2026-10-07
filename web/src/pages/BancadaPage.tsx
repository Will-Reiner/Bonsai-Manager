import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CalendarClock, CheckCheck, PartyPopper, TriangleAlert } from 'lucide-react';
import { Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import { BenchTaskCard } from '@/components/BenchTaskCard';
import { BotaoPreferencias, OpcoesChips } from '@/components/Preferencias';
import { Sheet } from '@/components/Sheet';
import { useAuth } from '@/context/AuthContext';
import { AGRUPAMENTOS, PERIODOS, blocosDaBancada, tarefasDaBancada, type Agrupar, type Bloco, type Periodo } from '@/lib/bancada';
import { TOM_NEUTRO, estiloFaixa } from '@/lib/format';
import { useEscolha } from '@/lib/escolhas';
import { useAgendas, usePlantas } from '@/lib/queries';
import { errorMessage } from '@/lib/api';
import type { Planta } from '@/types';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Bancada de trabalho: atrasadas + próximas do período, por grupo da planta, tarefa ou espécie. */
export function BancadaPage() {
  const { user } = useAuth();
  const agendas = useAgendas();
  const plantas = usePlantas();
  const [prefs, setPrefs] = useState(false);
  const [periodo, setPeriodo] = useEscolha<Periodo>('bonsai_bancada_periodo', 'semana', PERIODOS);
  const [agrupar, setAgrupar] = useEscolha<Agrupar>('bonsai_bancada_agrupar', 'grupos', AGRUPAMENTOS);

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const semPlantas = plantas.data?.length === 0;
  const plantasPorId = useMemo(() => new Map<string, Planta>((plantas.data ?? []).map((p) => [p.id, p])), [plantas.data]);
  const { atrasadas, proximas } = tarefasDaBancada(agendas.data ?? [], periodo);
  const periodoAtual = PERIODOS.find((p) => p.value === periodo)!;
  const agruparAtual = AGRUPAMENTOS.find((a) => a.value === agrupar)!;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="flex items-end justify-between gap-3 pb-2 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {saudacao()}
            {nome && `, ${nome}`}
          </p>
          <h1 className="text-3xl font-semibold">Bancada</h1>
          {!semPlantas && (
            <p className="text-sm text-muted">
              {periodoAtual.label} · {agruparAtual.label.toLowerCase()}
            </p>
          )}
        </div>
        {!semPlantas && <BotaoPreferencias ativos={0} onClick={() => setPrefs(true)} />}
      </header>

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
      ) : (
        <>
          {atrasadas.length > 0 && (
            <section className="mt-4 rounded-3xl border-2 border-danger/40 bg-danger-light p-3">
              <h2 className="mb-3 flex items-center gap-2 px-1 font-sans text-base font-bold text-danger">
                <TriangleAlert size={20} /> Atrasadas · {atrasadas.length}
              </h2>
              <Blocos blocos={blocosDaBancada(atrasadas, agrupar, plantasPorId)} />
            </section>
          )}

          <section className="pb-6">
            <h2 className="mb-3 mt-6 flex items-center gap-2 px-1 font-sans text-base font-bold text-primary-dark">
              <CalendarClock size={20} /> Próximas{proximas.length > 0 && ` · ${proximas.length}`}
            </h2>
            {proximas.length > 0 ? (
              <Blocos blocos={blocosDaBancada(proximas, agrupar, plantasPorId)} />
            ) : atrasadas.length === 0 ? (
              <div className="card flex items-center gap-3 p-4">
                <PartyPopper className="shrink-0 text-primary" size={24} />
                <p className="text-sm">
                  <span className="font-semibold">Nada pendente {periodoAtual.vazio}.</span>{' '}
                  <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma tarefa {periodoAtual.vazio}.</p>
            )}
          </section>
        </>
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
        </div>
      </Sheet>
    </div>
  );
}

/** Blocos com título (grupo/espécie) viram cards com faixa colorida; sem título ("por tarefa"), cada atividade é um card. */
function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    <div className="space-y-4">
      {blocos.map((b) =>
        b.titulo ? (
          <div key={b.chave} className="card overflow-hidden">
            <h3
              className="faixa flex items-center justify-between gap-2 px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-wide"
              style={estiloFaixa(b.cor ?? TOM_NEUTRO)}
            >
              <span className="truncate">{b.titulo}</span>
              <span className="shrink-0 font-semibold normal-case opacity-90">
                {b.grupos.reduce((n, g) => n + g.agendas.length, 0)} tarefa(s)
              </span>
            </h3>
            <div className="space-y-5 p-3">
              {b.grupos.map((g) => (
                <GrupoAtividade key={g.atividadeId} grupo={g} />
              ))}
            </div>
          </div>
        ) : (
          b.grupos.map((g) => (
            <div key={g.atividadeId} className="card p-3">
              <GrupoAtividade grupo={g} />
            </div>
          ))
        ),
      )}
    </div>
  );
}

function GrupoAtividade({ grupo: g }: { grupo: Bloco['grupos'][number] }) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <AtividadeIcone nome={g.nome} className="size-9" />
        <h4 className="min-w-0 flex-1 truncate font-sans text-base font-semibold text-ink">
          {g.nome} <span className="font-normal text-muted">· {g.agendas.length}</span>
        </h4>
        {g.agendas.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/concluir?ids=${g.agendas.map((a) => a.id).join(',')}`)}>
            <CheckCheck size={16} /> Concluir todas
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {g.agendas.map((a) => (
          <BenchTaskCard key={a.id} agenda={a} />
        ))}
      </div>
    </div>
  );
}
