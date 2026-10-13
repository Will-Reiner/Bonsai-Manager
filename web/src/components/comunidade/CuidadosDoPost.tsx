import { useState } from 'react';
import { Icone } from '@/components/Icone';
import { iconeDaAtividade } from '@/lib/icones';
import type { CuidadoDoPost } from '@/types';

const LIMITE_RECOLHIDO = 120;

/** Atividades do dia com o ícone de cada uma e as notas (recolhidas quando longas). */
export function CuidadosDoPost({ cuidados }: { cuidados: CuidadoDoPost[] | null }) {
  const [aberto, setAberto] = useState(false);
  if (!cuidados?.length) return null;
  const atividades = [...new Set(cuidados.map((c) => c.atividade))];
  const notas = [...new Set(cuidados.flatMap((c) => [c.detalhes, c.observacao]).filter((n): n is string => !!n?.trim()))].join('\n');
  const longa = notas.length > LIMITE_RECOLHIDO;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {atividades.map((a) => (
          <span key={a} className="flex items-center gap-1.5 text-sm font-medium">
            <Icone nome={iconeDaAtividade(a)} size={18} /> {a}
          </span>
        ))}
      </div>
      {notas && <p className={`whitespace-pre-line text-sm text-ink/80 ${longa && !aberto ? 'line-clamp-2' : ''}`}>{notas}</p>}
      {longa && !aberto && (
        <button type="button" onClick={() => setAberto(true)} className="text-sm font-medium text-muted">
          ver mais
        </button>
      )}
    </div>
  );
}
