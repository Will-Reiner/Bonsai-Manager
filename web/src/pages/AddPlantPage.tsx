import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Check, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { Button, Field, PageHeader } from '@/components/ui';
import { PhotoInput } from '@/components/PhotoInput';
import { SpeciesPicker } from '@/components/SpeciesPicker';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { fotosApi, plantasApi } from '@/lib/endpoints';
import { especieNome, fromDateInput, plantaTitulo, toDateInput } from '@/lib/format';
import { keys, useEspecies } from '@/lib/queries';
import { dataCapturaDe, MAX_FOTOS_POR_VEZ, uploadImage } from '@/lib/upload';
import { MODOS_AQUISICAO, type ModoAquisicao, type Planta } from '@/types';

const PASSOS = ['Espécie', 'Identidade', 'Aquisição', 'Fotos', 'Capa'];
const MAX_FOTOS = MAX_FOTOS_POR_VEZ;
const CONCORRENCIA = 3;

/** Executa `fn` para cada item com no máximo `limite` em paralelo, preservando a ordem do resultado. */
async function emParalelo<T, R>(itens: T[], limite: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultado: R[] = new Array(itens.length);
  let proximo = 0;
  const trabalhador = async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      resultado[i] = await fn(itens[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultado;
}

/** Cadastro em passos curtos — só a espécie é obrigatória (UX_FRONTEND.md §4.4). */
export function AddPlantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const especies = useEspecies();

  const [passo, setPasso] = useState(0);
  const [especieId, setEspecieId] = useState('');
  const [nome, setNome] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [modo, setModo] = useState<ModoAquisicao | ''>('');
  /** Fotos da galeria — a capa é escolhida entre elas no passo seguinte. */
  const [fotos, setFotos] = useState<File[]>([]);
  const [capaIndice, setCapaIndice] = useState(0);
  /** Capa avulsa, usada só quando nenhuma foto foi adicionada. */
  const [foto, setFoto] = useState<File | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [enviadas, setEnviadas] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [criada, setCriada] = useState<Planta | null>(null);

  const especie = especies.data?.find((e) => e.id === especieId);
  const ultimo = passo === PASSOS.length - 1;

  function resetar() {
    setPasso(0);
    setEspecieId('');
    setNome('');
    setIdentificador('');
    setDataAquisicao('');
    setModo('');
    setFotos([]);
    setCapaIndice(0);
    setFoto(null);
    setCriada(null);
  }

  async function salvar() {
    setSalvando(true);
    try {
      let fotoCapaUrl: string | undefined;
      let galeria: { url: string; dataCaptura: string }[] = [];
      if (fotos.length) {
        setEnviadas(0);
        galeria = await emParalelo(fotos, CONCORRENCIA, async (file) => {
          const [url, { data: dataCaptura }] = await Promise.all([uploadImage(file), dataCapturaDe(file)]);
          setEnviadas((n) => (n ?? 0) + 1);
          return { url, dataCaptura };
        });
        fotoCapaUrl = galeria[capaIndice]?.url;
      } else if (foto) {
        fotoCapaUrl = await uploadImage(foto, setProgresso);
      }
      const planta = await plantasApi.create({
        especieId,
        nome: nome.trim() || undefined,
        identificador: identificador.trim() || undefined,
        dataAquisicao: dataAquisicao ? fromDateInput(dataAquisicao) : null,
        modoAquisicao: modo || null,
        fotoCapaUrl,
      });
      if (galeria.length) {
        const resultados = await Promise.allSettled(
          galeria.map((g) => fotosApi.create({ caminhoArquivo: g.url, plantaId: planta.id, dataCaptura: g.dataCaptura })),
        );
        const falhas = resultados.filter((r) => r.status === 'rejected').length;
        if (falhas) toast(`${falhas} foto(s) não foram salvas na galeria.`, 'error');
        queryClient.invalidateQueries({ queryKey: keys.fotos(planta.id) });
      }
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      setCriada(planta);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
      setProgresso(null);
      setEnviadas(null);
    }
  }

  function adicionarFotos(files: FileList | null) {
    const novas = [...(files ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!novas.length) return;
    const total = [...fotos, ...novas];
    if (total.length > MAX_FOTOS) toast(`Máximo de ${MAX_FOTOS} fotos no cadastro — usando as primeiras.`, 'error');
    setFotos(total.slice(0, MAX_FOTOS));
  }

  function removerFoto(i: number) {
    setFotos(fotos.filter((_, j) => j !== i));
    // Mantém a capa apontando para a mesma foto (ou volta para a primeira se ela foi removida)
    if (i === capaIndice) setCapaIndice(0);
    else if (i < capaIndice) setCapaIndice(capaIndice - 1);
  }

  if (criada) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 size={56} className="text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">{plantaTitulo({ ...criada, especie: criada.especie ?? especie })} na coleção!</h1>
        <p className="mt-1 text-muted">Que tal agendar o primeiro cuidado?</p>
        <div className="mt-8 grid w-full max-w-xs gap-3">
          <Button onClick={() => navigate(`/plantas/${criada.id}`, { replace: true })}>Ver planta</Button>
          <Button variant="secondary" onClick={resetar}>
            Adicionar mais uma
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="Nova planta" back />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32">
        <ol className="mb-6 mt-4 flex gap-1.5" aria-label="Progresso">
          {PASSOS.map((p, i) => (
            <li key={p} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= passo ? 'bg-primary' : 'bg-line'}`} />
              <span className={`mt-1.5 block text-[11px] font-medium ${i === passo ? 'text-primary' : 'text-muted'}`}>{p}</span>
            </li>
          ))}
        </ol>

        {passo === 0 && (
          <section>
            <h2 className="mb-1 text-2xl font-semibold">Qual é a espécie?</h2>
            <p className="mb-4 text-sm text-muted">Os dados de cultivo vêm da espécie.</p>
            <SpeciesPicker value={especieId} onChange={setEspecieId} />
          </section>
        )}

        {passo === 1 && (
          <section className="space-y-4">
            <div>
              <h2 className="mb-1 text-2xl font-semibold">Como você chama ela?</h2>
              <p className="text-sm text-muted">Opcional — use um apelido, um código de etiqueta, ou os dois.</p>
            </div>
            <Field label="Apelido">
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={`Ex.: ${especieNome(especie)} da varanda`} />
            </Field>
            <Field label="Código / etiqueta" hint="Único na sua coleção">
              <input className="input" value={identificador} onChange={(e) => setIdentificador(e.target.value)} placeholder="Ex.: JB-03" />
            </Field>
          </section>
        )}

        {passo === 2 && (
          <section className="space-y-4">
            <div>
              <h2 className="mb-1 text-2xl font-semibold">Como ela chegou?</h2>
              <p className="text-sm text-muted">Opcional — ajuda a calcular a idade na coleção.</p>
            </div>
            <Field label="Data de aquisição">
              <input type="date" className="input" value={dataAquisicao} max={toDateInput()} onChange={(e) => setDataAquisicao(e.target.value)} />
            </Field>
            <div>
              <span className="label">Modo de aquisição</span>
              <div className="flex flex-wrap gap-2">
                {MODOS_AQUISICAO.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`chip ${modo === m.value ? 'chip-active' : ''}`}
                    onClick={() => setModo(modo === m.value ? '' : m.value)}
                    aria-pressed={modo === m.value}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {passo === 3 && (
          <section>
            <h2 className="mb-1 text-2xl font-semibold">Fotos da planta</h2>
            <p className="mb-4 text-sm text-muted">
              Vão para a galeria dela. No próximo passo você escolhe a capa. Dá para pular.{' '}
              <span className={fotos.length >= MAX_FOTOS ? 'font-semibold text-ink' : ''}>
                {fotos.length ? `${fotos.length} de ${MAX_FOTOS} fotos.` : `Até ${MAX_FOTOS} fotos — depois dá para adicionar mais pela galeria.`}
              </span>
            </p>
            <SeletorFotos fotos={fotos} onAdd={adicionarFotos} onRemove={removerFoto} />
          </section>
        )}

        {passo === 4 && (
          <section>
            <h2 className="mb-1 text-2xl font-semibold">Uma foto de capa</h2>
            {fotos.length ? (
              <>
                <p className="mb-4 text-sm text-muted">Toque na foto que vai aparecer na coleção.</p>
                <div className="grid grid-cols-3 gap-2">
                  {fotos.map((f, i) => (
                    <button
                      key={`${i}-${f.name}-${f.lastModified}`}
                      type="button"
                      onClick={() => setCapaIndice(i)}
                      aria-pressed={i === capaIndice}
                      className={`relative aspect-square overflow-hidden rounded-xl ring-offset-2 ring-offset-bg ${i === capaIndice ? 'ring-3 ring-primary' : ''}`}
                    >
                      <FilePreview file={f} className="size-full object-cover" />
                      {i === capaIndice && (
                        <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted">Fica mais fácil reconhecer na coleção. Dá para pular.</p>
                <PhotoInput file={foto} onChange={setFoto} label="Tirar ou escolher foto" aspect="aspect-square" />
              </>
            )}
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3">
          {passo > 0 && (
            <Button variant="secondary" onClick={() => setPasso(passo - 1)} disabled={salvando}>
              Voltar
            </Button>
          )}
          {ultimo ? (
            <Button block onClick={salvar} loading={salvando}>
              {enviadas !== null
                ? `Enviando fotos… ${enviadas}/${fotos.length}`
                : progresso !== null
                  ? `Enviando foto… ${progresso}%`
                  : fotos.length || foto
                    ? 'Salvar planta'
                    : 'Salvar sem foto'}
            </Button>
          ) : (
            <Button block onClick={() => setPasso(passo + 1)} disabled={passo === 0 && !especieId}>
              {passo === 0 ? 'Continuar' : passo === 3 && !fotos.length ? 'Pular' : 'Próximo'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SeletorFotos({ fotos, onAdd, onRemove }: { fotos: File[]; onAdd: (files: FileList | null) => void; onRemove: (i: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const tile =
    'flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-white text-muted transition hover:border-primary hover:text-primary';
  return (
    <div className="grid grid-cols-3 gap-2">
      {fotos.map((f, i) => (
        <div key={`${i}-${f.name}-${f.lastModified}`} className="relative aspect-square overflow-hidden rounded-xl">
          <FilePreview file={f} className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-white/90 text-ink"
            aria-label="Remover foto"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {fotos.length >= MAX_FOTOS ? (
        <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line px-2 text-center text-muted">
          <span className="text-sm font-medium">Limite de {MAX_FOTOS}</span>
          <span className="text-[11px] leading-tight">Adicione mais pela galeria depois</span>
        </div>
      ) : fotos.length ? (
        <div className="grid aspect-square grid-rows-2 gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} className={tile}>
            <Camera size={18} />
            <span className="text-xs font-medium">Câmera</span>
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} className={tile}>
            <ImagePlus size={18} />
            <span className="text-xs font-medium">Galeria</span>
          </button>
        </div>
      ) : (
        <div className="col-span-3 grid aspect-[4/3] grid-cols-2 gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} className={tile}>
            <Camera size={28} />
            <span className="text-sm font-medium">Tirar foto</span>
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} className={tile}>
            <ImagePlus size={28} />
            <span className="text-sm font-medium">Escolher da galeria</span>
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** Pré-visualização de um arquivo local. A URL blob vive enquanto o componente estiver montado. */
function FilePreview({ file, className }: { file: File; className?: string }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt="" className={className} />;
}
