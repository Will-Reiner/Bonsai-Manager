import type { CSSProperties } from 'react';

/** Carimbo vermelho 流 (marca Nagare). Decorativo. */
export function Hanko({ tamanho = 34, className = '' }: { tamanho?: number; className?: string }) {
  return (
    <span aria-hidden className={`hanko ${className}`} style={{ '--hanko-tam': `${tamanho}px` } as CSSProperties}>
      流
    </span>
  );
}
