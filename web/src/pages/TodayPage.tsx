import { Link } from 'react-router';
import { CalendarCheck, PartyPopper } from 'lucide-react';
import { Button, EmptyState, ErrorState, SectionTitle, Spinner } from '@/components/ui';
import { TaskCard } from '@/components/TaskCard';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import { agruparTarefas } from '@/lib/format';
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

export function TodayPage() {
  const { user } = useAuth();
  const { registrarCuidado } = useCare();
  const agendas = useAgendas();
  const plantas = usePlantas();

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const grupos = agruparTarefas(agendas.data ?? []);
  const semPlantas = plantas.data?.length === 0;
  const nadaPendente = !grupos.atrasadas.length && !grupos.hoje.length;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="pb-2 pt-6">
        <p className="text-sm text-muted">{saudacao()}{nome && `, ${nome}`}</p>
        <h1 className="text-3xl font-semibold">Hoje</h1>
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
          {grupos.atrasadas.length > 0 && (
            <section>
              <SectionTitle tone="danger">Atrasadas · {grupos.atrasadas.length}</SectionTitle>
              <div className="space-y-2">
                {grupos.atrasadas.map((a) => (
                  <TaskCard key={a.id} agenda={a} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionTitle>Para hoje</SectionTitle>
            {grupos.hoje.length > 0 ? (
              <div className="space-y-2">
                {grupos.hoje.map((a) => (
                  <TaskCard key={a.id} agenda={a} />
                ))}
              </div>
            ) : (
              nadaPendente && (
                <div className="card flex items-center gap-3 p-4">
                  <PartyPopper className="shrink-0 text-primary" size={24} />
                  <p className="text-sm">
                    <span className="font-semibold">Nada pendente hoje.</span>{' '}
                    <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
                  </p>
                </div>
              )
            )}
            {grupos.hoje.length === 0 && !nadaPendente && <p className="text-sm text-muted">Nenhuma tarefa marcada para hoje.</p>}
          </section>

          {grupos.proximas.length > 0 && (
            <section>
              <SectionTitle>Próximos 7 dias</SectionTitle>
              <div className="space-y-2">
                {grupos.proximas.map((a) => (
                  <TaskCard key={a.id} agenda={a} />
                ))}
              </div>
            </section>
          )}

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
