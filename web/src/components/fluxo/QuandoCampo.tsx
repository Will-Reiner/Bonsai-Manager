import { useState } from 'react';
import { daquiADias, toDateInput } from '@/lib/format';

/** Data de algo já feito: Hoje / Ontem / Outra data (nunca no futuro). */
export function QuandoCampo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hoje = toDateInput();
  const ontem = toDateInput(daquiADias(-1));
  const [outra, setOutra] = useState(value !== hoje && value !== ontem);
  const chip = (ativo: boolean) => `chip ${ativo ? 'chip-active' : ''}`;
  return (
    <div>
      <span className="label">Quando</span>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(!outra && value === hoje)} onClick={() => { setOutra(false); onChange(hoje); }}>
          Hoje
        </button>
        <button type="button" className={chip(!outra && value === ontem)} onClick={() => { setOutra(false); onChange(ontem); }}>
          Ontem
        </button>
        <button type="button" className={chip(outra)} onClick={() => setOutra(true)}>
          Outra data
        </button>
      </div>
      {outra && (
        <input type="date" className="input mt-2" value={value} max={hoje} onChange={(e) => onChange(e.target.value)} aria-label="Data" />
      )}
    </div>
  );
}
