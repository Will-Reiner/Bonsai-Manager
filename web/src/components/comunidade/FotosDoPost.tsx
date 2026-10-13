import { useRef, useState, type MouseEvent } from 'react';
import { Icone } from '@/components/Icone';
import type { FotoDoPost } from '@/types';

/** Fotos do post lado a lado (desliza), quadradas, com pontinhos quando há mais de uma; toque duplo curte. */
export function FotosDoPost({ fotos, onToqueDuplo }: { fotos: FotoDoPost[]; onToqueDuplo?: () => void }) {
  const [atual, setAtual] = useState(0);
  const ultimoToque = useRef(0);
  const [coracao, setCoracao] = useState(0);

  // Dois toques em até 300 ms curtem (como no Instagram); um toque só não faz nada. Toques no vídeo (play/pausa) não contam.
  function tocar(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('video')) return;
    const agora = Date.now();
    if (agora - ultimoToque.current < 300) {
      ultimoToque.current = 0;
      onToqueDuplo?.();
      setCoracao((c) => c + 1);
    } else {
      ultimoToque.current = agora;
    }
  }

  return (
    // touch-manipulation: o toque duplo não dá zoom na página do celular
    <div className="relative touch-manipulation" onClick={onToqueDuplo ? tocar : undefined}>
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
      {coracao > 0 && (
        <span key={coracao} className="pointer-events-none absolute inset-0 flex items-center justify-center text-hanko">
          <Icone nome="curtir" ativo size={88} className="animate-curtida drop-shadow" />
        </span>
      )}
    </div>
  );
}
