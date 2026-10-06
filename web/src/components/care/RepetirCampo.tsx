import { Repeat } from 'lucide-react';
import { fromDateInput, toDateInput } from '@/lib/format';

export interface RepetirValor {
  intervaloDias: number;
  /** AAAA-MM-DD ou '' (sem fim) */
  dataFim: string;
}

export const repetirValido = (v: RepetirValor | null | undefined) =>
  !v || (Number.isInteger(v.intervaloDias) && v.intervaloDias >= 1 && v.intervaloDias <= 3650);

export const repetirParaApi = (v: RepetirValor) => ({
  intervaloDias: v.intervaloDias,
  ...(v.dataFim ? { dataFim: fromDateInput(v.dataFim) } : {}),
});

/** Uma vez / Repetir a cada N dias (até uma data opcional), com sugestão vinda do histórico. */
export function RepetirCampo({
  value,
  onChange,
  sugestao,
}: {
  value: RepetirValor | null;
  onChange: (v: RepetirValor | null) => void;
  sugestao?: number | null;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <button type="button" className={`chip ${!value ? 'chip-active' : ''}`} aria-pressed={!value} onClick={() => onChange(null)}>
          Uma vez
        </button>
        <button
          type="button"
          className={`chip ${value ? 'chip-active' : ''}`}
          aria-pressed={!!value}
          onClick={() => onChange(value ?? { intervaloDias: sugestao ?? 14, dataFim: '' })}
        >
          <Repeat size={14} /> Repetir
        </button>
      </div>
      {value && (
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            a cada
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              className="input w-20"
              value={value.intervaloDias || ''}
              onChange={(e) => onChange({ ...value, intervaloDias: Number(e.target.value) })}
            />
            dias
          </label>
          {!!sugestao && sugestao !== value.intervaloDias && (
            <button type="button" className="text-xs font-medium text-primary" onClick={() => onChange({ ...value, intervaloDias: sugestao })}>
              Você costuma fazer {sugestao === 1 ? 'todo dia' : `a cada ~${sugestao} dias`} — usar
            </button>
          )}
          <label className="flex items-center gap-2 text-sm">
            até (opcional)
            <input
              type="date"
              className="input w-auto"
              value={value.dataFim}
              min={toDateInput()}
              onChange={(e) => onChange({ ...value, dataFim: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
