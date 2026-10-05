import { isValidElement, useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

const GAP = 12; // px — igual ao gap-3
const PEEK = 28; // px de cada vizinho aparecendo nas bordas

/**
 * Carrossel horizontal em "roda": 2 cards por tela, encaixe ao soltar e um pedaço dos vizinhos nas bordas.
 * Os cards encolhem, giram e esmaecem conforme se afastam do centro, dando a curvatura.
 * `inicio`: índice do card que abre no primeiro dos dois lugares (o navegador limita no fim da lista).
 */
export function Roda({ children, inicio = 0, label }: { children: ReactNode[]; inicio?: number; label: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const quadro = useRef(0);

  const curvar = useCallback(() => {
    quadro.current = 0;
    const box = boxRef.current;
    if (!box) return;
    const centro = box.scrollLeft + box.clientWidth / 2;
    for (const el of box.children as HTMLCollectionOf<HTMLElement>) {
      const passo = el.offsetWidth + GAP;
      // Distância do centro em "cards"; os dois da frente ficam em ±0,5
      const d = (el.offsetLeft + el.offsetWidth / 2 - centro) / passo;
      const longe = Math.min(Math.max(Math.abs(d) - 0.5, 0), 1.5);
      el.style.transform = `perspective(900px) rotateY(${(d * 12).toFixed(2)}deg) scale(${(1 - longe * 0.12).toFixed(3)})`;
      el.style.opacity = (1 - Math.min(longe, 1) * 0.45).toFixed(3);
    }
  }, []);

  const agendar = useCallback(() => {
    if (!quadro.current) quadro.current = requestAnimationFrame(curvar);
  }, [curvar]);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const alvo = box?.children[Math.max(0, inicio)] as HTMLElement | undefined;
    if (box && alvo) box.scrollLeft = alvo.offsetLeft - PEEK;
    curvar();
  }, [inicio, children.length, curvar]);

  useEffect(() => {
    window.addEventListener('resize', agendar);
    return () => {
      window.removeEventListener('resize', agendar);
      cancelAnimationFrame(quadro.current);
    };
  }, [agendar]);

  return (
    <div
      ref={boxRef}
      onScroll={agendar}
      role="list"
      aria-label={label}
      className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingInline: PEEK, scrollPaddingInline: PEEK }}
    >
      {children.map((child, i) => (
        <div key={isValidElement(child) && child.key != null ? child.key : i} role="listitem" className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start will-change-transform">
          {child}
        </div>
      ))}
    </div>
  );
}
