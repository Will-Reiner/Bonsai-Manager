import { GRUPO_CORES, grupoLabel } from '@/lib/format';
import type { GrupoPlanta } from '@/types';

/** Selo do grupo da planta; sem grupo não mostra nada. */
export function GrupoBadge({ grupo, className = '' }: { grupo?: GrupoPlanta | null; className?: string }) {
  if (!grupo) return null;
  return (
    <span className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ${GRUPO_CORES[grupo]} ${className}`}>
      {grupoLabel(grupo)}
    </span>
  );
}
