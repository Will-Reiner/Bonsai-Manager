import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { FileText, ImagePlus, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { GrupoBadge } from '@/components/GrupoBadge';
import { Sheet } from '@/components/Sheet';
import { Button, EmptyState, ErrorState, PlantThumb, Spinner } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { especieNome, plantaTitulo } from '@/lib/format';
import { useAgendas, usePlantas } from '@/lib/queries';
import { GRUPOS_PLANTA, type GrupoPlanta, type Planta } from '@/types';

type Ordem = 'recentes' | 'alfabetica' | 'tarefa';
const VIEW_KEY = 'bonsai_colecao_view';

export function CollectionPage() {
  const plantas = usePlantas();
  const agendas = useAgendas();
  const navigate = useNavigate();
  const fotosRef = useRef<HTMLInputElement>(null);
  const [busca, setBusca] = useState('');
  const [especie, setEspecie] = useState('');
  const [grupo, setGrupo] = useState<'' | 'sem' | GrupoPlanta>('');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [obs, setObs] = useState<Planta | null>(null);
  const [view, setView] = useState<'grid' | 'lista'>(() =>
    localStorage.getItem(VIEW_KEY) === 'lista' ? 'lista' : 'grid',
  );

  const trocarView = (v: 'grid' | 'lista') => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

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

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="flex items-end justify-between pb-3 pt-6">
        <div>
          <h1 className="text-3xl font-semibold">Coleção</h1>
          {plantas.data && <p className="text-sm text-muted">{plantas.data.length} planta(s)</p>}
        </div>
        <div className="flex gap-2">
          {!!plantas.data?.length && (
            <Button size="sm" variant="secondary" onClick={() => fotosRef.current?.click()}>
              <ImagePlus size={16} /> Fotos
            </Button>
          )}
          <Link to="/plantas/nova">
            <Button size="sm">
              <Plus size={16} /> Planta
            </Button>
          </Link>
        </div>
        <input
          ref={fotosRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = '';
            if (files.length) navigate('/fotos/lote', { state: { files } });
          }}
        />
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
          <div className="sticky top-0 z-20 -mx-4 space-y-2 bg-bg/95 px-4 pb-3 pt-safe backdrop-blur">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input pl-10"
                placeholder="Buscar por nome, código ou espécie"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                type="search"
              />
            </div>
            <div className="flex gap-2">
              <select className="input min-w-0 flex-1 py-2 text-sm" value={grupo} onChange={(e) => setGrupo(e.target.value as typeof grupo)} aria-label="Filtrar por grupo">
                <option value="">Todos os grupos</option>
                {GRUPOS_PLANTA.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
                <option value="sem">Sem grupo</option>
              </select>
              <select className="input min-w-0 flex-1 py-2 text-sm" value={especie} onChange={(e) => setEspecie(e.target.value)}>
                <option value="">Todas as espécies</option>
                {plantas.data?.some((p) => !p.especieId) && <option value="sem">Sem espécie</option>}
                {especies.map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <select className="input min-w-0 flex-1 py-2 text-sm" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
                <option value="recentes">Recentes</option>
                <option value="alfabetica">A–Z</option>
                <option value="tarefa">Próxima tarefa</option>
              </select>
              <div className="flex rounded-xl border border-line bg-white p-0.5">
                {(['grid', 'lista'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => trocarView(v)}
                    className={`flex size-9 items-center justify-center rounded-[10px] ${view === v ? 'bg-primary-light text-primary' : 'text-muted'}`}
                    aria-label={v === 'grid' ? 'Ver em grade' : 'Ver em lista'}
                    aria-pressed={view === v}
                  >
                    {v === 'grid' ? <LayoutGrid size={18} /> : <List size={18} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {lista.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Nenhuma planta encontrada.</p>
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
