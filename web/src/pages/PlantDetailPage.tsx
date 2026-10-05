import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CalendarCheck, CalendarClock, CalendarPlus, Camera, Check, ChevronRight, Clock, ImagePlus, Pencil, Plus, ShoppingBag } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, PlantThumb, SectionTitle, Spinner } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { EnviosProgresso, useEnviarFotos } from '@/components/FotoUpload';
import { useCare } from '@/context/CareContext';
import { errorMessage } from '@/lib/api';
import { dataCurta, dataRelativa, especieNome, modoAquisicaoLabel, plantaTitulo, tempoDesde } from '@/lib/format';
import { chaveItem, fotosOrdenadas, linhaDoTempo, type ItemLinha } from '@/lib/linhaDoTempo';
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
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
              {imagens.map((f) => (
                <button key={f.id} onClick={() => abrirFoto(f)} className="size-28 shrink-0 snap-start overflow-hidden rounded-2xl bg-primary-light">
                  <img src={f.caminhoArquivo} alt={f.titulo ?? ''} loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <EnviosProgresso envios={upload.envios} />
        </Secao>

        <Secao titulo="Histórico e cuidados" verMais={linha.pendentes.length + linha.passado.length ? `/plantas/${p.id}/historico` : undefined}>
          {agendas.isLoading ? (
            <Spinner />
          ) : linha.pendentes.length + linha.passado.length === 0 ? (
            <EmptyState title="Nada por aqui ainda" text="Cuidados agendados, concluídos e fotos aparecem nesta linha do tempo." />
          ) : (
            <FaixaLinhaDoTempo pendentes={linha.pendentes} passado={linha.passado} abrirFoto={abrirFoto} />
          )}
        </Secao>

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

/** Faixa horizontal: pendentes (futuras → atrasadas), marcador de hoje, depois o passado. Abre centrada em "hoje". */
function FaixaLinhaDoTempo({ pendentes, passado, abrirFoto }: { pendentes: ItemLinha[]; passado: ItemLinha[]; abrirFoto: (f: Foto) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hojeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = scrollRef.current;
    const hoje = hojeRef.current;
    if (!box || !hoje) return;
    // Deixa a tarefa mais próxima de hoje visível sem rolar a página inteira
    box.scrollLeft = Math.max(0, hoje.offsetLeft - box.clientWidth / 2);
  }, [pendentes.length]);

  return (
    <div ref={scrollRef} className="relative -mx-4 flex items-stretch gap-2.5 overflow-x-auto px-4 pb-2">
      {pendentes.map((i) => (
        <CardLinha key={chaveItem(i)} item={i} abrirFoto={abrirFoto} />
      ))}
      {pendentes.length > 0 && (
        <div ref={hojeRef} className="flex shrink-0 flex-col items-center gap-1 px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Hoje</span>
          <span className="w-0.5 flex-1 rounded-full bg-primary/40" />
        </div>
      )}
      {passado.map((i) => (
        <CardLinha key={chaveItem(i)} item={i} abrirFoto={abrirFoto} />
      ))}
    </div>
  );
}

function CardLinha({ item, abrirFoto }: { item: ItemLinha; abrirFoto: (f: Foto) => void }) {
  const { abrirTarefa } = useCare();

  if (item.tipo === 'fotos') {
    const [primeira] = item.fotos;
    return (
      <button onClick={() => abrirFoto(primeira)} className="w-32 shrink-0 rounded-2xl border border-line bg-white p-2 text-left opacity-80">
        <div className="relative">
          <img src={primeira.caminhoArquivo} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
          {item.fotos.length > 1 && (
            <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 text-[11px] font-semibold text-white">+{item.fotos.length - 1}</span>
          )}
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold">
          <Camera size={14} className="shrink-0 text-muted" /> {item.fotos.length > 1 ? `${item.fotos.length} fotos` : 'Foto'}
        </p>
        <p className="text-xs text-muted">{dataCurta(item.data)}</p>
      </button>
    );
  }

  const { agenda, estado } = item;
  const foto = agenda.fotos?.[0]?.caminhoArquivo;
  const estilo = {
    futura: 'border-2 border-dashed border-primary/40 bg-white',
    atrasada: 'border-2 border-danger/40 bg-danger-light',
    feita: 'border border-line bg-white opacity-80',
  }[estado];

  return (
    <button onClick={() => abrirTarefa(agenda)} className={`w-32 shrink-0 rounded-2xl p-2.5 text-left ${estilo}`}>
      {foto ? (
        <img src={foto} alt="" loading="lazy" className="mb-1.5 aspect-square w-full rounded-lg object-cover" />
      ) : (
        <span
          className={`mb-2 flex size-7 items-center justify-center rounded-full ${
            estado === 'atrasada' ? 'bg-white text-danger' : 'bg-primary-light text-primary'
          }`}
        >
          {estado === 'feita' ? <Check size={15} strokeWidth={2.5} /> : <CalendarClock size={15} />}
        </span>
      )}
      <p className="line-clamp-2 text-sm font-semibold leading-tight">{agenda.atividade?.nome ?? 'Cuidado'}</p>
      <p className={`mt-0.5 text-xs ${estado === 'atrasada' ? 'font-semibold text-danger' : 'text-muted'}`}>
        {estado === 'feita' ? dataCurta(item.data) : estado === 'atrasada' ? `Atrasada · ${dataRelativa(item.data)}` : dataRelativa(item.data)}
      </p>
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
