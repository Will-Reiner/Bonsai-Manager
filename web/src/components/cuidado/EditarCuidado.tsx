import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import {
  cuidadoNoDia,
  formTexto,
  indiceDoCuidado,
  textoExcluirCuidado,
  textosAlterados,
  vizinhoAposExcluir,
  type CampoTexto,
  type Cuidado,
  type FormTexto,
} from '@/lib/cuidadoDoDia';
import { agendasApi } from '@/lib/endpoints';
import { dataCurta, fromDateInput, toDateInput } from '@/lib/format';
import { keys } from '@/lib/queries';
import type { Planta } from '@/types';

const ROTULO: Record<CampoTexto, string> = { detalhes: 'Descrição', observacaoFutura: 'Obs. para o futuro' };

/** Gaveta de edição do cuidado do dia: data, tarefas, textos; e excluir o cuidado. */
export function EditarCuidado({
  cuidado,
  cuidados,
  planta,
  onClose,
  onSalvo,
  onExcluido,
}: {
  cuidado: Cuidado;
  cuidados: Cuidado[];
  planta?: Planta;
  onClose: () => void;
  onSalvo: (idQueFica: string) => void;
  onExcluido: (vizinhoId: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const ids = cuidado.agendas.map((a) => a.id);
  const [data, setData] = useState(() => toDateInput(cuidado.data));
  const [removidas, setRemovidas] = useState<string[]>([]);
  const [forms, setForms] = useState<Record<CampoTexto, FormTexto>>(() => ({
    detalhes: formTexto(cuidado.agendas, 'detalhes'),
    observacaoFutura: formTexto(cuidado.agendas, 'observacaoFutura'),
  }));
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const ficam = cuidado.agendas.filter((a) => !removidas.includes(a.id));
  const textos = textosAlterados(ficam, forms);
  const mudouData = data !== toDateInput(cuidado.data);
  const mudou = mudouData || removidas.length > 0 || textos.length > 0;
  const juntar = mudouData ? cuidadoNoDia(cuidados, data, cuidado) : null;
  const deRotina = cuidado.agendas.some((a) => a.rotinaId);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: keys.agendas });
    queryClient.invalidateQueries({ queryKey: keys.rotinas });
    queryClient.invalidateQueries({ queryKey: keys.plantas });
    queryClient.invalidateQueries({ queryKey: keys.fotos(cuidado.agendas[0].plantaId) });
  }

  async function salvar() {
    setSalvando(true);
    try {
      await agendasApi.editarCuidado({
        agendaIds: ids,
        ...(mudouData ? { dataConcluida: fromDateInput(data) } : {}),
        ...(textos.length ? { textos } : {}),
        ...(removidas.length ? { removerAgendaIds: removidas } : {}),
      });
      invalidar();
      toast('Cuidado atualizado');
      onSalvo(ficam[0].id);
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await agendasApi.excluirCuidado(ids);
      invalidar();
      toast('Cuidado excluído');
      onExcluido(vizinhoAposExcluir(cuidados, indiceDoCuidado(cuidados, ids[0])));
    } catch (error) {
      toast(errorMessage(error), 'error');
      setExcluindo(false);
    }
  }

  const campoTexto = (campo: CampoTexto) => {
    const f = forms[campo];
    const mudar = (novo: Partial<FormTexto>) => setForms((atual) => ({ ...atual, [campo]: { ...atual[campo], ...novo } }));
    if (f.unico) {
      return (
        <Field key={campo} label={ROTULO[campo]}>
          <textarea className="input min-h-20" value={f.valor} onChange={(e) => mudar({ valor: e.target.value })} />
        </Field>
      );
    }
    return ficam.map((a) => (
      <Field key={`${campo}-${a.id}`} label={`${ROTULO[campo]} · ${a.atividade?.nome ?? 'Cuidado'}`}>
        <textarea
          className="input min-h-20"
          value={f.porTarefa[a.id] ?? ''}
          onChange={(e) => mudar({ porTarefa: { ...f.porTarefa, [a.id]: e.target.value } })}
        />
      </Field>
    ));
  };

  return (
    <>
      <Sheet
        open={!confirmar}
        onClose={onClose}
        title="Editar cuidado"
        footer={
          <Button block onClick={salvar} loading={salvando} disabled={!mudou}>
            Salvar
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Data">
            <input
              type="date"
              className="input"
              value={data}
              max={toDateInput()}
              onChange={(e) => e.target.value && setData(e.target.value)}
            />
          </Field>
          {juntar && <p className="-mt-2 text-xs text-muted">Vai juntar com o cuidado de {dataCurta(juntar.data)}.</p>}
          {deRotina && mudouData && <p className="-mt-2 text-xs text-muted">Mudar a data não reagenda a próxima da rotina.</p>}

          <div>
            <span className="label">Tarefas</span>
            <div className="flex flex-wrap gap-2">
              {ficam.map((a) => (
                <span key={a.id} className="chip flex items-center gap-1.5 py-1 pr-1.5">
                  {a.atividade?.nome ?? 'Cuidado'}
                  <button
                    type="button"
                    onClick={() => setRemovidas((r) => [...r, a.id])}
                    disabled={ficam.length === 1}
                    className="flex size-6 items-center justify-center rounded-full hover:bg-danger/10 disabled:opacity-30"
                    aria-label={`Tirar ${a.atividade?.nome ?? 'tarefa'}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            {removidas.length > 0 && (
              <button type="button" onClick={() => setRemovidas([])} className="mt-1.5 text-xs font-semibold text-primary">
                Desfazer ({removidas.length} tirada{removidas.length > 1 ? 's' : ''})
              </button>
            )}
          </div>

          {campoTexto('detalhes')}
          {campoTexto('observacaoFutura')}

          <Button block variant="danger" onClick={() => setConfirmar(true)}>
            <Trash2 size={18} /> Excluir cuidado
          </Button>
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={excluir}
        loading={excluindo}
        title="Excluir este cuidado?"
        text={textoExcluirCuidado(ids.length, planta, ids)}
      />
    </>
  );
}
