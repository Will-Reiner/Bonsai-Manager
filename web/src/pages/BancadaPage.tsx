import { Link, useNavigate } from 'react-router';
import { CalendarCheck, CheckCheck, PartyPopper } from 'lucide-react';
import { Button, EmptyState, ErrorState, SectionTitle, Spinner } from '@/components/ui';
import { BenchTaskCard } from '@/components/BenchTaskCard';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import { agruparPorAtividade, tarefasDaBancada, type GrupoAtividade } from '@/lib/format';
import { useAgendas, usePlantas } from '@/lib/queries';
import { errorMessage } from '@/lib/api';

const ESTACAO_DICA: Record<string, string> = {
  verao: 'Verão: atenção redobrada à rega nos dias quentes — prefira o início da manhã.',
  outono: 'Outono: reduza a adubação nitrogenada e prepare as plantas para o repouso.',
  inverno: 'Inverno: regas mais espaçadas e proteção das espécies sensíveis ao frio.',
  primavera: 'Primavera: época de brotação — bom momento para transplantes e adubação.',
};

/** Estação no hemisfério sul (o app é usado no Brasil). */
function estacaoAtual() {
  const m = new Date().getMonth();
  if (m === 11 || m <= 1) return 'verao';
  if (m <= 4) return 'outono';
  if (m <= 7) return 'inverno';
  return 'primavera';
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Bancada de trabalho: atrasadas + próximas tarefas, agrupadas por tipo de cuidado. */
export function BancadaPage() {
  const { user } = useAuth();
  const { registrarCuidado } = useCare();
  const agendas = useAgendas();
  const plantas = usePlantas();

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const { atrasadas, proximas } = tarefasDaBancada(agendas.data ?? []);
  const semPlantas = plantas.data?.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="pb-2 pt-6">
        <p className="text-sm text-muted">{saudacao()}{nome && `, ${nome}`}</p>
        <h1 className="text-3xl font-semibold">Bancada</h1>
      </header>

      {agendas.isLoading || plantas.isLoading ? (
        <Spinner />
      ) : agendas.isError ? (
        <ErrorState text={errorMessage(agendas.error)} onRetry={() => agendas.refetch()} />
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
            <section>
              <SectionTitle tone="danger">Atrasadas · {atrasadas.length}</SectionTitle>
              <Grupos grupos={agruparPorAtividade(atrasadas)} />
            </section>
          )}

          <section>
            <SectionTitle>Próximas tarefas</SectionTitle>
            {proximas.length > 0 ? (
              <Grupos grupos={agruparPorAtividade(proximas)} />
            ) : atrasadas.length === 0 ? (
              <div className="card flex items-center gap-3 p-4">
                <PartyPopper className="shrink-0 text-primary" size={24} />
                <p className="text-sm">
                  <span className="font-semibold">Nada pendente nos próximos dias.</span>{' '}
                  <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma tarefa nos próximos 7 dias.</p>
            )}
          </section>

          <section className="mt-6 rounded-2xl bg-accent-light p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Dica da estação</p>
            <p className="mt-1 text-sm text-ink">{ESTACAO_DICA[estacaoAtual()]}</p>
          </section>

          <Button variant="secondary" block className="mt-4" onClick={() => registrarCuidado()}>
            <CalendarCheck size={18} /> Registrar cuidado sem agendamento
          </Button>
        </>
      )}
    </div>
  );
}

function Grupos({ grupos }: { grupos: GrupoAtividade[] }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <div key={g.atividadeId}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">
              {g.nome} <span className="text-muted">· {g.agendas.length}</span>
            </h3>
            {g.agendas.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/concluir?ids=${g.agendas.map((a) => a.id).join(',')}`)}
              >
                <CheckCheck size={16} /> Concluir grupo
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {g.agendas.map((a) => (
              <BenchTaskCard key={a.id} agenda={a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
