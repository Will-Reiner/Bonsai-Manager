import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { cuidadosDaPlanta, indiceDoCuidado } from '@/lib/cuidadoDoDia';
import { plantaCodigoNome } from '@/lib/format';
import { usePlanta } from '@/lib/queries';
import { MANTER_ROLAGEM } from '@/lib/rolagem';
import type { Agenda } from '@/types';
import { CuidadosDaPlanta } from './CuidadosDaPlanta';
import { EditarCuidado } from './EditarCuidado';

/** Tarefa concluída: o cuidado do dia dela, deslizando entre os cuidados da planta. */
export function CuidadoFeito({ agenda, agendas }: { agenda: Agenda; agendas: Agenda[] }) {
  const navigate = useNavigate();
  const cuidados = useMemo(() => cuidadosDaPlanta(agendas, agenda.plantaId), [agendas, agenda.plantaId]);
  const atual = Math.max(0, indiceDoCuidado(cuidados, agenda.id));
  const irPara = (id: string) => navigate(`/tarefas/${id}`, { replace: true, state: MANTER_ROLAGEM });
  const [editando, setEditando] = useState(false);
  const planta = usePlanta(agenda.plantaId);
  const cuidado = cuidados[atual];

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader
        title={plantaCodigoNome(agenda.planta)}
        titleTo={`/plantas/${agenda.plantaId}`}
        back
        right={
          <button
            onClick={() => setEditando(true)}
            disabled={!cuidado}
            className="flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-light"
            aria-label="Editar cuidado"
          >
            <Pencil size={20} />
          </button>
        }
      />
      <div className="mx-auto max-w-2xl pt-5">
        <CuidadosDaPlanta cuidados={cuidados} atual={atual} onTrocar={(i) => irPara(cuidados[i].agendas[0].id)} />
      </div>
      {editando && cuidado && (
        <EditarCuidado
          key={cuidado.agendas[0].id}
          cuidado={cuidado}
          cuidados={cuidados}
          planta={planta.data}
          onClose={() => setEditando(false)}
          onSalvo={(id) => {
            setEditando(false);
            irPara(id);
          }}
          onExcluido={(vizinho) => {
            setEditando(false);
            if (vizinho) irPara(vizinho);
            else navigate(`/plantas/${agenda.plantaId}`, { replace: true });
          }}
        />
      )}
    </div>
  );
}
