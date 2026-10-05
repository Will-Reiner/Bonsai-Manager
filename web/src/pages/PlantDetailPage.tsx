import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CalendarCheck, CalendarClock, CalendarPlus, Camera, Check, ChevronRight, Clock, ImagePlus, Pencil, Plus, ShoppingBag } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, PlantThumb, SectionTitle, Spinner } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { Roda } from '@/components/Roda';
import { EnviosProgresso, useEnviarFotos } from '@/components/FotoUpload';
import { useCare } from '@/context/CareContext';
import { errorMessage } from '@/lib/api';
import { dataCurta, dataRelativa, especieNome, modoAquisicaoLabel, plantaTitulo, tempoDesde } from '@/lib/format';
import { rotuloUltima, ultimasPorPlanta } from '@/lib/cuidados';
import { chaveItem, dataDaFoto, fotosOrdenadas, linhaDoTempo, type ItemLinha } from '@/lib/linhaDoTempo';
import { useAgendas, useFotos, usePlanta } from '@/lib/queries';
import type { Foto } from '@/types';

export function PlantDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const planta = usePlanta(id);
  const agendas = useAgendas();
  const fotos = useFotos(id);
  const { registrarCuidado, agendarCuidado } = useCare();
  const upload = useEnviarFotos(id);
  const [acoes, setAcoes] = useState(false);

  const daPlanta = useMemo(() => (agendas.data ?? []).filter((a) => a.plantaId === id), [agendas.data, id]);
  const imagens = useMemo(() => fotosOrdenadas(fotos.data), [fotos.data]);
  const linha = useMemo(() => linhaDoTempo(daPlanta, fotos.data), [daPlanta, fotos.data]);
  const ultimos = useMemo(() => {
    const nomes = new Map(daPlanta.map((a) => [a.atividadeId, a.atividade?.nome ?? 'Cuidado']));
    return [...(ultimasPorPlanta(daPlanta).get(id) ?? [])]
      .map(([atividadeId, data]) => ({ atividadeId, data, nome: nomes.get(atividadeId) ?? 'Cuidado' }))
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [daPlanta, id]);

  if (planta.isLoading) return <><PageHeader title="Planta" back /><Spinner /></>;
  if (planta.isError || !planta.data)
    return <><PageHeader title="Planta" back /><ErrorState text={errorMessage(planta.error, 'Planta não encontrada.')} /></>;

  const p = planta.data;
  const idade = tempoDesde(p.dataAquisicao);
  const aquisicao = p.modoAquisicao ? modoAquisicaoLabel(p.modoAquisicao) : null;
  const galeria = `/plantas/${p.id}/galeria`;
  const abrirFoto = (f: Foto) => navigate(`${galeria}?foto=${f.id}`);
  const capa = imagens.find((f) => f.caminhoArquivo === p.fotoCapaUrl);

  const acao = (fn: () => void) => () => {
    setAcoes(false);
    fn();
  };

  return (
    <div className="pb-28">
      <PageHeader
        title={plantaTitulo(p)}
        back
        right={
          <Link to={`/plantas/${p.id}/editar`} className="flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-light" aria-label="Editar planta">
            <Pencil size={20} />
          </Link>
        }
      />
      {upload.input}

      <div className="mx-auto max-w-2xl sm:px-4 sm:pt-4">
        <button
          onClick={() => (capa ? abrirFoto(capa) : navigate(galeria))}
          className="block w-full overflow-hidden sm:rounded-3xl"
          aria-label="Abrir fotos"
        >
          <PlantThumb url={p.fotoCapaUrl} className="aspect-[4/5] max-h-[70dvh] w-full" />
        </button>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        <div className="mt-4">
          <p className="font-display text-2xl font-semibold leading-tight">{especieNome(p.especie)}</p>
          {p.especie?.nomeCientifico && p.especie?.nomeComum && (
            <p className="mt-0.5 text-sm italic text-muted">{p.especie.nomeCientifico}</p>
          )}
        </div>
        {!p.especieId && (
          <Link
            to={`/plantas/${p.id}/editar`}
            className="mt-3 flex items-center gap-2 rounded-2xl bg-danger/10 p-3 text-sm font-medium text-danger"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-danger font-bold text-white">!</span>
            Planta sem espécie — toque para completar o cadastro
          </Link>
        )}

        {(idade || aquisicao) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
            {idade && (
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-primary" /> Na coleção há {idade}
              </span>
            )}
            {aquisicao && (
              <span className="flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-primary" /> {aquisicao}
              </span>
            )}
          </div>
        )}

        <Secao titulo={imagens.length ? `Fotos · ${imagens.length}` : 'Fotos'} verMais={imagens.length ? galeria : undefined}>
          {fotos.isLoading ? (
            <Spinner />
          ) : imagens.length === 0 ? (
            <button onClick={upload.escolher} className="card flex w-full items-center gap-3 p-4 text-left text-sm text-muted">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                <ImagePlus size={22} />
              </span>
              Nenhuma foto ainda. Toque para adicionar e acompanhar a evolução.
            </button>
          ) : (
            // Mais antiga à esquerda; abre nas duas mais novas
            <Roda label="Fotos" inicio={imagens.length - 2}>
              {[...imagens].reverse().map((f) => (
                <button key={f.id} onClick={() => abrirFoto(f)} className="block w-full text-left">
                  <img src={f.caminhoArquivo} alt={f.titulo ?? ''} loading="lazy" className="aspect-square w-full rounded-2xl bg-primary-light object-cover" />
                  <span className="mt-1.5 block text-center text-xs text-muted">{dataCurta(dataDaFoto(f))}</span>
                </button>
              ))}
            </Roda>
          )}
          <EnviosProgresso envios={upload.envios} />
        </Secao>

        <Secao titulo="Histórico e cuidados" verMais={linha.pendentes.length + linha.passado.length ? `/plantas/${p.id}/historico` : undefined}>
          {agendas.isLoading ? (
            <Spinner />
          ) : linha.pendentes.length + linha.passado.length === 0 ? (
            <EmptyState title="Nada por aqui ainda" text="Cuidados agendados, concluídos e fotos aparecem nesta linha do tempo." />
          ) : (
            <RodaLinhaDoTempo passado={linha.passado} pendentes={linha.pendentes} abrirFoto={abrirFoto} />
          )}
        </Secao>

        {ultimos.length > 0 && (
          <Secao titulo="Últimos cuidados">
            <div className="card divide-y divide-line">
              {ultimos.map((u) => (
                <div key={u.atividadeId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="font-medium">{u.nome}</span>
                  <span className="text-muted">{rotuloUltima([u.data])}</span>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {p.observacoes && (
          <>
            <SectionTitle>Observações</SectionTitle>
            <p className="whitespace-pre-line text-sm leading-relaxed">{p.observacoes}</p>
          </>
        )}
      </div>

      <button
        onClick={() => setAcoes(true)}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-[max(1.25rem,calc(50vw-21rem+1.25rem))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition active:scale-90"
        aria-label="Ações da planta"
      >
        <Plus size={28} />
      </button>

      <Sheet open={acoes} onClose={() => setAcoes(false)} title={plantaTitulo(p)}>
        <div className="grid gap-2.5 pb-safe">
          <AcaoItem icon={<CalendarCheck size={22} />} title="Registrar cuidado" text="Reguei, adubei, podei… agora" onClick={acao(() => registrarCuidado(p.id))} />
          <AcaoItem icon={<CalendarPlus size={22} />} title="Agendar cuidado" text="Criar uma tarefa para depois" onClick={acao(() => agendarCuidado(p.id))} />
          <AcaoItem icon={<Camera size={22} />} title="Tirar foto" text="Abrir a câmera agora" onClick={acao(upload.tirarFoto)} />
          <AcaoItem icon={<ImagePlus size={22} />} title="Adicionar fotos da galeria" text="Uma ou várias de uma vez" onClick={acao(upload.escolher)} />
        </div>
      </Sheet>
    </div>
  );
}

function Secao({ titulo, verMais, children }: { titulo: string; verMais?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 mt-7 flex items-center justify-between">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">{titulo}</h2>
        {verMais && (
          <Link to={verMais} className="-mr-2 flex items-center rounded-full px-2 py-1 text-sm font-semibold text-primary hover:bg-primary-light">
            Ver mais <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Linha do tempo em roda, da mais antiga (esquerda) para a mais nova (direita).
 * Abre com a última tarefa feita e a próxima lado a lado no centro.
 */
function RodaLinhaDoTempo({ passado, pendentes, abrirFoto }: { passado: ItemLinha[]; pendentes: ItemLinha[]; abrirFoto: (f: Foto) => void }) {
  const itens = [...passado, ...pendentes];
  const ultima = passado.findLastIndex((i) => i.tipo === 'tarefa');
  const proxima = pendentes.length ? passado.length : -1;
  // Próxima no lugar da direita e o que veio logo antes (normalmente a última feita) à esquerda;
  // sem pendentes, a última feita fica à esquerda
  const inicio = proxima >= 0 ? proxima - 1 : ultima >= 0 ? ultima : itens.length - 2;

  return (
    <Roda label="Histórico e cuidados" inicio={inicio}>
      {itens.map((item, i) => (
        <CardLinha key={chaveItem(item)} item={item} rotulo={i === ultima ? 'Última' : i === proxima ? 'Próxima' : undefined} abrirFoto={abrirFoto} />
      ))}
    </Roda>
  );
}

const ESTILO = {
  feita: { card: 'border-accent/25 bg-accent-light', icone: 'bg-white text-accent', rotulo: 'bg-accent text-white' },
  futura: { card: 'border-primary/30 bg-primary-light', icone: 'bg-white text-primary', rotulo: 'bg-primary text-white' },
  atrasada: { card: 'border-danger/40 bg-danger-light', icone: 'bg-white text-danger', rotulo: 'bg-danger text-white' },
};

function CardLinha({ item, rotulo, abrirFoto }: { item: ItemLinha; rotulo?: string; abrirFoto: (f: Foto) => void }) {
  const { abrirTarefa } = useCare();
  const estado = item.tipo === 'tarefa' ? item.estado : 'feita';
  const estilo = ESTILO[estado];
  const fotos = item.tipo === 'tarefa' ? (item.agenda.fotos ?? []) : item.fotos;
  const capa = fotos[0]?.caminhoArquivo;

  const titulo = item.tipo === 'tarefa' ? (item.agenda.atividade?.nome ?? 'Cuidado') : fotos.length > 1 ? `${fotos.length} fotos` : 'Foto';
  const quando =
    estado === 'feita' ? dataCurta(item.data) : estado === 'atrasada' ? `Atrasada · ${dataRelativa(item.data)}` : dataRelativa(item.data);

  return (
    <button
      onClick={() => (item.tipo === 'tarefa' ? abrirTarefa(item.agenda) : abrirFoto(item.fotos[0]))}
      className={`flex h-full w-full flex-col rounded-3xl border-2 p-3 text-left ${estilo.card}`}
    >
      <div className="relative">
        {capa ? (
          <img src={capa} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        ) : (
          <div className={`flex aspect-[4/3] w-full items-center justify-center rounded-2xl ${estilo.icone}`}>
            {estado === 'feita' ? <Check size={28} strokeWidth={2.5} /> : <CalendarClock size={28} />}
          </div>
        )}
        {fotos.length > 1 && item.tipo === 'tarefa' && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            <Camera size={12} /> {fotos.length}
          </span>
        )}
        {rotulo && (
          <span className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${estilo.rotulo}`}>{rotulo}</span>
        )}
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 font-semibold leading-tight">
        {item.tipo === 'fotos' && <Camera size={15} className="shrink-0 text-accent" />}
        <span className="line-clamp-2">{titulo}</span>
      </p>
      <p className={`mt-0.5 text-sm ${estado === 'atrasada' ? 'font-semibold text-danger' : 'text-muted'}`}>{quando}</p>
    </button>
  );
}

function AcaoItem({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card flex items-center gap-4 p-4 text-left transition hover:border-primary/40 active:scale-[0.99]">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}
