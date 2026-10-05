import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, ImagePlus } from 'lucide-react';
import { Button, EmptyState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { Miniaturas } from '@/components/FilePreview';
import { TriagemFotos } from '@/components/TriagemFotos';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { fotosApi } from '@/lib/endpoints';
import { plantaTitulo } from '@/lib/format';
import { ehNova, MAX_FOTOS_LOTE, useLoteFotos, type ItemFoto } from '@/lib/loteFotos';
import { keys, usePlantas } from '@/lib/queries';

type Etapa = 'triagem' | 'revisao' | 'salvando' | 'fim';

/** Fotos em lote: o usuário escolhe várias fotos e digita o código da planta de cada uma. */
export function BatchPhotosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();

  const filesIniciais = (location.state as { files?: File[] } | null)?.files ?? [];
  const lote = useLoteFotos(plantas.data, filesIniciais);
  const { items } = lote;
  useEffect(() => {
    if (filesIniciais.length > MAX_FOTOS_LOTE)
      toast(`Máximo de ${MAX_FOTOS_LOTE} fotos por lote — usando as primeiras.`, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [etapa, setEtapa] = useState<Etapa>('triagem');
  const [triagem, setTriagem] = useState<{ inicio: number; voltarDireto: boolean }>({ inicio: 0, voltarDireto: false });
  const [registros, setRegistros] = useState<Record<string, 'ok' | 'erro'>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const aSalvar = items.filter((i) => i.plantaId);

  // Salvamento: espera os uploads pendentes, cria plantas novas e os registros de foto
  const salvandoRef = useRef(false);
  useEffect(() => {
    if (etapa !== 'salvando' || salvandoRef.current || lote.uploadsPendentes) return;
    salvandoRef.current = true;
    (async () => {
      let mapa = new Map<string, string>();
      try {
        mapa = await lote.criarPlantasNovas();
      } catch (error) {
        toast(errorMessage(error, 'Não foi possível criar a planta nova.'), 'error');
        salvandoRef.current = false;
        setEtapa('revisao');
        return;
      }
      const real = (pid: string) => mapa.get(pid) ?? pid;
      const pendentes = lote.items.filter((i) => i.plantaId && i.upload === 'ok' && registros[i.key] !== 'ok');
      const resultados = await Promise.all(
        pendentes.map((i) =>
          fotosApi
            .create({ caminhoArquivo: i.url!, plantaId: real(i.plantaId!), dataCaptura: i.dataCaptura })
            .then(() => [i.key, 'ok'] as const)
            .catch(() => [i.key, 'erro'] as const),
        ),
      );
      setRegistros((r) => ({ ...r, ...Object.fromEntries(resultados) }));
      new Set(pendentes.map((i) => real(i.plantaId!))).forEach((id) =>
        queryClient.invalidateQueries({ queryKey: keys.fotos(id) }),
      );
      salvandoRef.current = false;
      setEtapa('fim');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, lote.uploadsPendentes]);

  function adicionarArquivos(files: FileList | null) {
    if (!files?.length) return;
    const lista = [...files].filter((f) => f.type.startsWith('image/'));
    if (lista.length > MAX_FOTOS_LOTE) toast(`Máximo de ${MAX_FOTOS_LOTE} fotos por lote — usando as primeiras.`, 'error');
    lote.trocarArquivos(lista);
    setTriagem({ inicio: 0, voltarDireto: false });
    setEtapa('triagem');
  }

  function tentarDeNovo() {
    lote.reenviarFalhas();
    setEtapa('salvando');
  }

  // ───────────── Sem fotos: seletor ─────────────
  if (!items.length) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Fotos em lote" back />
        <EmptyState
          icon={<ImagePlus size={26} />}
          title="Escolha as fotos"
          text={`Selecione até ${MAX_FOTOS_LOTE} fotos. Depois é só digitar o código da planta de cada uma.`}
          action={<Button onClick={() => inputRef.current?.click()}>Escolher fotos</Button>}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            adicionarArquivos(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  if (plantas.isLoading) return <Spinner />;

  // ───────────── Fim ─────────────
  if (etapa === 'fim' || etapa === 'salvando') {
    const salvas = aSalvar.filter((i) => registros[i.key] === 'ok');
    const falhas = aSalvar.filter((i) => registros[i.key] === 'erro' || i.upload === 'erro');
    const nPlantas = new Set(salvas.map((i) => i.plantaId)).size;
    const nNovas = new Set(aSalvar.filter((i) => ehNova(i.plantaId)).map((i) => i.plantaId)).size;
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Fotos em lote" />
        {etapa === 'salvando' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <Spinner label="Salvando fotos…" />
            <p className="text-sm text-muted">
              Enviadas {aSalvar.filter((i) => i.upload === 'ok').length} de {aSalvar.length}
            </p>
          </div>
        ) : (
          <EmptyState
            icon={falhas.length ? <AlertCircle size={26} /> : <CheckCircle2 size={26} />}
            title={`${salvas.length} foto(s) salvas em ${nPlantas} planta(s)`}
            text={
              [
                falhas.length
                  ? `${falhas.length} foto(s) não foram salvas por erro de envio.`
                  : items.length - aSalvar.length
                    ? `${items.length - aSalvar.length} foto(s) puladas.`
                    : undefined,
                nNovas ? `${nNovas} planta(s) nova(s) criada(s) — complete a espécie na Coleção.` : undefined,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            action={
              <div className="flex flex-col gap-2">
                {falhas.length > 0 && <Button onClick={tentarDeNovo}>Tentar de novo</Button>}
                <Button variant={falhas.length ? 'secondary' : 'primary'} onClick={() => navigate('/colecao', { replace: true })}>
                  Voltar para a coleção
                </Button>
              </div>
            }
          />
        )}
      </div>
    );
  }

  // ───────────── Revisão ─────────────
  if (etapa === 'revisao') {
    const grupos = new Map<string, { item: ItemFoto; i: number }[]>();
    items.forEach((item, i) => {
      if (!item.plantaId) return;
      grupos.set(item.plantaId, [...(grupos.get(item.plantaId) ?? []), { item, i }]);
    });
    const puladas = items.map((item, i) => ({ item, i })).filter(({ item }) => item.plantaId === null);
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader
          title="Revisar"
          right={
            <button
              onClick={() => {
                setTriagem({ inicio: lote.items.length - 1, voltarDireto: false });
                setEtapa('triagem');
              }}
              className="text-sm font-semibold text-primary"
            >
              Voltar
            </button>
          }
        />
        <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 px-4 py-4">
          <p className="text-sm text-muted">Toque numa foto para trocar a planta.</p>
          {[...grupos.entries()].map(([pid, fotos]) => {
            const p = lote.porId.get(pid);
            return (
              <div key={pid} className="card p-3">
                <div className="mb-2 flex items-center gap-3">
                  <PlantThumb url={p?.fotoCapaUrl} className="size-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-semibold">
                      #{p?.identificador} · {plantaTitulo(p)}
                      {ehNova(pid) && <span className="chip py-0.5 text-xs">Nova</span>}
                    </p>
                    <p className="truncate text-xs text-muted">{fotos.length} foto(s)</p>
                  </div>
                </div>
                <Miniaturas fotos={fotos} onClick={(i) => {
                  setTriagem({ inicio: i, voltarDireto: true });
                  setEtapa('triagem');
                }} />
              </div>
            );
          })}
          {puladas.length > 0 && (
            <div className="card p-3">
              <p className="mb-2 text-sm font-semibold text-muted">Puladas ({puladas.length})</p>
              <Miniaturas fotos={puladas} onClick={(i) => {
                  setTriagem({ inicio: i, voltarDireto: true });
                  setEtapa('triagem');
                }} />
            </div>
          )}
        </div>
        <div className="sticky bottom-0 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur">
          <div className="mx-auto max-w-2xl pb-3">
            <Button block disabled={!aSalvar.length} onClick={() => setEtapa('salvando')}>
              Salvar {aSalvar.length} foto(s)
            </Button>
          </div>
          <div className="pb-safe" />
        </div>
      </div>
    );
  }

  // ───────────── Triagem ─────────────
  return (
    <TriagemFotos
      key={`${triagem.inicio}-${triagem.voltarDireto}`}
      lote={lote}
      inicio={triagem.inicio}
      voltarDireto={triagem.voltarDireto}
      onFim={() => setEtapa('revisao')}
      onSair={() => navigate(-1)}
    />
  );
}
