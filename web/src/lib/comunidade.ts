import type { Planta } from '@/types';

export type ModoPlantas = 'todas' | 'selecionadas';

/** "Todas" não é guardado: é quando toda planta do usuário é pública. */
export function modoPlantas(plantas: Pick<Planta, 'plantaPublica'>[]): ModoPlantas {
  return plantas.every((p) => p.plantaPublica) ? 'todas' : 'selecionadas';
}
