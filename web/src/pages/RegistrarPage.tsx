import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronDown, ImagePlus } from 'lucide-react';
import { Button, ErrorState, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { FilePreview, Miniaturas } from '@/components/FilePreview';
import { TriagemFotos } from '@/components/TriagemFotos';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { PlantasPicker } from '@/components/care/PlantasPicker';
import { ProximosPassos, type Proximo } from '@/components/care/ProximosPassos';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { diasAte, fromDateInput, plantaRotulo, plantaTitulo, toDateInput } from '@/lib/format';
import { ehNova, useLoteFotos } from '@/lib/loteFotos';
import { keys, useAgendas, usePlantas } from '@/lib/queries';
import { candidatasReconciliacao, rotuloUltima, textoPrazo, ultimasPorPlanta } from '@/lib/cuidados';

interface Ajuste {
  /** undefined = segue os tipos gerais */
  atividadeIds?: string[];
  detalhes: string;
  observacaoFutura: string;
}
const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '' };

type Fase = 'inicio' | 'triagem' | 'detalhes' | 'salvando';

/** Registrar cuidado: fotos primeiro → planta de cada foto → o que foi feito (geral ou por planta). */
export function RegistrarPage() {
  const [params] = useSearchParams();
  const plantaFixa = params.get('planta') ?? undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const lote = useLoteFotos(plantas.data);
  const agendas = useAgendas();

  const [fase, setFase] = useState<Fase>('inicio');
  const [triagem, setTriagem] = useState({ inicio: 0, voltarDireto: false });
  const [semFoto, setSemFoto] = useState<string[] | null>(null);
  const [escolherPlantas, setEscolherPlantas] = useState(false);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [aberta, setAberta] = useState<string | null>(null);
  const [proximos, setProximos] = useState<Proximo[]>([]);
  /** Candidatas que o usuário desmarcou (as demais são concluídas pelo registro). */
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);
  const ultimas = useMemo(() => ultimasPorPlanta(agendas.data ?? []), [agendas.data]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  /** Volta para a tela anterior; aberta por link direto (sem histórico no app), vai para a Bancada. */
  function voltar() {
    if (location.key === 'default') navigate('/', { replace: true });
    else navigate(-1);
  }

  // Plantas tocadas: as das fotos (na ordem da 1ª foto) ou as escolhidas sem foto
  const tocadas = semFoto ?? [...new Set(lote.items.map((i) => i.plantaId).filter((p): p is string => !!p))];
  const fotosDe = (pid: string) => lote.items.map((item, i) => ({ item, i })).filter(({ item }) => item.plantaId === pid);
  const ajuste = (pid: string) => ajustes[pid] ?? AJUSTE_VAZIO;
  const setAjuste = (pid: string, patch: Partial<Ajuste>) => setAjustes((a) => ({ ...a, [pid]: { ...ajuste(pid), ...patch } }));
  const tiposDe = (pid: string) => ajuste(pid).atividadeIds ?? atividadeIds;
  // Plantas novas (criadas só ao salvar) não têm histórico nem tarefas
  const reais = tocadas.filter((pid) => !ehNova(pid));
  const dicaPara = (pids: string[]) =>
    agendas.data && pids.length ? (aid: string) => rotuloUltima(pids.map((p) => ultimas.get(p)?.get(aid))) : undefined;
  const candidatas = candidatasReconciliacao(
    agendas.data ?? [],
    reais.map((pid) => ({ plantaId: pid, atividadeIds: tiposDe(pid) })),
  );
  const concluirAgendaIds = candidatas.filter((a) => !desmarcadas.includes(a.id)).map((a) => a.id);

  function escolherArquivos(files: FileList | null) {
    const lista = [...(files ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!lista.length) return;
    setSemFoto(null);
    lote.trocarArquivos(lista, plantaFixa);
    if (plantaFixa) setFase('detalhes');
    else {
      setTriagem({ inicio: 0, voltarDireto: false });
      setFase('triagem');
    }
  }

  function registrarSemFoto() {
    if (plantaFixa) {
      setSemFoto([plantaFixa]);
      setFase('detalhes');
    } else setEscolherPlantas(true);
  }

  function validar(): boolean {
    const erro = !tocadas.length
      ? 'Nenhuma planta escolhida.'
      : tocadas.some((pid) => !tiposDe(pid).length)
        ? 'Escolha o que foi feito em cada planta.'
        : !data || data > toDateInput()
          ? 'A data não pode ser no futuro.'
          : proximos.some((p) => !p.atividadeId || !p.data)
            ? 'Complete os próximos passos.'
            : null;
    if (erro) toast(erro, 'error');
    return !erro;
  }

  function salvar() {
    if (validar()) setFase('salvando');
  }

  function reenviarESalvar() {
    if (!validar()) return;
    lote.reenviarFalhas();
    setFase('salvando');
  }

  // Salvar: espera os uploads, cria plantas novas e registra tudo numa chamada
  const enviandoRef = useRef(false);
  useEffect(() => {
    if (fase !== 'salvando' || enviandoRef.current || lote.uploadsPendentes) return;
    if (lote.falhas.length) {
      toast(`${lote.falhas.length} foto(s) não foram enviadas.`, 'error');
      setFase('detalhes');
      return;
    }
    enviandoRef.current = true;
    (async () => {
      try {
        const mapa = await lote.criarPlantasNovas();
        const real = (pid: string) => mapa.get(pid) ?? pid;
        const hoje = data === toDateInput();
        const resultado = await agendasApi.registrar({
          data: hoje ? new Date().toISOString() : fromDateInput(data),
          plantas: tocadas.map((pid) => ({
            plantaId: real(pid),
            atividadeIds: tiposDe(pid),
            detalhes: (ajuste(pid).detalhes || detalhes).trim() || undefined,
            observacaoFutura: (ajuste(pid).observacaoFutura || observacaoFutura).trim() || undefined,
            fotos: fotosDe(pid)
              .filter(({ item }) => item.url)
              .map(({ item }) => ({ caminhoArquivo: item.url!, dataCaptura: item.dataCaptura })),
          })),
          proximos: proximos.length
            ? proximos.map((p) => ({ atividadeId: p.atividadeId, dataAgendada: fromDateInput(p.data) }))
            : undefined,
          concluirAgendaIds: concluirAgendaIds.length ? concluirAgendaIds : undefined,
        });
        queryClient.invalidateQueries({ queryKey: keys.agendas });
        queryClient.invalidateQueries({ queryKey: ['fotos'] });
        queryClient.invalidateQueries({ queryKey: keys.plantas });
        const n = resultado.revisoes.length;
        const k = concluirAgendaIds.length;
        const extras = [
          n ? (n === 1 ? 'Revisão geral agendada' : `${n} revisões agendadas`) : '',
          k ? (k === 1 ? '1 tarefa concluída' : `${k} tarefas concluídas`) : '',
        ].filter(Boolean);
        toast(`Cuidado registrado 🌿${tocadas.length > 1 ? ` em ${tocadas.length} plantas` : ''}${extras.map((e) => ` · ${e}`).join('')}`);
        if (montadoRef.current) voltar();
      } catch (error) {
        toast(errorMessage(error), 'error');
        // Candidata obsoleta (tarefa concluída/apagada em outro lugar): atualiza a lista para a nova tentativa
        queryClient.invalidateQueries({ queryKey: keys.agendas });
        setFase('detalhes');
      } finally {
        enviandoRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, lote.uploadsPendentes]);

  if (plantas.isLoading) return <Spinner />;
  // Sem a lista não dá para reconhecer os códigos: a triagem ofereceria criar plantas que já existem
  if (plantas.isError && fase !== 'salvando') {
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Registrar cuidado" back />
        <ErrorState text={errorMessage(plantas.error)} onRetry={() => plantas.refetch()} />
      </div>
    );
  }

  // ───────────── Triagem ─────────────
  if (fase === 'triagem') {
    return (
      <TriagemFotos
        key={`${triagem.inicio}-${triagem.voltarDireto}`}
        lote={lote}
        inicio={triagem.inicio}
        voltarDireto={triagem.voltarDireto}
        onFim={() => setFase('detalhes')}
        onSair={voltar}
      />
    );
  }

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ''; }} />
      <input ref={galeriaRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ''; }} />
    </>
  );

  // ───────────── Início ─────────────
  if (fase === 'inicio') {
    const fixa = plantas.data?.find((p) => p.id === plantaFixa);
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Registrar cuidado" back />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-6 pb-16">
          {fixa && <p className="mb-2 text-center text-sm text-muted">{plantaTitulo(fixa)}</p>}
          <p className="mb-2 text-center text-lg font-semibold">Comece pelas fotos</p>
          <Button block onClick={() => cameraRef.current?.click()}>
            <Camera size={18} /> Tirar foto
          </Button>
          <Button block variant="secondary" onClick={() => galeriaRef.current?.click()}>
            <ImagePlus size={18} /> Escolher da galeria
          </Button>
          <button onClick={registrarSemFoto} className="mt-4 text-sm font-medium text-primary underline">
            Registrar sem foto
          </button>
        </div>
        {inputs}
        <PlantasPicker
          open={escolherPlantas}
          onClose={() => setEscolherPlantas(false)}
          selecionadas={[]}
          titulo="Em quais plantas?"
          onConfirmar={(ids) => {
            setEscolherPlantas(false);
            setSemFoto(ids);
            setFase('detalhes');
          }}
        />
      </div>
    );
  }

  // ───────────── O que foi feito ─────────────
  return (
    <div className="min-h-dvh pb-32">
      <PageHeader title="O que foi feito" back />
      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
        <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} label={tocadas.length > 1 ? 'Em todas as plantas' : 'Tipos de cuidado'} dica={dicaPara(reais)} />

        <Field label="Quando">
          <input type="date" className="input" value={data} max={toDateInput()} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Nota (opcional)">
          <textarea className="input min-h-20" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="O que foi feito" />
        </Field>
        <Field label="Obs. para o futuro (opcional)" hint="Aparece em destaque no histórico da planta.">
          <textarea className="input min-h-16" value={observacaoFutura} onChange={(e) => setObservacaoFutura(e.target.value)} placeholder="Ex.: arame apertado no galho da esquerda" />
        </Field>

        <section>
          <span className="label">{tocadas.length > 1 ? `Plantas (${tocadas.length})` : 'Planta'}</span>
          <div className="space-y-2">
            {tocadas.map((pid) => {
              const alvo = lote.porId.get(pid);
              const fotos = fotosDe(pid);
              const aj = ajuste(pid);
              const proprio = !!(aj.atividadeIds || aj.detalhes || aj.observacaoFutura);
              return (
                <div key={pid} className="card overflow-hidden">
                  <button type="button" onClick={() => setAberta(aberta === pid ? null : pid)} className="flex w-full items-center gap-3 p-2.5 text-left" aria-expanded={aberta === pid}>
                    {fotos[0] ? (
                      <FilePreview file={fotos[0].item.file} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <PlantThumb url={alvo?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {alvo?.identificador ? `#${alvo.identificador} · ` : ''}
                        {alvo?.nova ? 'Planta nova' : plantaTitulo(alvo)}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {fotos.length ? `${fotos.length} foto(s)` : 'Sem foto'}
                        {ehNova(pid) && ' · será criada ao salvar'}
                      </span>
                      {proprio && <span className="text-xs font-medium text-primary">Com ajuste próprio</span>}
                    </span>
                    <ChevronDown size={20} className={`shrink-0 text-muted transition ${aberta === pid ? 'rotate-180' : ''}`} />
                  </button>
                  {aberta === pid && (
                    <div className="space-y-3 border-t border-line p-3">
                      <AtividadeChips value={tiposDe(pid)} onChange={(ids) => setAjuste(pid, { atividadeIds: ids })} label="O que foi feito nesta" dica={dicaPara(ehNova(pid) ? [] : [pid])} />
                      {aj.atividadeIds && (
                        <button type="button" className="text-xs font-medium text-primary" onClick={() => setAjuste(pid, { atividadeIds: undefined })}>
                          Usar os cuidados gerais
                        </button>
                      )}
                      <Field label="Nota desta planta">
                        <textarea className="input min-h-16" value={aj.detalhes} onChange={(e) => setAjuste(pid, { detalhes: e.target.value })} placeholder={detalhes || 'Substitui a nota geral'} />
                      </Field>
                      <Field label="Obs. desta planta">
                        <textarea className="input min-h-16" value={aj.observacaoFutura} onChange={(e) => setAjuste(pid, { observacaoFutura: e.target.value })} placeholder={observacaoFutura || 'Substitui a obs. geral'} />
                      </Field>
                      {!!fotos.length && !plantaFixa && (
                        <Miniaturas
                          fotos={fotos}
                          onClick={(i) => {
                            setTriagem({ inicio: i, voltarDireto: true });
                            setFase('triagem');
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {lote.items.some((i) => i.plantaId === null) && (
            <p className="mt-2 text-xs text-muted">{lote.items.filter((i) => i.plantaId === null).length} foto(s) puladas não serão salvas.</p>
          )}
        </section>

        {candidatas.length > 0 && (
          <section>
            <span className="label">Tarefas que serão concluídas</span>
            <div className="space-y-2">
              {candidatas.map((a) => {
                const marcada = !desmarcadas.includes(a.id);
                return (
                  <label key={a.id} className="card flex cursor-pointer items-center gap-3 p-3">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={marcada}
                      onChange={() => setDesmarcadas((d) => (marcada ? [...d, a.id] : d.filter((x) => x !== a.id)))}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {a.atividade?.nome ?? 'Cuidado'} · {plantaRotulo(a.planta)}
                      </span>
                      <span className={`block text-xs ${diasAte(a.dataAgendada) < 0 ? 'font-semibold text-danger' : 'text-muted'}`}>
                        {textoPrazo(a.dataAgendada)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Desmarque se a tarefa ainda precisa ser feita.</p>
          </section>
        )}

        <ProximosPassos value={proximos} onChange={setProximos} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto mb-3 max-w-2xl space-y-2">
          {lote.falhas.length > 0 && fase !== 'salvando' && (
            <Button block variant="secondary" onClick={reenviarESalvar}>
              Reenviar {lote.falhas.length} foto(s) e salvar
            </Button>
          )}
          <Button block onClick={salvar} loading={fase === 'salvando'}>
            {fase === 'salvando' && lote.uploadsPendentes ? `Enviando fotos… ${lote.enviados}/${lote.enviaveis}` : 'Registrar'}
          </Button>
        </div>
      </div>
      {inputs}
    </div>
  );
}
