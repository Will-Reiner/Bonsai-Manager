import { GRUPO_CORES, estiloFaixa, grupoLabel } from '@/lib/format';
import type { GrupoPlanta } from '@/types';

/** Selo do grupo da planta; sem grupo não mostra nada. */
export function GrupoBadge({ grupo, className = '' }: { grupo?: GrupoPlanta | null; className?: string }) {
  if (!grupo) return null;
  return (
    <span
      className={`selo inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ${className}`}
      style={estiloFaixa(GRUPO_CORES[grupo])}
    >
      {grupoLabel(grupo)}
    </span>
  );
}
