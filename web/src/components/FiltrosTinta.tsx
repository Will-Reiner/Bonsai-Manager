/** Filtros SVG da tinta, usados pelo CSS como url(#tinta-aspera) e url(#tinta-mancha). Montado uma vez na raiz. */
export function FiltrosTinta() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <filter id="tinta-aspera">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
        <feDisplacementMap in="SourceGraphic" scale={2.2} />
      </filter>
      <filter id="tinta-mancha">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves={2} seed={3} />
        <feDisplacementMap in="SourceGraphic" scale={4} />
      </filter>
    </svg>
  );
}
