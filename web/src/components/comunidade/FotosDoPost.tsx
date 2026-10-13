import { useState } from 'react';
import type { FotoDoPost } from '@/types';

/** Fotos do post lado a lado (desliza), quadradas, com pontinhos quando há mais de uma. */
export function FotosDoPost({ fotos }: { fotos: FotoDoPost[] }) {
  const [atual, setAtual] = useState(0);
  return (
    <div className="relative">
      <div
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {fotos.map((f) => (
          <div key={f.id} className="aspect-square w-full shrink-0 snap-center bg-vazio">
            {f.tipo === 'VIDEO' ? (
              <video src={f.url} poster={f.thumbnailUrl ?? undefined} controls playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              <img src={f.url} alt="" loading="lazy" className="size-full object-cover" />
            )}
          </div>
        ))}
      </div>
      {fotos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
          {fotos.map((f, i) => (
            <span key={f.id} className={`size-1.5 rounded-full ${i === atual ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
