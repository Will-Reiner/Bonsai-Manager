import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, Sparkles, Star, Trash2, X } from 'lucide-react';
import { Button, EmptyState, PageHeader, Spinner } from '@/components/ui';
import { ConfirmSheet } from '@/components/Sheet';
import { EnviosProgresso, useEnviarFotos } from '@/components/FotoUpload';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { fotosApi, inspiracoesApi, plantasApi } from '@/lib/endpoints';
import { dataNumerica, plantaTitulo } from '@/lib/format';
import { dataDaFoto, fotosOrdenadas, fotosPorMes } from '@/lib/linhaDoTempo';
import { travarScroll } from '@/lib/scrollLock';
import { keys, useFotos, useInspiracoes, usePlanta } from '@/lib/queries';
import type { Foto, Inspiracao } from '@/types';

/**
 * Todas as fotos da planta. A foto aberta fica na URL (`?foto=`), então o "voltar" do celular fecha o visualizador.
 * `?escolher=inspiracao`: tocar numa foto a define como inspiração e volta.
 */
export function PlantGalleryPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const planta = usePlanta(id);
  const fotos = useFotos(id);
  const inspiracoes = useInspiracoes(id);
  const upload = useEnviarFotos(id);
  const escolhendo = params.get('escolher') === 'inspiracao';
  const [definindo, setDefinindo] = useState<string | null>(null);
  const inspiracaoId = inspiracoes.data?.[0]?.fotoId;

  const imagens = useMemo(() => fotosOrdenadas(fotos.data), [fotos.data]);
  const porMes = useMemo(() => fotosPorMes(fotos.data), [fotos.data]);
  const indice = imagens.findIndex((f) => f.id === params.get('foto'));
  const daGrade = (location.state as { daGrade?: boolean } | null)?.daGrade;

  const abrir = (f: Foto) => navigate({ search: `?foto=${f.id}` }, { state: { daGrade: true } });

  async function escolherInspiracao(f: Foto) {
    setDefinindo(f.id);
    try {
      await inspiracoesApi.definir(id, f.id, inspiracoes.data);
      await queryClient.invalidateQueries({ queryKey: keys.inspiracoes(id) });
      toast('Inspiração definida');
      navigate(-1);
    } catch (error) {
      toast(errorMessage(error), 'error');
      setDefinindo(null);
    }
  }
  const trocar = (f: Foto) => setParams({ foto: f.id }, { replace: true, state: location.state });
  const fechar = () => (daGrade ? navigate(-1) : setParams({}, { replace: true }));

  return (
    <div className="pb-8">
      <PageHeader
        title={escolhendo ? 'Escolher inspiração' : planta.data ? `Fotos · ${plantaTitulo(planta.data)}` : 'Fotos'}
        back
        right={
          !escolhendo && <>
            <button
              onClick={upload.tirarFoto}
              disabled={upload.enviando}
              className="flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-light disabled:opacity-50"
              aria-label="Tirar foto"
            >
              <Camera size={21} />
            </button>
            <button
              onClick={upload.escolher}
              disabled={upload.enviando}
              className="-mr-2 flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-light disabled:opacity-50"
              aria-label="Adicionar fotos da galeria"
            >
              <ImagePlus size={21} />
            </button>
          </>
        }
      />
      {upload.input}

      <div className="mx-auto max-w-2xl px-4">
        <EnviosProgresso envios={upload.envios} />
        {escolhendo && imagens.length > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-primary-light p-3 text-sm">
            <Sparkles size={18} className="shrink-0 text-primary" /> Toque na foto que mostra como você quer que ela fique.
          </p>
        )}
        {fotos.isLoading ? (
          <Spinner />
        ) : imagens.length === 0 ? (
          <EmptyState
            icon={<Camera size={26} />}
            title="Nenhuma foto ainda"
            text="Fotos ao longo do tempo mostram a evolução da planta."
            action={
              <div className="flex gap-2">
                <Button onClick={upload.tirarFoto}><Camera size={18} /> Tirar foto</Button>
                <Button variant="secondary" onClick={upload.escolher}><ImagePlus size={18} /> Galeria</Button>
              </div>
            }
          />
        ) : (
          porMes.map(({ ano, meses }) => (
            <section key={ano} className="mt-6">
              <h2 className="font-display text-2xl font-semibold">{ano}</h2>
              {meses.map((mes) => (
                <div key={mes.chave} className="mt-3">
                  <h3 className="mb-2 text-sm font-semibold capitalize text-muted">
                    {mes.nome} <span className="font-normal">· {mes.fotos.length}</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {mes.fotos.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => (escolhendo ? escolherInspiracao(f) : abrir(f))}
                        disabled={!!definindo}
                        className={`relative aspect-square overflow-hidden rounded-lg bg-primary-light ${definindo === f.id ? 'animate-pulse' : ''}`}
                      >
                        <img src={f.caminhoArquivo} alt={f.titulo ?? ''} loading="lazy" className="size-full object-cover" />
                        <span className="absolute right-1.5 top-1.5 flex gap-1">
                          {f.id === inspiracaoId && <Sparkles size={16} className="text-white drop-shadow" aria-label="Inspiração" />}
                          {f.caminhoArquivo === planta.data?.fotoCapaUrl && (
                            <Star size={16} className="fill-white text-white drop-shadow" aria-label="Capa" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </div>

      {indice >= 0 && (
        <Visualizador
          plantaId={id}
          capaUrl={planta.data?.fotoCapaUrl}
          inspiracoes={inspiracoes.data ?? []}
          fotos={imagens}
          indice={indice}
          onTrocar={trocar}
          onFechar={fechar}
        />
      )}
    </div>
  );
}

/** Foto em tela cheia; deslizar para os lados navega entre as fotos. */
function Visualizador({
  plantaId,
  capaUrl,
  inspiracoes,
  fotos,
  indice,
  onTrocar,
  onFechar,
}: {
  plantaId: string;
  capaUrl?: string | null;
  inspiracoes: Inspiracao[];
  fotos: Foto[];
  indice: number;
  onTrocar: (f: Foto) => void;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const boxRef = useRef<HTMLDivElement>(null);
  // Índice que está na tela; evita reposicionar a rolagem quando a troca veio do próprio deslize
  const vistoRef = useRef(-1);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const atual = fotos[indice];
  const ehCapa = atual.caminhoArquivo === capaUrl;
  const ehInspiracao = inspiracoes.some((i) => i.fotoId === atual.id);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box && vistoRef.current !== indice) {
      vistoRef.current = indice;
      box.scrollLeft = indice * box.clientWidth;
    }
  }, [indice, fotos.length]);

  function irPara(i: number) {
    const box = boxRef.current;
    if (box && fotos[i]) box.scrollTo({ left: i * box.clientWidth, behavior: 'smooth' });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
      if (e.key === 'ArrowRight') irPara(vistoRef.current + 1);
      if (e.key === 'ArrowLeft') irPara(vistoRef.current - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  useEffect(() => travarScroll(), []);

  function onScroll() {
    const box = boxRef.current;
    if (!box) return;
    const i = Math.round(box.scrollLeft / box.clientWidth);
    if (i !== vistoRef.current && fotos[i]) {
      vistoRef.current = i;
      onTrocar(fotos[i]);
    }
  }

  async function definirCapa() {
    setOcupado(true);
    try {
      await plantasApi.update(plantaId, { fotoCapaUrl: atual.caminhoArquivo });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast('Capa atualizada');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setOcupado(false);
    }
  }

  async function definirInspiracao() {
    setOcupado(true);
    try {
      await inspiracoesApi.definir(plantaId, atual.id, inspiracoes);
      queryClient.invalidateQueries({ queryKey: keys.inspiracoes(plantaId) });
      toast('Inspiração definida');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    setOcupado(true);
    try {
      await fotosApi.remove(atual.id);
      const vizinha = fotos[indice + 1] ?? fotos[indice - 1];
      if (vizinha) onTrocar(vizinha);
      else onFechar();
      queryClient.invalidateQueries({ queryKey: keys.fotos(plantaId) });
      if (atual.agendaId) queryClient.invalidateQueries({ queryKey: keys.agendas });
      // Se era a capa, o servidor promove a foto mais recente
      if (ehCapa) queryClient.invalidateQueries({ queryKey: keys.plantas });
      if (ehInspiracao) queryClient.invalidateQueries({ queryKey: keys.inspiracoes(plantaId) });
      toast('Foto excluída');
      setConfirmar(false);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Foto">
      <div className="flex items-center gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <button onClick={onFechar} className="flex size-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Voltar para a galeria">
          <X size={24} />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold tabular-nums">{dataNumerica(dataDaFoto(atual))}</p>
          <p className="text-xs tabular-nums text-white/60">
            {indice + 1} de {fotos.length}
          </p>
        </div>
        <button
          onClick={() => setConfirmar(true)}
          disabled={ocupado}
          className="flex size-11 items-center justify-center rounded-full bg-danger text-white transition active:scale-90 disabled:opacity-50"
          aria-label="Excluir foto"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div ref={boxRef} onScroll={onScroll} className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none]">
        {fotos.map((f, i) => (
          <div key={f.id} className="flex size-full shrink-0 snap-center snap-always items-center justify-center">
            <img
              src={f.caminhoArquivo}
              alt={f.titulo ?? ''}
              loading={Math.abs(i - indice) <= 1 ? 'eager' : 'lazy'}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-1 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={definirCapa}
          disabled={ocupado || ehCapa}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 disabled:text-white/50"
        >
          <Star size={16} className={ehCapa ? 'fill-white/50' : ''} /> {ehCapa ? 'Foto de capa' : 'Usar como capa'}
        </button>
        <button
          onClick={definirInspiracao}
          disabled={ocupado || ehInspiracao}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 disabled:text-white/50"
        >
          <Sparkles size={16} /> {ehInspiracao ? 'Inspiração' : 'Usar como inspiração'}
        </button>
      </div>

      <ConfirmSheet open={confirmar} onClose={() => setConfirmar(false)} onConfirm={excluir} loading={ocupado} title="Excluir foto?" />
    </div>
  );
}
