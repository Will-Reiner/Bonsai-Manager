import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { GradePlantas } from '@/components/care/PlantasPicker';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import {
  JANELA_ATALHO_DIAS,
  atividadesValidas,
  nomesDeEspecies,
  plantasDoAtalho,
  rotuloAlvo,
  tarefasDoAtalho,
  type Atalho,
} from '@/lib/atalhos';
import { agendasApi } from '@/lib/endpoints';
import { keys, useAgendas, useAtividades, useEspecies, useMoverRecemTransplantada, usePlantas } from '@/lib/queries';
import { ATIVIDADE_TRANSPLANTE } from '@/types';

/** Confirmação do atalho: plantas do alvo marcadas (toque desmarca), tarefas próximas a concluir e Registrar. */
export function ConfirmarAtalho({ atalho, onClose, onEditar }: { atalho: Atalho; onClose: () => void; onEditar: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const agendas = useAgendas();
  const atividades = useAtividades();
  const especies = useEspecies();
  const mover = useMoverRecemTransplantada();
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);
  const [concluir, setConcluir] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const alvo = plantasDoAtalho(atalho, plantas.data ?? []);
  const marcadas = alvo.filter((p) => !desmarcadas.includes(p.id));
  const validas = atividadesValidas(atalho, atividades.data ?? []);
  const ids = validas.map((a) => a.id);
  const tarefas = tarefasDoAtalho(agendas.data ?? [], marcadas.map((p) => p.id), ids);
  const comTransplante = validas.some((a) => a.nome === ATIVIDADE_TRANSPLANTE);
  const n = marcadas.length;

  async function registrar() {
    setSalvando(true);
    const concluirIds = concluir ? tarefas.map((a) => a.id) : [];
    try {
      await agendasApi.registrar({
        data: new Date().toISOString(),
        plantas: marcadas.map((p) => ({ plantaId: p.id, atividadeIds: ids })),
        concluirAgendaIds: concluirIds.length ? concluirIds : undefined,
        moverRecemTransplantada: comTransplante && mover ? true : undefined,
      });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      queryClient.invalidateQueries({ queryKey: keys.rotinas });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      const k = concluirIds.length;
      const extra = k ? ` · ${k === 1 ? '1 tarefa concluída' : `${k} tarefas concluídas`}` : '';
      toast(`Cuidado registrado 🌿${n > 1 ? ` em ${n} plantas` : ''}${extra}`);
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
      // Tarefa concluída/apagada em outro lugar: atualiza a lista para a nova tentativa
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      setSalvando(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={validas.map((a) => a.nome).join(' + ')}
      footer={
        <>
          <Button block disabled={!n} loading={salvando} onClick={registrar}>
            {n ? `Registrar em ${n === 1 ? '1 planta' : `${n} plantas`}` : 'Registrar'}
          </Button>
          <button type="button" onClick={onEditar} className="block w-full text-center text-sm font-medium text-primary">
            Editar atalho
          </button>
        </>
      }
    >
      <p className="-mt-1 mb-3 text-sm text-muted">
        {rotuloAlvo(atalho, nomesDeEspecies(plantas.data ?? [], especies.data ?? []))} · hoje
      </p>
      {alvo.length ? (
        <GradePlantas
          plantas={alvo}
          marcada={(id) => !desmarcadas.includes(id)}
          onAlternar={(id) => setDesmarcadas((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))}
        />
      ) : (
        <p className="py-6 text-center text-sm text-muted">Nenhuma planta neste atalho agora.</p>
      )}
      {tarefas.length > 0 && (
        <label className="card mt-4 flex cursor-pointer items-center gap-3 p-3">
          <input
            type="checkbox"
            className="size-5 shrink-0 accent-primary"
            checked={concluir}
            onChange={(e) => setConcluir(e.target.checked)}
          />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              Também concluir {tarefas.length === 1 ? '1 tarefa agendada' : `${tarefas.length} tarefas agendadas`}
            </span>
            <span className="block text-xs text-muted">Atrasadas ou que vencem em até {JANELA_ATALHO_DIAS} dias</span>
          </span>
        </label>
      )}
    </Sheet>
  );
}
