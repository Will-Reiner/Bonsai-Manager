import { useMemo } from 'react';
import { Field } from '@/components/ui';
import { atalhosDeData } from '@/lib/estacoes';
import { dataNumerica, fromDateInput, toDateInput } from '@/lib/format';

/** Data de uma tarefa com atalhos (amanhã, semanas, estações). `livre` aceita datas passadas (reagendar). */
export function DataFuturaCampo({
  label = 'Data',
  value,
  onChange,
  livre,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  livre?: boolean;
}) {
  const atalhos = useMemo(() => atalhosDeData(), []);
  return (
    <div>
      <Field label={label}>
        <input type="date" className="input" value={value} min={livre ? undefined : toDateInput()} onChange={(e) => onChange(e.target.value)} required />
      </Field>
      <div className="mt-2 flex flex-wrap gap-2">
        {atalhos.map((a) => (
          <button
            type="button"
            key={a.label}
            className={`chip py-1.5 text-xs ${value === a.data ? 'chip-active' : ''}`}
            onClick={() => onChange(a.data)}
          >
            {a.label} <span className="opacity-60">· {dataNumerica(fromDateInput(a.data)).slice(0, 5)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
