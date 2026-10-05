import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, CloudUpload, ImagePlus, Repeat, SkipForward, X } from 'lucide-react';
import { Button, EmptyState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { NumericKeypad } from '@/components/NumericKeypad';
import { useToast } from '@/context/ToastContext';
import { fotosApi } from '@/lib/endpoints';
import { especieNome, plantaTitulo } from '@/lib/format';
import { keys, usePlantas } from '@/lib/queries';
import { dataCapturaDe, uploadImage } from '@/lib/upload';
import type { Planta } from '@/types';

/** Limite por lote: memória do celular (Safari iOS derruba a aba com muitas imagens) e trabalho perdido se fechar. */
const MAX_FOTOS_LOTE = 50;
const CONCORRENCIA = 3;

interface Item {
  key: string;
  file: File;
  upload: 'fila' | 'enviando' | 'ok' | 'erro';
  url?: string;
  dataCaptura?: string;
  /** undefined = ainda não triada · null = pulada */
  plantaId?: string | null;
  registro?: 'ok' | 'erro';
}

type Etapa = 'triagem' | 'revisao' | 'salvando' | 'fim';

/** "007" e "7" apontam para a mesma planta. */
const normalizar = (id: string) => id.trim().replace(/^0+(?=\d)/, '');

function criarItens(files: File[]): Item[] {
  return files.slice(0, MAX_FOTOS_LOTE).map((file, i) => ({
    key: `${Date.now()}-${i}-${file.name}`,
    file,
    upload: 'fila',
  }));
}

/** Fotos em lote: o usuário escolhe várias fotos e digita o código da planta de cada uma. */
export function BatchPhotosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();

  const filesIniciais = (location.state as { files?: File[] } | null)?.files ?? [];
  const [items, setItems] = useState<Item[]>(() => criarItens(filesIniciais));
  useEffect(() => {
    if (filesIniciais.length > MAX_FOTOS_LOTE)
      toast(`Máximo de ${MAX_FOTOS_LOTE} fotos por lote — usando as primeiras.`, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [indice, setIndice] = useState(0);
  const [digitado, setDigitado] = useState('');
  const [anterior, setAnterior] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<Etapa>('triagem');
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  /** Foto aberta a partir da revisão: ao confirmar, volta direto para a revisão. */
  const [daRevisao, setDaRevisao] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const iniciados = useRef(new Set<string>());

  const porCodigo = useMemo(() => {
    const mapa = new Map<string, Planta>();
    for (const p of plantas.data ?? []) if (p.identificador) mapa.set(normalizar(p.identificador), p);
    return mapa;
  }, [plantas.data]);
  const porId = useMemo(() => new Map((plantas.data ?? []).map((p) => [p.id, p])), [plantas.data]);

  const atualizar = (key: string, patch: Partial<Item>) =>
    setItems((lista) => lista.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  // Fila de upload em segundo plano: começa assim que as fotos são escolhidas (puladas não sobem)
  useEffect(() => {
    const ativos = items.filter((i) => i.upload === 'enviando').length;
    const proximos = items
      .filter((i) => i.upload === 'fila' && i.plantaId !== null && !iniciados.current.has(i.key))
      .slice(0, Math.max(0, CONCORRENCIA - ativos));
    for (const item of proximos) {
      iniciados.current.add(item.key);
      atualizar(item.key, { upload: 'enviando' });
      Promise.all([uploadImage(item.file), dataCapturaDe(item.file)])
        .then(([url, dataCaptura]) => atualizar(item.key, { upload: 'ok', url, dataCaptura }))
        .catch(() => atualizar(item.key, { upload: 'erro' }));
    }
  }, [items]);

  const aSalvar = items.filter((i) => i.plantaId);
  const enviados = items.filter((i) => i.upload === 'ok').length;
  const enviaveis = items.filter((i) => i.plantaId !== null).length;

  // Salvamento: espera os uploads pendentes e cria os registros de foto
  const salvandoRef = useRef(false);
  useEffect(() => {
    if (etapa !== 'salvando' || salvandoRef.current) return;
    const aSalvar = items.filter((i) => i.plantaId);
    if (aSalvar.some((i) => i.upload === 'fila' || i.upload === 'enviando')) return;
    const pendentes = aSalvar.filter((i) => i.upload === 'ok' && i.registro !== 'ok');
    salvandoRef.current = true;
    Promise.all(
      pendentes.map((i) =>
        fotosApi
          .create({
            caminhoArquivo: i.url!,
            plantaId: i.plantaId,
            dataCaptura: i.dataCaptura,
          })
          .then(() => ({ key: i.key, ok: true }))
          .catch(() => ({ key: i.key, ok: false })),
      ),
    ).then((resultados) => {
      salvandoRef.current = false;
      const status = new Map(resultados.map((r) => [r.key, r.ok ? ('ok' as const) : ('erro' as const)]));
      setItems((lista) => lista.map((i) => (status.has(i.key) ? { ...i, registro: status.get(i.key) } : i)));
      new Set(pendentes.map((i) => i.plantaId!)).forEach((id) =>
        queryClient.invalidateQueries({ queryKey: keys.fotos(id) }),
      );
      setEtapa('fim');
    });
  }, [etapa, items, queryClient]);

  function adicionarArquivos(files: FileList | null) {
    if (!files?.length) return;
    const lista = [...files].filter((f) => f.type.startsWith('image/'));
    if (lista.length > MAX_FOTOS_LOTE) toast(`Máximo de ${MAX_FOTOS_LOTE} fotos por lote — usando as primeiras.`, 'error');
    setItems(criarItens(lista));
    setIndice(0);
    setEtapa('triagem');
  }

  function irPara(i: number, editando = false) {
    setDaRevisao(editando);
    setIndice(i);
    const pid = items[i]?.plantaId;
    setDigitado(pid ? (porId.get(pid)?.identificador ?? '') : '');
    setEtapa('triagem');
  }

  function avancar() {
    if (daRevisao || indice + 1 >= items.length) {
      setDaRevisao(false);
      setDigitado('');
      setEtapa('revisao');
    } else irPara(indice + 1);
  }

  function atribuir(planta: Planta | null) {
    // Uma foto pulada que recebe planta entra sozinha na fila de upload (ela ficou em 'fila')
    atualizar(items[indice].key, { plantaId: planta ? planta.id : null });
    if (planta?.identificador) setAnterior(planta.identificador);
    avancar();
  }

  function tentarDeNovo() {
    for (const i of items) {
      if (i.plantaId && i.upload === 'erro') {
        iniciados.current.delete(i.key);
        atualizar(i.key, { upload: 'fila' });
      }
    }
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
    const salvas = aSalvar.filter((i) => i.registro === 'ok');
    const falhas = aSalvar.filter((i) => i.registro === 'erro' || i.upload === 'erro');
    const nPlantas = new Set(salvas.map((i) => i.plantaId)).size;
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
              falhas.length
                ? `${falhas.length} foto(s) não foram salvas por erro de envio.`
                : items.length - aSalvar.length
                  ? `${items.length - aSalvar.length} foto(s) puladas.`
                  : undefined
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
    const grupos = new Map<string, { item: Item; i: number }[]>();
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
            <button onClick={() => irPara(items.length - 1)} className="text-sm font-semibold text-primary">
              Voltar
            </button>
          }
        />
        <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 px-4 py-4">
          <p className="text-sm text-muted">Toque numa foto para trocar a planta.</p>
          {[...grupos.entries()].map(([pid, fotos]) => {
            const p = porId.get(pid);
            return (
              <div key={pid} className="card p-3">
                <div className="mb-2 flex items-center gap-3">
                  <PlantThumb url={p?.fotoCapaUrl} className="size-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      #{p?.identificador} · {plantaTitulo(p)}
                    </p>
                    <p className="truncate text-xs text-muted">{fotos.length} foto(s)</p>
                  </div>
                </div>
                <Miniaturas fotos={fotos} onClick={(i) => irPara(i, true)} />
              </div>
            );
          })}
          {puladas.length > 0 && (
            <div className="card p-3">
              <p className="mb-2 text-sm font-semibold text-muted">Puladas ({puladas.length})</p>
              <Miniaturas fotos={puladas} onClick={(i) => irPara(i, true)} />
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
  const item = items[indice];
  const proximo = items[indice + 1];
  const match = digitado ? porCodigo.get(normalizar(digitado)) : undefined;
  const plantaAnterior = anterior ? porCodigo.get(normalizar(anterior)) : undefined;

  return (
    <div className="flex h-dvh flex-col bg-ink">
      {/* Topo */}
      <header className="pt-safe text-white">
        <div className="flex h-12 items-center gap-2 px-2">
          <button
            onClick={() => (confirmarSaida ? navigate(-1) : setConfirmarSaida(true))}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Sair"
          >
            <X size={22} />
          </button>
          <p className="flex-1 text-center text-sm font-semibold">
            {indice + 1} de {items.length}
          </p>
          <span className="flex w-16 items-center justify-end gap-1 pr-2 text-xs text-white/70" title="Fotos enviadas">
            <CloudUpload size={14} /> {enviados}/{enviaveis}
          </span>
        </div>
        {confirmarSaida && (
          <div className="flex items-center gap-2 bg-danger px-4 py-2 text-sm">
            <span className="flex-1">Sair e descartar este lote?</span>
            <button className="font-semibold underline" onClick={() => navigate(-1)}>
              Sair
            </button>
            <button className="font-semibold" onClick={() => setConfirmarSaida(false)}>
              Ficar
            </button>
          </div>
        )}
      </header>

      {/* Foto */}
      <div className="relative min-h-0 flex-1">
        <FilePreview key={item.key} file={item.file} alt={`Foto ${indice + 1}`} className="absolute inset-0 size-full object-contain" />
        {/* Pré-carrega a próxima para a troca ser instantânea */}
        {proximo && <FilePreview key={proximo.key} file={proximo.file} alt="" className="hidden" />}
        {item.upload === 'erro' && (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
            Falha no envio
          </span>
        )}
      </div>

      {/* Painel inferior */}
      <div className="rounded-t-3xl bg-bg px-3 pt-3">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex h-14 items-center gap-3 rounded-2xl bg-white px-3">
            <span className="min-w-14 text-2xl font-semibold tabular-nums text-primary-dark">
              {digitado ? `#${digitado}` : <span className="text-base font-normal text-muted">#</span>}
            </span>
            {match ? (
              <>
                <PlantThumb url={match.fotoCapaUrl} className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{plantaTitulo(match)}</p>
                  <p className="truncate text-xs text-muted">{especieNome(match.especie)}</p>
                </div>
              </>
            ) : (
              <p className={`flex-1 text-sm ${digitado ? 'text-danger' : 'text-muted'}`}>
                {digitado ? 'Nenhuma planta com esse código' : 'Digite o código da planta'}
              </p>
            )}
          </div>

          <div className="mb-2 grid grid-cols-3 gap-2">
            <button
              onClick={() => irPara(indice - 1)}
              disabled={indice === 0}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-white/60 text-sm font-medium text-ink disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              onClick={() => plantaAnterior && atribuir(plantaAnterior)}
              disabled={!plantaAnterior}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-primary-light text-sm font-semibold text-primary-dark disabled:opacity-40"
            >
              <Repeat size={16} /> {anterior ? `#${anterior}` : 'Anterior'}
            </button>
            <button
              onClick={() => atribuir(null)}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-white/60 text-sm font-medium text-muted"
            >
              Pular <SkipForward size={16} />
            </button>
          </div>

          <NumericKeypad
            value={digitado}
            onChange={setDigitado}
            onConfirm={() => match && atribuir(match)}
            confirmDisabled={!match}
          />
        </div>
        <div className="h-3" />
        <div className="pb-safe" />
      </div>
    </div>
  );
}

function Miniaturas({ fotos, onClick }: { fotos: { item: Item; i: number }[]; onClick: (i: number) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {fotos.map(({ item, i }) => (
        <button key={item.key} onClick={() => onClick(i)} className="relative shrink-0">
          <FilePreview file={item.file} alt="" className="size-16 rounded-lg object-cover" />
          {item.upload === 'erro' && <span className="absolute right-1 top-1 size-2.5 rounded-full bg-danger ring-2 ring-white" />}
        </button>
      ))}
    </div>
  );
}

/** Pré-visualização de um arquivo local. A URL blob vive enquanto o componente estiver montado. */
function FilePreview({ file, alt, className }: { file: File; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} alt={alt} className={className} />;
}
