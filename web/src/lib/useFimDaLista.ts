import { useEffect, useRef } from 'react';

/** Chama `aoChegar` quando o sentinela (o ref devolvido) se aproxima da tela; refaz a observação quando `deps` muda. */
export function useFimDaLista(aoChegar: () => void, deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const chamar = useRef(aoChegar);
  useEffect(() => {
    chamar.current = aoChegar;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver((e) => e[0]?.isIntersecting && chamar.current(), { rootMargin: '600px' });
    observador.observe(el);
    return () => observador.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quem chama decide quando refazer (ex.: tamanho da lista)
  }, deps);
  return ref;
}
