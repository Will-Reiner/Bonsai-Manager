import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronRight, ImagePlus, SlidersHorizontal } from 'lucide-react';
import { Button, ErrorState, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { FilePreview, Miniaturas } from '@/components/FilePreview';
import { TriagemFotos } from '@/components/TriagemFotos';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { PlantasPicker } from '@/components/care/PlantasPicker';
import { ProximosPassos, proximosParaApi, type Proximo } from '@/components/care/ProximosPassos';
import { repetirValido } from '@/components/care/RepetirCampo';
import { AjustarPlantas } from '@/components/fluxo/AjustarPlantas';
import { FluxoLayout } from '@/components/fluxo/FluxoLayout';
import { MaisOpcoes } from '@/components/fluxo/MaisOpcoes';
import { MoverTransplanteCampo } from '@/components/fluxo/MoverTransplanteCampo';
import { QuandoCampo } from '@/components/fluxo/QuandoCampo';
import { useEtapas } from '@/components/fluxo/useEtapas';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fluxoRegistrar, resumoMaisOpcoes } from '@/lib/fluxos';
import { diasAte, fromDateInput, plantaRotulo, plantaTitulo, toDateInput } from '@/lib/format';
import { ehNova, useLoteFotos } from '@/lib/loteFotos';
import { keys, useAgendas, useAtividades, useLembrarMover, useMoverRecemTransplantada, usePlantas } from '@/lib/queries';
import { ATIVIDADE_TRANSPLANTE } from '@/types';
import { candidatasReconciliacao, rotuloUltima, textoPrazo, ultimasPorPlanta } from '@/lib/cuidados';

interface Ajuste {
  /** undefined = segue os tipos gerais */
  atividadeIds?: string[];
  detalhes: string;
  observacaoFutura: string;
}
const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '' };
const temAjuste = (aj: Ajuste) => !!(aj.atividadeIds || aj.detalhes || aj.observacaoFutura);

/** Registrar cuidado em etapas: fotos → planta de cada foto → o que foi feito → tarefas a concluir → finalizar. */
export function RegistrarPage() {
  const [params] = useSearchParams();
  const plantaFixa = params.get('planta') ?? undefined;
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const lote = useLoteFotos(plantas.data);
  const agendas = useAgendas();
  const atividades = useAtividades();

  const [salvando, setSalvando] = useState(false);
  const [triagem, setTriagem] = useState({ inicio: 0, voltarDireto: false });
  const [semFoto, setSemFoto] = useState<string[] | null>(null);
  const [escolherPlantas, setEscolherPlantas] = useState(false);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [proximos, setProximos] = useState<Proximo[]>([]);
  /** Candidatas que o usuário desmarcou (as demais são concluídas pelo registro). */
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);
  const moverPadrao = useMoverRecemTransplantada();
  const lembrarMover = useLembrarMover();
  /** null = segue a preferência (última escolha). */
  const [moverEscolha, setMoverEscolha] = useState<boolean | null>(null);
  const moverTransplante = moverEscolha ?? moverPadrao;
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
  const transplanteId = atividades.data?.find((a) => a.nome === ATIVIDADE_TRANSPLANTE)?.id;
  const comTransplante = !!transplanteId && tocadas.some((pid) => tiposDe(pid).includes(transplanteId));

  const fluxo = fluxoRegistrar({
    temFotos: lote.items.length > 0,
    temPlantas: tocadas.length > 0,
    plantaFixa: !!plantaFixa,
    temTipos: tocadas.length > 0 && tocadas.every((pid) => tiposDe(pid).length > 0),
    temCandidatas: candidatas.length > 0,
  });
  const { etapa, ir, avancar, voltar, sair } = useEtapas(fluxo, tocadas.length > 1 ? ['ajustar'] : []);
  const progresso = { etapas: fluxo.sequencia.filter((e) => e !== 'inicio' && e !== 'triagem'), atual: etapa };

  const tituloDe = (pid: string) => {
    const alvo = lote.porId.get(pid);
    return `${alvo?.identificador ? `#${alvo.identificador} · ` : ''}${alvo?.nova ? 'Planta nova' : plantaTitulo(alvo)}`;
  };
  const thumbDe = (pid: string) => {
    const foto = fotosDe(pid)[0];
    return foto ? (
      <FilePreview file={foto.item.file} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
    ) : (
      <PlantThumb url={lote.porId.get(pid)?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
    );
  };

  function escolherArquivos(files: FileList | null) {
    const lista = [...(files ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!lista.length) return;
    setSemFoto(null);
    lote.trocarArquivos(lista, plantaFixa);
    setTriagem({ inicio: 0, voltarDireto: false });
    ir(plantaFixa ? 'feito' : 'triagem');
  }

  function semFotoEm(ids: string[]) {
    lote.trocarArquivos([]);
    setSemFoto(ids);
    ir('feito');
  }

  function continuarDeFeito() {
    if (tocadas.some((pid) => !tiposDe(pid).length)) return toast('Escolha o que foi feito em cada planta.', 'error');
    avancar();
  }

  function validarFinal(): boolean {
    const erro = !tocadas.length
      ? 'Nenhuma planta escolhida.'
      : !data || data > toDateInput()
        ? 'A data não pode ser no futuro.'
        : proximos.some((p) => !p.atividadeId || !p.data || !repetirValido(p.repetir))
          ? 'Complete os próximos passos (em Mais opções).'
          : null;
    if (erro) toast(erro, 'error');
    return !erro;
  }

  function salvar() {
    if (validarFinal()) setSalvando(true);
  }

  function reenviarESalvar() {
    if (!validarFinal()) return;
    lote.reenviarFalhas();
    setSalvando(true);
  }

  // Salvar: espera os uploads, cria plantas novas e registra tudo numa chamada
  const enviandoRef = useRef(false);
  useEffect(() => {
    if (!salvando || enviandoRef.current || lote.uploadsPendentes) return;
    if (lote.falhas.length) {
      toast(`${lote.falhas.length} foto(s) não foram enviadas.`, 'error');
      setSalvando(false);
      return;
    }
    enviandoRef.current = true;
    (async () => {
      try {
        const mapa = await lote.criarPlantasNovas();
        const real = (pid: string) => mapa.get(pid) ?? pid;
        const hoje = data === toDateInput();
        await agendasApi.registrar({
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
          proximos: proximosParaApi(proximos),
          concluirAgendaIds: concluirAgendaIds.length ? concluirAgendaIds : undefined,
          moverRecemTransplantada: comTransplante && moverTransplante ? true : undefined,
        });
        if (comTransplante) lembrarMover(moverTransplante);
        queryClient.invalidateQueries({ queryKey: keys.agendas });
        queryClient.invalidateQueries({ queryKey: keys.rotinas });
        queryClient.invalidateQueries({ queryKey: ['fotos'] });
        queryClient.invalidateQueries({ queryKey: keys.plantas });
        const k = concluirAgendaIds.length;
        const extra = k ? ` · ${k === 1 ? '1 tarefa concluída' : `${k} tarefas concluídas`}` : '';
        toast(`Cuidado registrado 🌿${tocadas.length > 1 ? ` em ${tocadas.length} plantas` : ''}${extra}`);
        if (montadoRef.current) sair();
      } catch (error) {
        toast(errorMessage(error), 'error');
        // Candidata obsoleta (tarefa concluída/apagada em outro lugar): atualiza a lista para a nova tentativa
        queryClient.invalidateQueries({ queryKey: keys.agendas });
        setSalvando(false);
      } finally {
        enviandoRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salvando, lote.uploadsPendentes]);

  if (plantas.isLoading) return <Spinner />;
  // Sem a lista não dá para reconhecer os códigos: a triagem ofereceria criar plantas que já existem
  if (plantas.isError && !salvando) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title="Registrar cuidado" back />
        <ErrorState text={errorMessage(plantas.error)} onRetry={() => plantas.refetch()} />
      </div>
    );
  }

  // ───────────── Triagem ─────────────
  if (etapa === 'triagem') {
    return (
      <TriagemFotos
        key={`${triagem.inicio}-${triagem.voltarDireto}`}
        lote={lote}
        inicio={triagem.inicio}
        voltarDireto={triagem.voltarDireto}
        onFim={() => (triagem.voltarDireto ? voltar() : ir('feito'))}
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
  if (etapa === 'inicio') {
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
          <button
            onClick={() => (plantaFixa ? semFotoEm([plantaFixa]) : setEscolherPlantas(true))}
            className="mt-4 text-sm font-medium text-primary underline"
          >
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
            semFotoEm(ids);
          }}
        />
      </div>
    );
  }

  // ───────────── Ajustar plantas (desvio) ─────────────
  if (etapa === 'ajustar') {
    return (
      <FluxoLayout titulo="Ajustar plantas" rodape={<Button block onClick={voltar}>Pronto</Button>}>
        <AjustarPlantas
          itens={tocadas.map((pid) => ({
            id: pid,
            thumb: thumbDe(pid),
            titulo: tituloDe(pid),
            subtitulo: `${fotosDe(pid).length ? `${fotosDe(pid).length} foto(s)` : 'Sem foto'}${ehNova(pid) ? ' · será criada ao salvar' : ''}`,
            ajustado: temAjuste(ajuste(pid)),
          }))}
          conteudo={(pid) => {
            const aj = ajuste(pid);
            const fotos = fotosDe(pid);
            return (
              <>
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
                      ir('triagem');
                    }}
                  />
                )}
              </>
            );
          }}
        />
      </FluxoLayout>
    );
  }

  // ───────────── O que foi feito ─────────────
  if (etapa === 'feito') {
    const ajustadas = tocadas.filter((pid) => temAjuste(ajuste(pid))).length;
    return (
      <FluxoLayout titulo="O que foi feito" progresso={progresso} rodape={<Button block onClick={continuarDeFeito}>Continuar</Button>}>
        <p className="text-sm text-muted">{tocadas.length > 1 ? `${tocadas.length} plantas` : tituloDe(tocadas[0])}</p>
        <AtividadeChips
          value={atividadeIds}
          onChange={setAtividadeIds}
          label={tocadas.length > 1 ? 'Em todas as plantas' : 'Tipos de cuidado'}
          dica={dicaPara(reais)}
        />
        {tocadas.length > 1 && (
          <button type="button" onClick={() => ir('ajustar')} className="card flex w-full items-center gap-3 p-3 text-left">
            <SlidersHorizontal size={18} className="shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Fez algo diferente em alguma?</span>
              <span className={`block text-xs ${ajustadas ? 'font-medium text-primary' : 'text-muted'}`}>
                {ajustadas ? `${ajustadas} planta(s) com ajuste próprio` : 'Ajustar plantas'}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </button>
        )}
      </FluxoLayout>
    );
  }

  // ───────────── Tarefas agendadas ─────────────
  if (etapa === 'tarefas') {
    return (
      <FluxoLayout titulo="Tarefas agendadas" progresso={progresso} rodape={<Button block onClick={avancar}>Continuar</Button>}>
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
      </FluxoLayout>
    );
  }

  // ───────────── Finalizar ─────────────
  const nFotos = lote.items.filter((i) => i.plantaId).length;
  const puladas = lote.items.filter((i) => i.plantaId === null).length;
  const nomes = atividadeIds.map((id) => atividades.data?.find((a) => a.id === id)?.nome).filter(Boolean).join(', ');
  const ajustadas = tocadas.filter((pid) => temAjuste(ajuste(pid))).length;
  const resumo = resumoMaisOpcoes([
    (detalhes.trim() || Object.values(ajustes).some((a) => a.detalhes.trim())) && 'Nota',
    (observacaoFutura.trim() || Object.values(ajustes).some((a) => a.observacaoFutura.trim())) && 'Obs. para o futuro',
    comTransplante && (moverTransplante ? 'Mover p/ Recém transplantadas' : 'Não mover p/ Recém transplantadas'),
    proximos.length > 0 && (proximos.length === 1 ? '1 próximo passo' : `${proximos.length} próximos passos`),
  ]);
  return (
    <FluxoLayout
      titulo="Finalizar"
      progresso={progresso}
      rodape={
        <>
          {lote.falhas.length > 0 && !salvando && (
            <Button block variant="secondary" onClick={reenviarESalvar}>
              Reenviar {lote.falhas.length} foto(s) e salvar
            </Button>
          )}
          <Button block onClick={salvar} loading={salvando}>
            {salvando && lote.uploadsPendentes ? `Enviando fotos… ${lote.enviados}/${lote.enviaveis}` : 'Registrar'}
          </Button>
        </>
      }
    >
      <section className="card flex items-center gap-3 p-3">
        {thumbDe(tocadas[0])}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{tocadas.length > 1 ? `${tocadas.length} plantas` : tituloDe(tocadas[0])}</span>
          <span className="block truncate text-xs text-muted">
            {nFotos ? `${nFotos} foto(s)` : 'Sem foto'}
            {nomes && ` · ${nomes}`}
            {ajustadas > 0 && ` · ${ajustadas} com ajuste`}
          </span>
        </span>
      </section>
      <QuandoCampo value={data} onChange={setData} />
      <MaisOpcoes resumo={resumo} dica="Nota, observação para o futuro, próximos passos">
        <Field label="Nota">
          <textarea className="input min-h-20" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="O que foi feito" />
        </Field>
        <Field label="Obs. para o futuro" hint="Aparece em destaque no histórico da planta.">
          <textarea className="input min-h-16" value={observacaoFutura} onChange={(e) => setObservacaoFutura(e.target.value)} placeholder="Ex.: arame apertado no galho da esquerda" />
        </Field>
        {comTransplante && <MoverTransplanteCampo checked={moverTransplante} onChange={setMoverEscolha} />}
        <ProximosPassos value={proximos} onChange={setProximos} />
      </MaisOpcoes>
      {puladas > 0 && <p className="text-xs text-muted">{puladas} foto(s) puladas não serão salvas.</p>}
      {inputs}
    </FluxoLayout>
  );
}
