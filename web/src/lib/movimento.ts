import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function assinar(avisar: () => void) {
  if (typeof matchMedia === 'undefined') return () => {};
  const mq = matchMedia(CONSULTA);
  mq.addEventListener('change', avisar);
  return () => mq.removeEventListener('change', avisar);
}

const agora = () => typeof matchMedia !== 'undefined' && matchMedia(CONSULTA).matches;

/** O sistema pediu menos movimento? Acompanha a mudança com o app aberto. */
export function useMenosMovimento(): boolean {
  return useSyncExternalStore(assinar, agora, () => false);
}
