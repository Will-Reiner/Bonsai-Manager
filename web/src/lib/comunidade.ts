import type { Planta } from '@/types';

export type ModoPlantas = 'todas' | 'selecionadas';

/** "Todas" não é guardado: é quando toda planta do usuário é pública. Sem a lista (carregando/erro), não há modo. */
export function modoPlantas(plantas: Pick<Planta, 'plantaPublica'>[] | undefined): ModoPlantas | null {
  if (!plantas) return null;
  return plantas.every((p) => p.plantaPublica) ? 'todas' : 'selecionadas';
}
