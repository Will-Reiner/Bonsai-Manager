import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field } from '@/components/ui';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { DataFuturaCampo } from '@/components/care/DataFuturaCampo';
import { PlantasLista } from '@/components/care/PlantasPicker';
import { RepetirCampo, repetirParaApi, repetirValido, type RepetirValor } from '@/components/care/RepetirCampo';
import { FluxoLayout } from '@/components/fluxo/FluxoLayout';
import { MaisOpcoes } from '@/components/fluxo/MaisOpcoes';
import { useEtapas } from '@/components/fluxo/useEtapas';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi, guiasSazonaisApi, rotinasApi } from '@/lib/endpoints';
import { daquiADias, fromDateInput, plantaTitulo, toDateInput } from '@/lib/format';
import { fluxoAgendar, resumoMaisOpcoes } from '@/lib/fluxos';
import { keys, useAgendas, usePlantas, useRotinas } from '@/lib/queries';
import { estacoesDoGuia, medianaIntervaloDias, rotuloUltima, textoIntervalo, ultimasPorPlanta } from '@/lib/cuidados';

/** Agendar cuidados (ou criar rotinas) em etapas: plantas → cuidados → quando. `?planta=` pula a 1ª; `?repetir=1` abre em Repetir. */
export function AgendarPage() {
  const [params] = useSearchParams();
  const plantaFixa = params.get('planta') ?? undefined;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [plantaIds, setPlantaIds] = useState<string[]>(plantaFixa ? [plantaFixa] : []);
  const [atividadeIds, setAtividadeIds] = useState<string[]>([]);
  const [detalhes, setDetalhes] = useState('');
  const [data, setData] = useState(() => toDateInput(daquiADias(1)));
  const [salvando, setSalvando] = useState(false);
  const [repetir, setRepetir] = useState<RepetirValor | null>(() =>
    params.get('repetir') === '1'
      ? { intervaloDias: 14, dataFim: '', estacoes: ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'] }
      : null,
  );
  const agendas = useAgendas();
  const ultimas = useMemo(() => ultimasPorPlanta(agendas.data ?? []), [agendas.data]);
  const dica = agendas.data && plantaIds.length
    ? (atividadeId: string) => rotuloUltima(plantaIds.map((p) => ultimas.get(p)?.get(atividadeId)))
    : undefined;
  const rotinas = useRotinas();
  const sugestao =
    plantaIds.length === 1 && atividadeIds.length === 1
      ? medianaIntervaloDias(agendas.data ?? [], plantaIds[0], atividadeIds[0])
      : null;
  const plantas = usePlantas();
  const especieId = plantaIds.length === 1 ? plantas.data?.find((p) => p.id === plantaIds[0])?.especieId : undefined;
  const guias = useQuery({
    queryKey: ['guias-sazonais', especieId],
    queryFn: () => guiasSazonaisApi.porEspecie(especieId!),
    enabled: !!especieId,
    staleTime: 5 * 60_000,
  });
  const estacoesSugeridas = atividadeIds.length === 1 && especieId ? estacoesDoGuia(guias.data, atividadeIds[0]) : null;
  const jaTem = (rotinas.data ?? []).filter((r) => plantaIds.includes(r.plantaId) && atividadeIds.includes(r.atividadeId));
  const total = plantaIds.length * atividadeIds.length;

  const fluxo = fluxoAgendar({ plantaFixa: !!plantaFixa, temPlantas: plantaIds.length > 0, temCuidados: atividadeIds.length > 0 });
  const { etapa, avancar, sair } = useEtapas(fluxo);
  const progresso = { etapas: fluxo.sequencia, atual: etapa };
  const resumoPlantas =
    plantaIds.length === 1 ? plantaTitulo(plantas.data?.find((p) => p.id === plantaIds[0])) : `${plantaIds.length} plantas`;

  async function salvar() {
    if (!plantaIds.length || !atividadeIds.length) return toast('Escolha as plantas e o tipo de cuidado.', 'error');
    if (!data) return toast('Informe a data.', 'error');
    if (repetir && !repetir.estacoes.length) return toast('Escolha ao menos uma estação.', 'error');
    if (repetir && !repetirValido(repetir)) return toast('Informe o intervalo em dias (1 a 3650).', 'error');
    setSalvando(true);
    try {
      let mensagem: string;
      if (repetir) {
        const r = await rotinasApi.create({
          plantaIds,
          atividadeIds,
          ...repetirParaApi(repetir),
          primeiraData: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        const n = r.criadas.length;
        const k = r.conflitos.length;
        mensagem = [
          n ? (n === 1 ? 'Rotina criada' : `${n} rotinas criadas`) : '',
          k ? (k === 1 ? '1 rotina já existia e foi mantida' : `${k} rotinas já existiam e foram mantidas`) : '',
        ]
          .filter(Boolean)
          .join(' · ');
      } else {
        await agendasApi.createLote({
          plantaIds,
          atividadeIds,
          dataAgendada: fromDateInput(data),
          detalhes: detalhes.trim() || undefined,
        });
        mensagem = total > 1 ? `${total} cuidados agendados` : 'Cuidado agendado';
      }
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      toast(mensagem);
      sair();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  if (etapa === 'plantas') {
    return (
      <FluxoLayout
        titulo="Em quais plantas?"
        progresso={progresso}
        rodape={
          <Button block onClick={avancar} disabled={!plantaIds.length}>
            Continuar{plantaIds.length ? ` (${plantaIds.length})` : ''}
          </Button>
        }
      >
        <PlantasLista selecionadas={plantaIds} onChange={setPlantaIds} />
      </FluxoLayout>
    );
  }

  if (etapa === 'cuidados') {
    return (
      <FluxoLayout
        titulo="Quais cuidados?"
        progresso={progresso}
        rodape={
          <Button block onClick={avancar} disabled={!atividadeIds.length}>
            Continuar
          </Button>
        }
      >
        <p className="text-sm text-muted">{resumoPlantas}</p>
        <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} dica={dica} />
      </FluxoLayout>
    );
  }

  return (
    <FluxoLayout
      titulo="Quando?"
      progresso={progresso}
      rodape={
        <Button block onClick={salvar} loading={salvando}>
          {repetir ? (total > 1 ? `Criar ${total} rotinas` : 'Criar rotina') : total > 1 ? `Agendar ${total} cuidados` : 'Agendar'}
        </Button>
      }
    >
      <p className="text-sm text-muted">{resumoPlantas}</p>
      <DataFuturaCampo label={repetir ? 'Primeira vez' : 'Data'} value={data} onChange={setData} />
      <RepetirCampo value={repetir} onChange={setRepetir} sugestao={sugestao} estacoesSugeridas={estacoesSugeridas} />
      {repetir && jaTem.length > 0 && (
        <p className="text-xs text-muted">
          {jaTem.length === 1
            ? `Já existe rotina de ${jaTem[0].atividade?.nome ?? 'cuidado'} (${textoIntervalo(jaTem[0].intervaloDias)}) — ela será mantida.`
            : `${jaTem.length} rotinas já existem e serão mantidas.`}
        </p>
      )}
      <MaisOpcoes resumo={resumoMaisOpcoes([detalhes.trim() && 'Observação'])} dica="Observação para a tarefa">
        <Field label="Observação">
          <textarea className="input min-h-16" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="Ex.: usar adubo Bioplant" />
        </Field>
      </MaisOpcoes>
    </FluxoLayout>
  );
}
