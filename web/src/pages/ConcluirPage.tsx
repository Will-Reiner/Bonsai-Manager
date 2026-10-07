import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button, EmptyState, ErrorState, Field, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { ProximosPassos, proximosParaApi, type Proximo } from '@/components/care/ProximosPassos';
import { repetirValido } from '@/components/care/RepetirCampo';
import { PhotoInput } from '@/components/PhotoInput';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi } from '@/lib/endpoints';
import { fromDateInput, plantaRotulo, toDateInput } from '@/lib/format';
import { keys, useAgendas, useAtividadesOrdenadas } from '@/lib/queries';
import { ATIVIDADE_TRANSPLANTE } from '@/types';
import { uploadImage } from '@/lib/upload';

interface Ajuste {
  detalhes: string;
  observacaoFutura: string;
  foto: File | null;
}

const AJUSTE_VAZIO: Ajuste = { detalhes: '', observacaoFutura: '', foto: null };

/** Concluir uma tarefa ou um grupo: campos comuns + ajuste opcional por planta. */
export function ConcluirPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
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
  const [aberta, setAberta] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [trocarAtividade, setTrocarAtividade] = useState(false);
  const [atividadeId, setAtividadeId] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [escolherExtra, setEscolherExtra] = useState(false);
  const [data, setData] = useState(toDateInput());
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [proximos, setProximos] = useState<Proximo[]>([]);
  const [moverTransplante, setMoverTransplante] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const marcadas = tarefas.filter((t) => !desmarcadas.has(t.id));
  const atividadeAtual = tarefas[0]?.atividade;
  const nomeAtividade = (id: string) => atividades.data.find((a) => a.id === id)?.nome ?? '…';
  const transplanteId = atividades.data.find((a) => a.nome === ATIVIDADE_TRANSPLANTE)?.id;
  const comTransplante =
    !!transplanteId &&
    (marcadas.some((t) => (atividadeId || t.atividadeId) === transplanteId) || extras.includes(transplanteId));

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

  async function concluir() {
    if (!marcadas.length) return toast('Marque ao menos uma planta.', 'error');
    if (!data) return toast('Informe a data.', 'error');
    if (data > toDateInput()) return toast('A data não pode ser no futuro.', 'error');
    if (proximos.some((p) => !p.atividadeId || !p.data || !repetirValido(p.repetir))) return toast('Complete os próximos passos.', 'error');
    setSalvando(true);
    try {
      const urlComum = foto ? await uploadImage(foto) : null;
      const itens = [];
      for (const t of marcadas) {
        const aj = ajuste(t.id);
        const urlPropria = aj.foto ? await uploadImage(aj.foto) : null;
        itens.push({
          agendaId: t.id,
          detalhes: aj.detalhes.trim() || undefined,
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
        detalhes: detalhes.trim() || undefined,
        observacaoFutura: observacaoFutura.trim() || undefined,
        extras: extrasFinais.length ? extrasFinais : undefined,
        proximos: proximosParaApi(proximos),
        itens,
        moverRecemTransplantada: comTransplante && moverTransplante ? true : undefined,
      });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      queryClient.invalidateQueries({ queryKey: ['fotos'] });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast(`${marcadas.length > 1 ? `${marcadas.length} tarefas concluídas` : 'Tarefa concluída'} 🌿`);
      navigate('/', { replace: true });
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

  return (
    <div className="min-h-dvh pb-32">
      <PageHeader title={tarefas.length > 1 ? `Concluir ${atividadeAtual?.nome ?? 'grupo'}` : 'Concluir tarefa'} back />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
        {/* Plantas */}
        <section>
          <span className="label">{tarefas.length > 1 ? 'Plantas' : 'Planta'}</span>
          <div className="space-y-2">
            {tarefas.map((t) => {
              const marcada = !desmarcadas.has(t.id);
              const aj = ajuste(t.id);
              const temAjuste = !!(aj.detalhes || aj.observacaoFutura || aj.foto);
              return (
                <div key={t.id} className={`card overflow-hidden ${marcada ? '' : 'opacity-50'}`}>
                  <div className="flex items-center gap-3 p-2.5">
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
                      {t.planta?.identificador && t.planta?.nome && (
                        <p className="truncate text-sm text-muted">{t.planta.nome}</p>
                      )}
                      {t.detalhes && (
                        <p className="truncate text-xs text-primary-dark" title={t.detalhes}>
                          Obs.: {t.detalhes}
                        </p>
                      )}
                      {temAjuste && <p className="text-xs font-medium text-primary">Com ajuste próprio</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAberta(aberta === t.id ? null : t.id)}
                      className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-line/50"
                      aria-label="Ajustar só esta planta"
                      aria-expanded={aberta === t.id}
                    >
                      <ChevronDown size={20} className={`transition ${aberta === t.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {aberta === t.id && (
                    <div className="space-y-3 border-t border-line p-3">
                      <p className="text-xs text-muted">Só para esta planta (substitui os campos comuns).</p>
                      <Field label="Descrição">
                        <textarea
                          className="input min-h-16"
                          value={aj.detalhes}
                          onChange={(e) => setAjuste(t.id, { detalhes: e.target.value })}
                        />
                      </Field>
                      <Field label="Obs.">
                        <textarea
                          className="input min-h-16"
                          value={aj.observacaoFutura}
                          onChange={(e) => setAjuste(t.id, { observacaoFutura: e.target.value })}
                        />
                      </Field>
                      <PhotoInput
                        file={aj.foto}
                        onChange={(f) => setAjuste(t.id, { foto: f })}
                        label="Foto desta planta"
                        aspect="aspect-[16/9]"
                      />
                    </div>
                  )}
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

        <Field label="Quando">
          <input type="date" className="input" value={data} max={toDateInput()} onChange={(e) => setData(e.target.value)} />
        </Field>

        <Field label="Descrição (opcional)" hint="Se preencher, substitui a observação do agendamento.">
          <textarea
            className="input min-h-20"
            value={detalhes}
            onChange={(e) => setDetalhes(e.target.value)}
            placeholder="O que foi feito"
          />
        </Field>

        <Field label="Obs. (opcional)" hint="Aparece em destaque no histórico da planta.">
          <textarea
            className="input min-h-16"
            value={observacaoFutura}
            onChange={(e) => setObservacaoFutura(e.target.value)}
            placeholder="Ex.: arame apertado no galho da esquerda"
          />
        </Field>

        <PhotoInput
          file={foto}
          onChange={setFoto}
          label={marcadas.length > 1 ? 'Foto (todas as plantas)' : 'Foto (opcional)'}
          aspect="aspect-[16/9]"
        />

        {comTransplante && (
          <label className="card flex cursor-pointer items-center gap-3 p-3">
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-primary"
              checked={moverTransplante}
              onChange={(e) => setMoverTransplante(e.target.checked)}
            />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Mover para Recém transplantadas</span>
              <span className="block text-xs text-muted">Depois do prazo (ajustável no Perfil) a planta volta ao grupo de antes.</span>
            </span>
          </label>
        )}
        <ProximosPassos value={proximos} onChange={setProximos} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto mb-3 max-w-2xl">
          <Button block onClick={concluir} loading={salvando} disabled={!marcadas.length}>
            Concluir{marcadas.length > 1 ? ` (${marcadas.length})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
