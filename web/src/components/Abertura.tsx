import { useEffect, useReducer, useRef, useState } from 'react';
import { Hanko } from '@/components/Hanko';
import {
  CHAVE_ABERTURA,
  LIMITE_CARREGAR_MS,
  LIMITE_VIDEO_MS,
  MARCA_MS,
  MOMENTO_MARCA_S,
  SAIDA_MS,
  VIDEO_ABERTURA,
  faseInicial,
  proximaFase,
} from '@/lib/abertura';
import { useMenosMovimento } from '@/lib/movimento';

function jaVista(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_ABERTURA) !== null;
  } catch {
    return false;
  }
}

function marcarVista() {
  try {
    sessionStorage.setItem(CHAVE_ABERTURA, '1');
  } catch {
    // sem armazenamento: a abertura pode voltar ao recarregar
  }
}

/** Tela cheia na primeira abertura da sessão: a árvore se pinta, a marca aparece embaixo e tudo some. Tocar pula. */
export function Abertura() {
  const menosMovimento = useMenosMovimento();
  const [fase, enviar] = useReducer(proximaFase, undefined, () => faseInicial({ jaVista: jaVista(), menosMovimento }));
  const video = useRef<HTMLVideoElement>(null);
  const tocando = useRef(false);
  // Vídeo que falhou ou demorou some de vez (não pode surgir depois, por cima da marca)
  const [semVideo, setSemVideo] = useState(menosMovimento);

  function falhar() {
    video.current?.pause();
    setSemVideo(true);
    enviar('falhou');
  }

  useEffect(() => {
    if (fase !== 'fim') marcarVista();
  }, [fase]);

  // Vídeo: dá play (autoplay pode ser recusado) e desiste se não começar ou se travar
  useEffect(() => {
    if (fase !== 'video') return;
    video.current?.play().catch(falhar);
    const carregar = setTimeout(() => {
      if (!tocando.current) falhar();
    }, LIMITE_CARREGAR_MS);
    const travou = setTimeout(falhar, LIMITE_VIDEO_MS);
    return () => {
      clearTimeout(carregar);
      clearTimeout(travou);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- falhar só usa refs e setters estáveis
  }, [fase]);

  useEffect(() => {
    if (fase === 'marca') {
      const t = setTimeout(() => enviar('tempo'), MARCA_MS);
      return () => clearTimeout(t);
    }
    if (fase === 'saindo') {
      const t = setTimeout(() => enviar('saiu'), SAIDA_MS);
      return () => clearTimeout(t);
    }
  }, [fase]);

  if (fase === 'fim') return null;

  return (
    <div aria-hidden className="abertura" data-fase={fase} onClick={() => enviar('toque')}>
      {!semVideo && (
        <video
          ref={video}
          className="abertura-video"
          src={VIDEO_ABERTURA}
          muted
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          onPlaying={() => {
            tocando.current = true;
          }}
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime >= MOMENTO_MARCA_S) enviar('marca');
          }}
          onEnded={() => enviar('marca')}
          onError={falhar}
        />
      )}
      <div className="abertura-marca">
        <Hanko tamanho={44} />
        <p className="mt-4 font-display text-[40px] leading-none font-semibold italic text-ink">Nagare</p>
        <p className="mt-2.5 text-[12px] font-semibold tracking-[0.32em] text-muted">BONSAI · CADERNO</p>
      </div>
    </div>
  );
}
