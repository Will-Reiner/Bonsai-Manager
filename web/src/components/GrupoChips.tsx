import { GRUPOS_MANUAIS, type GrupoPlanta } from '@/types';

/** Escolha do grupo da planta; tocar no ativo deixa sem grupo. */
export function GrupoChips({ value, onChange }: { value: GrupoPlanta | null; onChange: (g: GrupoPlanta | null) => void }) {
  return (
    <div>
      <span className="label">Grupo</span>
      <div className="flex flex-wrap gap-2">
        {GRUPOS_MANUAIS.map((g) => (
          <button
            key={g.value}
            type="button"
            className={`chip ${value === g.value ? 'chip-active' : ''}`}
            onClick={() => onChange(value === g.value ? null : g.value)}
            aria-pressed={value === g.value}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
