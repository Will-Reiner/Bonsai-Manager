import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import { Button, EmptyState, ErrorState, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { ProximosPassos, proximosParaApi, type Proximo } from '@/components/care/ProximosPassos';
import { repetirValido } from '@/components/care/RepetirCampo';
import { PhotoInput } from '@/components/PhotoInput';
import { AjustarPlantas } from '@/components/fluxo/AjustarPlantas';
import { FluxoLayout } from '@/components/fluxo/FluxoLayout';
import { MaisOpcoes } from '@/components/fluxo/MaisOpcoes';
import { MoverTransplanteCampo } from '@/components/fluxo/MoverTransplanteCampo';
import { QuandoCampo } from '@/components/fluxo/QuandoCampo';
import { useEtapas } from '@/components/fluxo/useEtapas';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fluxoConcluir, resumoMaisOpcoes } from '@/lib/fluxos';
import { fromDateInput, plantaNome, plantaRotulo, toDateInput } from '@/lib/format';
import { detalhesFinais, dicaDescricao, preencherInstrucoes, textoEditado } from '@/lib/instrucao';
import { keys, useAgendas, useAtividadesOrdenadas, useLembrarMover, useMoverRecemTransplantada } from '@/lib/queries';
import { ATIVIDADE_TRANSPLANTE } from '@/types';
import { uploadImage } from '@/lib/upload';

interface Ajuste {
  detalhes: string;
  /** false = a descrição mostra a instrução da tarefa (pré-preenchida) */
  detalhesEditado?: boolean;
  observacaoFutura: string;
  foto: File | null;
}

const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '', foto: null };
const temAjuste = (aj: Ajuste) => !!(aj.detalhes || aj.observacaoFutura || aj.foto);

/** Concluir uma tarefa ou um grupo em etapas: procedimento → finalizar (+ desvio Ajustar plantas). */
export function ConcluirPage() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const agendas = useAgendas();
  const atividades = useAtividadesOrdenadas();

  const ids = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean), [params]);
  const tarefas = useMemo(
    () => (agendas.data ?? []).filter((a) => ids.includes(a.id) && a.status === 'PENDENTE'),
    [agendas.data, ids],
  );

  const [desmarcadas, setDesmarcadas] = useState<Set<string>>(new Set());
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [trocarAtividade, setTrocarAtividade] = useState(false);
  const [atividadeId, setAtividadeId] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [escolherExtra, setEscolherExtra] = useState(false);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [detalhesEditado, setDetalhesEditado] = useState(false);
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [proximos, setProximos] = useState<Proximo[]>([]);
  const moverPadrao = useMoverRecemTransplantada();
  const lembrarMover = useLembrarMover();
  const [moverEscolha, setMoverEscolha] = useState<boolean | null>(null);
  const moverTransplante = moverEscolha ?? moverPadrao;
  const [salvando, setSalvando] = useState(false);

  const marcadas = tarefas.filter((t) => !desmarcadas.has(t.id));
  // Descrição vem com a instrução do agendamento: igual em todas → geral; diferentes → no ajuste de cada tarefa
  const instrucoes = preencherInstrucoes(marcadas, (t) => t.id);
  const valorDetalhes = detalhesEditado ? detalhes : instrucoes.geral;
  const instrucaoDe = (id: string) => instrucoes.porChave[id] ?? '';
  const atividadeAtual = tarefas[0]?.atividade;
  const nomeAtividade = (id: string) => atividades.data.find((a) => a.id === id)?.nome ?? '…';
  const transplanteId = atividades.data.find((a) => a.nome === ATIVIDADE_TRANSPLANTE)?.id;
  const comTransplante =
    !!transplanteId &&
    (marcadas.some((t) => (atividadeId || t.atividadeId) === transplanteId) || extras.includes(transplanteId));

  const fluxo = fluxoConcluir({ temMarcadas: marcadas.length > 0 });
  const { etapa, ir, avancar, voltar, sair } = useEtapas(fluxo, marcadas.length > 1 ? ['ajustar'] : []);
  const progresso = { etapas: fluxo.sequencia, atual: etapa };

  const alternar = (id: string) =>
    setDesmarcadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const ajuste = (id: string) => ajustes[id] ?? AJUSTE_VAZIO;
  const setAjuste = (id: string, patch: Partial<Ajuste>) =>
    setAjustes((a) => ({ ...a, [id]: { ...ajuste(id), ...patch } }));
  const valorAjuste = (id: string) => (ajuste(id).detalhesEditado ? ajuste(id).detalhes : instrucaoDe(id));

  async function concluir() {
    if (!marcadas.length) return toast('Marque ao menos uma planta.', 'error');
    if (!data) return toast('Informe a data.', 'error');
    if (data > toDateInput()) return toast('A data não pode ser no futuro.', 'error');
    if (proximos.some((p) => !p.atividadeId || !p.data || !repetirValido(p.repetir)))
      return toast('Complete os próximos passos (em Mais opções).', 'error');
    setSalvando(true);
    try {
      const urlComum = foto ? await uploadImage(foto) : null;
      const itens = [];
      for (const t of marcadas) {
        const aj = ajuste(t.id);
        const urlPropria = aj.foto ? await uploadImage(aj.foto) : null;
        itens.push({
          agendaId: t.id,
          // Sem mudança, a instrução própria é reenviada para a descrição geral não sobrescrevê-la
          detalhes: detalhesFinais({ valor: valorAjuste(t.id), preenchido: instrucaoDe(t.id) }, { valor: '', preenchido: '' }, 'reenviar'),
          observacaoFutura: aj.observacaoFutura.trim() || undefined,
          fotos: [urlComum, urlPropria].filter((u): u is string => !!u),
        });
      }
      const hoje = data === toDateInput();
      const principalId = atividadeId || atividadeAtual?.id;
      const extrasFinais = extras.filter((e) => e !== principalId);
      await agendasApi.concluir({
        dataConcluida: hoje ? new Date().toISOString() : fromDateInput(data),
        atividadeId: atividadeId || undefined,
        detalhes: textoEditado(valorDetalhes, instrucoes.geral),
        observacaoFutura: observacaoFutura.trim() || undefined,
        extras: extrasFinais.length ? extrasFinais : undefined,
        proximos: proximosParaApi(proximos),
        itens,
        moverRecemTransplantada: comTransplante && moverTransplante ? true : undefined,
      });
      if (comTransplante) lembrarMover(moverTransplante);
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      queryClient.invalidateQueries({ queryKey: ['fotos'] });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast(`${marcadas.length > 1 ? `${marcadas.length} tarefas concluídas` : 'Tarefa concluída'} 🌿`);
      sair();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  if (agendas.isLoading || atividades.isLoading) return <><PageHeader title="Concluir" back /><Spinner /></>;
  if (agendas.isError) {
    return (
      <>
        <PageHeader title="Concluir" back />
        <ErrorState text={errorMessage(agendas.error)} onRetry={() => agendas.refetch()} />
      </>
    );
  }
  if (!tarefas.length) {
    return (
      <>
        <PageHeader title="Concluir" back />
        <EmptyState title="Nada para concluir" text="Essas tarefas já foram concluídas ou não existem mais." />
      </>
    );
  }

  // ───────────── Ajustar plantas (desvio) ─────────────
  if (etapa === 'ajustar') {
    return (
      <FluxoLayout titulo="Ajustar plantas" rodape={<Button block onClick={voltar}>Pronto</Button>}>
        <AjustarPlantas
          itens={marcadas.map((t) => ({
            id: t.id,
            thumb: <PlantThumb url={t.planta?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />,
            titulo: plantaRotulo(t.planta),
            subtitulo:
              [plantaNome(t.planta), t.atividade?.nome].filter(Boolean).join(' · ') ||
              undefined,
            ajustado: temAjuste(ajuste(t.id)),
          }))}
          conteudo={(id) => {
            const aj = ajuste(id);
            return (
              <>
                <Field label="Descrição desta planta">
                  <textarea className="input min-h-16" value={valorAjuste(id)} onChange={(e) => setAjuste(id, { detalhes: e.target.value, detalhesEditado: true })} placeholder={valorDetalhes || 'Substitui a descrição geral'} />
                </Field>
                <Field label="Obs. desta planta">
                  <textarea className="input min-h-16" value={aj.observacaoFutura} onChange={(e) => setAjuste(id, { observacaoFutura: e.target.value })} placeholder={observacaoFutura || 'Substitui a obs. geral'} />
                </Field>
                <PhotoInput file={aj.foto} onChange={(f) => setAjuste(id, { foto: f })} label="Foto desta planta" aspect="aspect-[16/9]" />
              </>
            );
          }}
        />
      </FluxoLayout>
    );
  }

  // ───────────── Finalizar ─────────────
  if (etapa === 'final') {
    const resumo = resumoMaisOpcoes([
      valorDetalhes.trim() && 'Descrição',
      observacaoFutura.trim() && 'Obs.',
      comTransplante && (moverTransplante ? 'Mover p/ Recém transplantadas' : 'Não mover p/ Recém transplantadas'),
      proximos.length > 0 && (proximos.length === 1 ? '1 próximo passo' : `${proximos.length} próximos passos`),
    ]);
    return (
      <FluxoLayout
        titulo="Finalizar"
        progresso={progresso}
        rodape={
          <Button block onClick={concluir} loading={salvando} disabled={!marcadas.length}>
            Concluir{marcadas.length > 1 ? ` (${marcadas.length})` : ''}
          </Button>
        }
      >
        <QuandoCampo value={data} onChange={setData} />
        <PhotoInput
          file={foto}
          onChange={setFoto}
          label={marcadas.length > 1 ? 'Foto (todas as plantas)' : 'Foto (opcional)'}
          aspect="aspect-[16/9]"
        />
        <MaisOpcoes resumo={resumo} dica="Descrição, observação, próximos passos">
          <Field label="Descrição" hint={dicaDescricao(instrucoes)}>
            <textarea
              className="input min-h-20"
              value={valorDetalhes}
              onChange={(e) => {
                setDetalhes(e.target.value);
                setDetalhesEditado(true);
              }}
              placeholder="O que foi feito"
            />
          </Field>
          <Field label="Obs." hint="Aparece em destaque no histórico da planta.">
            <textarea className="input min-h-16" value={observacaoFutura} onChange={(e) => setObservacaoFutura(e.target.value)} placeholder="Ex.: arame apertado no galho da esquerda" />
          </Field>
          {comTransplante && <MoverTransplanteCampo checked={moverTransplante} onChange={setMoverEscolha} />}
          <ProximosPassos value={proximos} onChange={setProximos} />
        </MaisOpcoes>
      </FluxoLayout>
    );
  }

  // ───────────── Procedimento ─────────────
  const ajustadas = marcadas.filter((t) => temAjuste(ajuste(t.id))).length;
  return (
    <FluxoLayout
      titulo={tarefas.length > 1 ? `Concluir ${atividadeAtual?.nome ?? 'grupo'}` : 'Concluir tarefa'}
      progresso={progresso}
      rodape={
        <Button block onClick={avancar} disabled={!marcadas.length}>
          Continuar
        </Button>
      }
    >
      {/* Plantas */}
      <section>
        <span className="label">{tarefas.length > 1 ? 'Plantas' : 'Planta'}</span>
        <div className="space-y-2">
          {tarefas.map((t) => {
            const marcada = !desmarcadas.has(t.id);
            return (
              <div key={t.id} className={`card flex items-center gap-3 p-2.5 ${marcada ? '' : 'opacity-50'}`}>
                {tarefas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => alternar(t.id)}
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                      marcada ? 'border-primary bg-primary text-white' : 'border-line'
                    }`}
                    aria-pressed={marcada}
                    aria-label={`Incluir ${plantaRotulo(t.planta)}`}
                  >
                    {marcada && <Check size={16} strokeWidth={3} />}
                  </button>
                )}
                <PlantThumb url={t.planta?.fotoCapaUrl} className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{plantaRotulo(t.planta)}</p>
                  {plantaNome(t.planta) && <p className="truncate text-sm text-muted">{plantaNome(t.planta)}</p>}
                  {t.detalhes && (
                    <p className="truncate text-xs text-primary-dark" title={t.detalhes}>
                      Obs.: {t.detalhes}
                    </p>
                  )}
                  {marcada && temAjuste(ajuste(t.id)) && <p className="text-xs font-medium text-primary">Com ajuste próprio</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Atividade */}
      <section>
        <span className="label">Procedimento</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-active">{atividadeId ? nomeAtividade(atividadeId) : atividadeAtual?.nome}</span>
          <Button variant="ghost" size="sm" type="button" onClick={() => setTrocarAtividade((v) => !v)}>
            {trocarAtividade ? 'Fechar' : 'Trocar'}
          </Button>
        </div>
        {trocarAtividade && (
          <div className="mt-2 flex flex-wrap gap-2">
            {atividades.data.map((a) => (
              <button
                type="button"
                key={a.id}
                className={`chip ${(atividadeId || atividadeAtual?.id) === a.id ? 'chip-active' : ''}`}
                onClick={() => {
                  setAtividadeId(a.id === atividadeAtual?.id ? '' : a.id);
                  setExtras((x) => x.filter((e) => e !== a.id));
                  setTrocarAtividade(false);
                }}
              >
                {a.nome}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Feito junto */}
      <section>
        <span className="label">Feito junto (opcional)</span>
        <div className="flex flex-wrap gap-2">
          {extras.map((id) => (
            <button
              type="button"
              key={id}
              className="chip chip-active"
              onClick={() => setExtras((x) => x.filter((e) => e !== id))}
              aria-label={`Remover ${nomeAtividade(id)}`}
            >
              {nomeAtividade(id)} <X size={14} />
            </button>
          ))}
          <Button variant="ghost" size="sm" type="button" onClick={() => setEscolherExtra((v) => !v)}>
            <Plus size={16} /> Procedimento
          </Button>
        </div>
        {escolherExtra && (
          <div className="mt-2 flex flex-wrap gap-2">
            {atividades.data
              .filter((a) => !extras.includes(a.id) && a.id !== (atividadeId || atividadeAtual?.id))
              .map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className="chip"
                  onClick={() => {
                    setExtras((x) => [...x, a.id]);
                    setEscolherExtra(false);
                  }}
                >
                  {a.nome}
                </button>
              ))}
          </div>
        )}
      </section>

      {marcadas.length > 1 && (
        <button type="button" onClick={() => ir('ajustar')} className="card flex w-full items-center gap-3 p-3 text-left">
          <SlidersHorizontal size={18} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Algo diferente em alguma planta?</span>
            <span className={`block text-xs ${ajustadas ? 'font-medium text-primary' : 'text-muted'}`}>
              {ajustadas ? `${ajustadas} planta(s) com ajuste próprio` : 'Ajustar plantas (descrição, obs., foto)'}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </button>
      )}
    </FluxoLayout>
  );
}
