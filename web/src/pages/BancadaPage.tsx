import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCheck, PartyPopper } from 'lucide-react';
import { Button, EmptyState, ErrorState, SectionTitle, Spinner } from '@/components/ui';
import { BenchTaskCard } from '@/components/BenchTaskCard';
import { useAuth } from '@/context/AuthContext';
import { AGRUPAMENTOS, PERIODOS, blocosDaBancada, tarefasDaBancada, type Agrupar, type Bloco, type Periodo } from '@/lib/bancada';
import { useAgendas, usePlantas } from '@/lib/queries';
import { errorMessage } from '@/lib/api';
import type { Planta } from '@/types';

const PERIODO_KEY = 'bonsai_bancada_periodo';
const AGRUPAR_KEY = 'bonsai_bancada_agrupar';

/** Lê uma escolha salva; armazenamento indisponível ou valor estranho → padrão. */
function lerEscolha<T extends string>(chave: string, validos: { value: T }[], padrao: T): T {
  try {
    const v = localStorage.getItem(chave);
    return validos.some((o) => o.value === v) ? (v as T) : padrao;
  } catch {
    return padrao;
  }
}

function salvarEscolha(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // sem armazenamento: a escolha vale só nesta visita
  }
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Bancada de trabalho: atrasadas + próximas do período, por grupo da planta, tarefa ou espécie. */
export function BancadaPage() {
  const { user } = useAuth();
  const agendas = useAgendas();
  const plantas = usePlantas();
  const [periodo, setPeriodo] = useState<Periodo>(() => lerEscolha(PERIODO_KEY, PERIODOS, 'semana'));
  const [agrupar, setAgrupar] = useState<Agrupar>(() => lerEscolha(AGRUPAR_KEY, AGRUPAMENTOS, 'grupos'));

  const nome = (user?.nomePublico || user?.nome || '').split(' ')[0];
  const semPlantas = plantas.data?.length === 0;
  const plantasPorId = useMemo(() => new Map<string, Planta>((plantas.data ?? []).map((p) => [p.id, p])), [plantas.data]);
  const { atrasadas, proximas } = tarefasDaBancada(agendas.data ?? [], periodo);
  const vazio = PERIODOS.find((p) => p.value === periodo)!.vazio;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="pb-2 pt-6">
        <p className="text-sm text-muted">
          {saudacao()}
          {nome && `, ${nome}`}
        </p>
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
          <div className="flex gap-2 pt-2">
            <select
              className="input min-w-0 flex-1 py-2 text-sm"
              value={periodo}
              aria-label="Período"
              onChange={(e) => {
                setPeriodo(e.target.value as Periodo);
                salvarEscolha(PERIODO_KEY, e.target.value);
              }}
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              className="input min-w-0 flex-1 py-2 text-sm"
              value={agrupar}
              aria-label="Agrupar por"
              onChange={(e) => {
                setAgrupar(e.target.value as Agrupar);
                salvarEscolha(AGRUPAR_KEY, e.target.value);
              }}
            >
              {AGRUPAMENTOS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {atrasadas.length > 0 && (
            <section>
              <SectionTitle tone="danger">Atrasadas · {atrasadas.length}</SectionTitle>
              <Blocos blocos={blocosDaBancada(atrasadas, agrupar, plantasPorId)} />
            </section>
          )}

          <section className="pb-6">
            <SectionTitle>Próximas tarefas</SectionTitle>
            {proximas.length > 0 ? (
              <Blocos blocos={blocosDaBancada(proximas, agrupar, plantasPorId)} />
            ) : atrasadas.length === 0 ? (
              <div className="card flex items-center gap-3 p-4">
                <PartyPopper className="shrink-0 text-primary" size={24} />
                <p className="text-sm">
                  <span className="font-semibold">Nada pendente {vazio}.</span>{' '}
                  <span className="text-muted">Aproveite para observar suas plantas 🌿</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma tarefa {vazio}.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    <div className="space-y-6">
      {blocos.map((b) => (
        <div key={b.chave}>
          {b.titulo && <h3 className="mb-3 border-b border-line pb-1.5 text-xl font-semibold">{b.titulo}</h3>}
          <GruposAtividade grupos={b.grupos} grande={!b.titulo} />
        </div>
      ))}
    </div>
  );
}

/** `grande`: sem título de bloco acima (modo "Por tarefa"), a atividade é o cabeçalho principal. */
function GruposAtividade({ grupos, grande }: { grupos: Bloco['grupos']; grande: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <div key={g.atividadeId}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className={`${grande ? 'text-lg' : 'text-base'} font-semibold`}>
              {g.nome} <span className="text-muted">· {g.agendas.length}</span>
            </h4>
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
