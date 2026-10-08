import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Pause, Play, Trash2 } from 'lucide-react';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { ESTACOES_LISTA, textoEstacoes, textoIntervalo } from '@/lib/cuidados';
import { rotinasApi } from '@/lib/endpoints';
import { dataRelativa, fromDateInput, plantaCodigoNome, toDateInput } from '@/lib/format';
import { keys, useRotinas } from '@/lib/queries';
import type { Estacao, Rotina } from '@/types';

/** Editar, pausar/retomar, agendar a próxima ou apagar uma rotina. */
export function RotinaSheet({ rotinaId, onClose }: { rotinaId: string | null; onClose: () => void }) {
  const rotinas = useRotinas();
  const rotina = rotinas.data?.find((r) => r.id === rotinaId);
  return (
    <>{rotina && <RotinaForm key={rotina.id} rotina={rotina} onClose={onClose} />}</>
  );
}

function RotinaForm({ rotina, onClose }: { rotina: Rotina; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [intervalo, setIntervalo] = useState(String(rotina.intervaloDias));
  const [dataFim, setDataFim] = useState(rotina.dataFim ? toDateInput(rotina.dataFim) : '');
  const [estacoes, setEstacoes] = useState<Estacao[]>(rotina.estacoes?.length ? rotina.estacoes : ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO']);
  const [salvando, setSalvando] = useState<'salvar' | 'pausa' | 'proxima' | 'apagar' | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  /** `fn` devolve a rotina atualizada quando houver: se ficou ativa e sem próxima, avisa (data final atingida). */
  async function executar(tipo: NonNullable<typeof salvando>, fn: () => Promise<Rotina | void>, mensagem: string) {
    setSalvando(tipo);
    try {
      const r = await fn();
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast(r && !r.pausada && !r.proxima ? 'Rotina sem próxima tarefa (data final atingida)' : mensagem);
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(null);
    }
  }

  function salvar() {
    const dias = Number(intervalo);
    if (!Number.isInteger(dias) || dias < 1 || dias > 3650) return toast('Informe o intervalo em dias (1 a 3650).', 'error');
    if (estacoes.length === 0) return toast('Escolha ao menos uma estação.', 'error');
    executar(
      'salvar',
      () =>
        rotinasApi.update(rotina.id, {
          intervaloDias: dias,
          dataFim: dataFim ? fromDateInput(dataFim) : null,
          estacoes: estacoes.length === 4 ? [] : estacoes,
        }),
      'Rotina atualizada',
    );
  }

  const status = rotina.pausada
    ? 'Pausada'
    : rotina.proxima
      ? `Próxima: ${dataRelativa(rotina.proxima.dataAgendada)}`
      : 'Sem próxima tarefa';

  return (
    <>
      <Sheet open={!confirmar} onClose={onClose} title={`Rotina · ${rotina.atividade?.nome ?? 'Cuidado'}`}>
        <div className="space-y-5 pb-safe">
          <p className="text-sm text-muted">
            {plantaCodigoNome(rotina.planta)} · {textoIntervalo(rotina.intervaloDias)}
            {textoEstacoes(rotina.estacoes) && ` · ${textoEstacoes(rotina.estacoes)}`} · {status}
          </p>
          <Field label="A cada quantos dias">
            <input type="number" inputMode="numeric" min={1} max={3650} className="input w-28" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} />
          </Field>
          <Field label="Até (opcional)">
            <input type="date" className="input w-auto" value={dataFim} min={toDateInput()} onChange={(e) => setDataFim(e.target.value)} />
          </Field>
          <Field label="Em quais estações">
            <div className="flex flex-wrap gap-2">
              {ESTACOES_LISTA.map((e) => {
                const ativa = estacoes.includes(e.valor);
                return (
                  <button
                    type="button"
                    key={e.valor}
                    className={`chip py-1.5 text-xs ${ativa ? 'chip-active' : ''}`}
                    aria-pressed={ativa}
                    onClick={() => setEstacoes(ativa ? estacoes.filter((x) => x !== e.valor) : [...estacoes, e.valor])}
                  >
                    {e.nome}
                  </button>
                );
              })}
            </div>
          </Field>
          <Button block onClick={salvar} loading={salvando === 'salvar'}>
            Salvar
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {rotina.pausada ? (
              <Button variant="secondary" size="sm" loading={salvando === 'pausa'} onClick={() => executar('pausa', () => rotinasApi.retomar(rotina.id), 'Rotina retomada')}>
                <Play size={16} /> Retomar
              </Button>
            ) : (
              <Button variant="secondary" size="sm" loading={salvando === 'pausa'} onClick={() => executar('pausa', () => rotinasApi.pausar(rotina.id), 'Rotina pausada')}>
                <Pause size={16} /> Pausar
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setConfirmar(true)}>
              <Trash2 size={16} /> Apagar
            </Button>
          </div>
          {!rotina.pausada && !rotina.proxima && (
            <Button block variant="secondary" size="sm" loading={salvando === 'proxima'} onClick={() => executar('proxima', () => rotinasApi.retomar(rotina.id), 'Próxima agendada')}>
              <CalendarPlus size={16} /> Agendar próxima
            </Button>
          )}
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={() =>
          executar(
            'apagar',
            async () => {
              await rotinasApi.remove(rotina.id);
            },
            'Rotina apagada',
          )
        }
        loading={salvando === 'apagar'}
        title="Apagar rotina?"
        text="A próxima tarefa é cancelada. O histórico continua."
        confirmLabel="Apagar"
      />
    </>
  );
}
