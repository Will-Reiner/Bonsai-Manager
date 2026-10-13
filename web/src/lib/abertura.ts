/** Abertura (vídeo + marca) uma vez por sessão: fases e transições. O componente só desenha. */

export type FaseAbertura = 'video' | 'marca' | 'saindo' | 'fim';
export type EventoAbertura = 'marca' | 'falhou' | 'toque' | 'tempo' | 'saiu';

/** sessionStorage: presente = abertura já mostrada nesta sessão. */
export const CHAVE_ABERTURA = 'nagare_abertura_vista';
export const VIDEO_ABERTURA = '/abertura.mp4';

/** Vídeo que não começa a tocar nesse prazo é deixado de lado: só a marca. */
export const LIMITE_CARREGAR_MS = 1500;
/** Vídeo que trava no meio: desiste depois desse tempo tocando. */
export const LIMITE_VIDEO_MS = 11000;
/** Ponto do vídeo (s) em que a árvore está pronta e a marca aparece embaixo. */
export const MOMENTO_MARCA_S = 5.5;
/** Quanto tempo a marca fica antes de sumir. */
export const MARCA_MS = 2400;
/** Duração do fade de saída (igual à transição do CSS `.abertura`). */
export const SAIDA_MS = 600;

export function faseInicial({ jaVista, menosMovimento }: { jaVista: boolean; menosMovimento: boolean }): FaseAbertura {
  if (jaVista) return 'fim';
  return menosMovimento ? 'marca' : 'video';
}

export function proximaFase(fase: FaseAbertura, evento: EventoAbertura): FaseAbertura {
  switch (fase) {
    case 'video':
      return evento === 'marca' || evento === 'falhou' || evento === 'toque' ? 'marca' : fase;
    case 'marca':
      return evento === 'tempo' || evento === 'toque' ? 'saindo' : fase;
    case 'saindo':
      return evento === 'saiu' ? 'fim' : fase;
    default:
      return fase;
  }
}
