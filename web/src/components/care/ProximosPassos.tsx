import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { daquiADias, toDateInput } from '@/lib/format';
import { useAtividadesOrdenadas, useRevisaoDias } from '@/lib/queries';

export interface Proximo {
  atividadeId: string;
  data: string; // AAAA-MM-DD
}

const ATALHOS = [
  { label: '+1 sem', dias: 7 },
  { label: '+2 sem', dias: 14 },
  { label: '+1 mês', dias: 30 },
];

/** Próximos passos a agendar após um cuidado; vazio => Revisão geral automática. */
export function ProximosPassos({ value, onChange }: { value: Proximo[]; onChange: (v: Proximo[]) => void }) {
  const atividades = useAtividadesOrdenadas();
  const revisaoDias = useRevisaoDias();

  return (
    <section>
      <span className="label">Próximos passos</span>
      <div className="space-y-3">
        {value.map((p, i) => (
          <div key={i} className="card space-y-2 p-3">
            <div className="flex items-center gap-2">
              <select
                className="input flex-1"
                value={p.atividadeId}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, atividadeId: e.target.value } : x)))}
              >
                <option value="" disabled>
                  Tipo de cuidado
                </option>
                {atividades.data.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-line/50"
                aria-label="Remover próximo passo"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="input w-auto"
                value={p.data}
                min={toDateInput()}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, data: e.target.value } : x)))}
              />
              {ATALHOS.map((at) => (
                <button
                  type="button"
                  key={at.label}
                  className="chip"
                  onClick={() =>
                    onChange(value.map((x, j) => (j === i ? { ...x, data: toDateInput(daquiADias(at.dias)) } : x)))
                  }
                >
                  {at.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => onChange([...value, { atividadeId: '', data: toDateInput(daquiADias(7)) }])}
        >
          <Plus size={16} /> Agendar próximo passo
        </Button>
        {value.length === 0 && revisaoDias > 0 && (
          <p className="text-xs text-muted">
            Sem próximos passos, será criada uma Revisão geral em {revisaoDias} dias (se a planta não tiver outra
            tarefa próxima).
          </p>
        )}
      </div>
    </section>
  );
}
