import type { CSSProperties } from 'react';
import { ARTE_ERRO } from '@/lib/arte';

/** Pontinhos de tinta que caem com o galho (posições fixas, ao longo do galho). */
const PONTAS = [
  { x: '70%', y: '58%', dx: '12px', r: '140deg', atraso: '1.4s' },
  { x: '78%', y: '54%', dx: '-8px', r: '220deg', atraso: '1.6s' },
  { x: '84%', y: '60%', dx: '18px', r: '90deg', atraso: '1.5s' },
  { x: '90%', y: '52%', dx: '6px', r: '300deg', atraso: '1.8s' },
  { x: '74%', y: '64%', dx: '-14px', r: '60deg', atraso: '1.7s' },
];

/** Árvore cujo galho estala e cai. Para repetir a queda, remonte com outra `key`. */
export function ErroDeRede() {
  const [inteira, tronco, galho] = ARTE_ERRO;
  return (
    <div className="arvore-erro" aria-hidden>
      <img className="erro-tronco" src={tronco} alt="" />
      <img className="erro-galho" src={galho} alt="" />
      <img className="erro-inteira" src={inteira} alt="" />
      {PONTAS.map((p, i) => (
        <i
          key={i}
          className="ponta"
          style={{ left: p.x, top: p.y, '--dx': p.dx, '--r': p.r, animationDelay: p.atraso } as CSSProperties}
        />
      ))}
    </div>
  );
}
