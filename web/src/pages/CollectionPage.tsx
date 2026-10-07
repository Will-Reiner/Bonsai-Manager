import { useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router';
import { FileText, LayoutGrid, List, Search, X } from 'lucide-react';
import { GrupoBadge } from '@/components/GrupoBadge';
import { BotaoPreferencias, BotaoTopo, OpcoesChips } from '@/components/Preferencias';
import { Sheet } from '@/components/Sheet';
import { Button, EmptyState, ErrorState, PlantThumb, Spinner } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useEscolha } from '@/lib/escolhas';
import { especieNome, plantaTitulo } from '@/lib/format';
import { useAgendas, usePlantas } from '@/lib/queries';
import { GRUPOS_PLANTA, type GrupoPlanta, type Planta } from '@/types';

type Ordem = 'recentes' | 'alfabetica' | 'tarefa';
type View = 'grid' | 'lista';
type FiltroGrupo = '' | 'sem' | GrupoPlanta;

const ORDENS: { value: Ordem; label: string }[] = [
  { value: 'recentes', label: 'Recentes' },
  { value: 'alfabetica', label: 'A–Z' },
  { value: 'tarefa', label: 'Próxima tarefa' },
];
const VIEWS: { value: View; label: ReactNode }[] = [
  { value: 'grid', label: <><LayoutGrid size={16} /> Grade</> },
  { value: 'lista', label: <><List size={16} /> Lista</> },
];
const FILTROS_GRUPO: { value: FiltroGrupo; label: string }[] = [
  { value: '', label: 'Todos' },
  ...GRUPOS_PLANTA,
  { value: 'sem', label: 'Sem grupo' },
];

export function CollectionPage() {
  const plantas = usePlantas();
  const agendas = useAgendas();
  const buscaRef = useRef<HTMLInputElement>(null);
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [obs, setObs] = useState<Planta | null>(null);
  const [view, setView] = useEscolha<View>('bonsai_colecao_view', 'grid', VIEWS);
  const [ordem, setOrdem] = useEscolha<Ordem>('bonsai_colecao_ordem', 'recentes', ORDENS);
  const [grupo, setGrupo] = useEscolha<FiltroGrupo>('bonsai_colecao_grupo', '', FILTROS_GRUPO);
  const [especieSalva, setEspecie] = useEscolha<string>('bonsai_colecao_especie', '');

  // Próxima tarefa pendente por planta
  const proximaTarefa = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const a of agendas.data ?? []) {
      if (a.status !== 'PENDENTE') continue;
      const atual = mapa.get(a.plantaId);
      if (!atual || a.dataAgendada < atual) mapa.set(a.plantaId, a.dataAgendada);
    }
    return mapa;
  }, [agendas.data]);

  const especies = useMemo(() => {
    const mapa = new Map<string, string>();
    plantas.data?.forEach((p) => {
      if (p.especieId) mapa.set(p.especieId, especieNome(p.especie));
    });
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [plantas.data]);

  const temSemEspecie = !!plantas.data?.some((p) => !p.especieId);
  // Espécie salva que saiu da coleção não filtra mais nada
  const especie =
    (especieSalva === 'sem' && temSemEspecie) || especies.some(([id]) => id === especieSalva) ? especieSalva : '';
  const filtrosAtivos = Number(!!grupo) + Number(!!especie);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtradas = (plantas.data ?? []).filter((p) => {
      if (especie === 'sem' ? !!p.especieId : especie && p.especieId !== especie) return false;
      if (grupo === 'sem' ? !!p.grupo : grupo && p.grupo !== grupo) return false;
      if (!termo) return true;
      return [p.nome, p.identificador, p.especie?.nomeComum, p.especie?.nomeCientifico]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(termo));
    });
    const porTarefa = (p: Planta) => proximaTarefa.get(p.id) ?? '9999';
    const semEspecieAntes = (a: Planta, b: Planta) => Number(!!a.especieId) - Number(!!b.especieId);
    return filtradas.sort(
      (a, b) =>
        semEspecieAntes(a, b) ||
        (ordem === 'alfabetica'
          ? plantaTitulo(a).localeCompare(plantaTitulo(b), 'pt-BR')
          : ordem === 'tarefa'
            ? porTarefa(a).localeCompare(porTarefa(b))
            : b.createdAt.localeCompare(a.createdAt)),
    );
  }, [plantas.data, busca, especie, grupo, ordem, proximaTarefa]);

  const total = plantas.data?.length ?? 0;
  const filtrando = filtrosAtivos > 0 || !!busca.trim();

  function alternarBusca() {
    if (buscando) {
      setBusca('');
      setBuscando(false);
    } else {
      // Foco no mesmo toque: no iPhone o teclado só abre assim
      flushSync(() => setBuscando(true));
      buscaRef.current?.focus();
    }
  }

  function limparFiltros() {
    setGrupo('');
    setEspecie('');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="flex items-end justify-between gap-3 pb-3 pt-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold">Coleção</h1>
          {plantas.data && (
            <p className="text-sm text-muted">{filtrando ? `${lista.length} de ${total} planta(s)` : `${total} planta(s)`}</p>
          )}
        </div>
        {total > 0 && (
          <div className="flex shrink-0 gap-2">
            <BotaoTopo label={buscando ? 'Fechar busca' : 'Buscar'} onClick={alternarBusca} marcado={buscando}>
              {buscando ? <X size={20} /> : <Search size={20} />}
            </BotaoTopo>
            <BotaoPreferencias ativos={filtrosAtivos} onClick={() => setPrefs(true)} />
          </div>
        )}
      </header>

      {plantas.isLoading ? (
        <Spinner />
      ) : plantas.isError ? (
        <ErrorState text={errorMessage(plantas.error)} onRetry={() => plantas.refetch()} />
      ) : plantas.data?.length === 0 ? (
        <EmptyState
          title="Sua coleção está vazia"
          text="Adicione sua primeira planta para começar a registrar cuidados e fotos."
          action={
            <Link to="/plantas/nova">
              <Button>Adicionar planta</Button>
            </Link>
          }
        />
      ) : (
        <>
          {buscando && (
            <div className="sticky top-0 z-20 -mx-4 bg-bg/95 px-4 pb-3 pt-safe backdrop-blur">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  ref={buscaRef}
                  className="input pl-10"
                  placeholder="Buscar por nome, código ou espécie"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  type="search"
                />
              </div>
            </div>
          )}

          {lista.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted">
              <p>Nenhuma planta encontrada.</p>
              {filtrosAtivos > 0 && (
                <button type="button" className="mt-2 font-medium text-primary" onClick={limparFiltros}>
                  Limpar filtros
                </button>
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {lista.map((p) => (
                <div key={p.id} className="relative">
                  <Link to={`/plantas/${p.id}`} className="card block overflow-hidden transition active:scale-[0.98]">
                    <div className="relative">
                      <PlantThumb url={p.fotoCapaUrl} className="aspect-square w-full" />
                      {!p.especieId && (
                        <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-danger text-sm font-bold text-white ring-2 ring-white" aria-label="Sem espécie">
                          !
                        </span>
                      )}
                      <GrupoBadge grupo={p.grupo} className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] shadow-sm" />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate font-semibold">{plantaTitulo(p)}</p>
                      <p className="truncate text-xs text-muted">
                        {p.especieId ? especieNome(p.especie) : <span className="font-medium text-danger">Sem espécie · completar</span>}
                      </p>
                    </div>
                  </Link>
                  {p.observacoes?.trim() && (
                    <BotaoObs onClick={() => setObs(p)} className="absolute right-2 top-2 bg-white/90 shadow-sm" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {lista.map((p) => (
                <div key={p.id} className="relative">
                  <Link to={`/plantas/${p.id}`} className={`card flex items-center gap-3 p-2.5 ${p.observacoes?.trim() ? 'pr-12' : ''}`}>
                    <PlantThumb url={p.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{plantaTitulo(p)}</p>
                      <p className="truncate text-sm text-muted">
                        {p.especieId ? (
                          especieNome(p.especie)
                        ) : (
                          <span className="font-medium text-danger">
                            <span className="mr-1 inline-flex size-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">!</span>
                            Sem espécie · completar
                          </span>
                        )}
                        {p.identificador && p.nome ? ` · ${p.identificador}` : ''}
                      </p>
                      <GrupoBadge grupo={p.grupo} className="mt-1" />
                    </div>
                  </Link>
                  {p.observacoes?.trim() && (
                    <BotaoObs onClick={() => setObs(p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-bg" />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Sheet
        open={prefs}
        onClose={() => setPrefs(false)}
        title="Preferências"
        footer={
          <div className="flex gap-2">
            {filtrosAtivos > 0 && (
              <Button variant="secondary" className="flex-1" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
            <Button className="flex-1" onClick={() => setPrefs(false)}>
              Ver {lista.length} planta(s)
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <OpcoesChips titulo="Visualização" opcoes={VIEWS} value={view} onChange={setView} />
          <OpcoesChips titulo="Ordenar por" opcoes={ORDENS} value={ordem} onChange={setOrdem} />
          <OpcoesChips titulo="Grupo" opcoes={FILTROS_GRUPO} value={grupo} onChange={setGrupo} />
          <OpcoesChips
            titulo="Espécie"
            opcoes={[
              { value: '', label: 'Todas' },
              ...(temSemEspecie ? [{ value: 'sem', label: 'Sem espécie' }] : []),
              ...especies.map(([id, nome]) => ({ value: id, label: nome })),
            ]}
            value={especie}
            onChange={setEspecie}
          />
        </div>
      </Sheet>

      <Sheet open={!!obs} onClose={() => setObs(null)} title="Observações">
        <p className="mb-2 text-sm font-medium text-muted">{plantaTitulo(obs)}</p>
        <p className="whitespace-pre-line text-ink">{obs?.observacoes}</p>
      </Sheet>
    </div>
  );
}

function BotaoObs({ onClick, className }: { onClick: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full text-ink transition active:scale-90 ${className}`}
      aria-label="Ver observações"
    >
      <FileText size={16} />
    </button>
  );
}
