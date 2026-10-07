import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';

/** Botão redondo do topo da tela (lupa, preferências…); `marcado` destaca quando há algo ativo. */
export function BotaoTopo({
  label,
  onClick,
  children,
  marcado,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  marcado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative flex size-11 items-center justify-center rounded-full border transition active:scale-90 ${
        marcado ? 'border-primary bg-primary-light text-primary' : 'border-line bg-card text-ink'
      }`}
    >
      {children}
    </button>
  );
}

/** Botão de preferências com a contagem de filtros ativos. */
export function BotaoPreferencias({ ativos, onClick }: { ativos: number; onClick: () => void }) {
  return (
    <BotaoTopo label={ativos ? `Preferências · ${ativos} filtro(s) ativo(s)` : 'Preferências'} onClick={onClick} marcado={ativos > 0}>
      <SlidersHorizontal size={20} />
      {ativos > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white ring-2 ring-bg">
          {ativos}
        </span>
      )}
    </BotaoTopo>
  );
}

/** Uma linha de escolha única em chips, com título. */
export function OpcoesChips<T extends string>({
  titulo,
  opcoes,
  value,
  onChange,
}: {
  titulo: string;
  opcoes: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="label">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`chip ${value === o.value ? 'chip-active' : ''}`}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
