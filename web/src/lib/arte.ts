/** Vasos ilustrados (placeholder de planta sem foto) em web/public/arte/vasos. */
export const TOTAL_VASOS = 7;

/** Vaso estável por planta: hash djb2 do id → vaso-1…vaso-7. */
export function vasoDaPlanta(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  return `/arte/vasos/vaso-${(h % TOTAL_VASOS) + 1}.webp`;
}

/** Camadas da árvore do erro de conexão. */
export const ARTE_ERRO = ['/arte/erro-inteira.webp', '/arte/erro-tronco.webp', '/arte/erro-galho.webp'] as const;

const guardadas: HTMLImageElement[] = [];

/** Baixa a arte do erro na abertura: quando a internet cair no meio do uso, ela já está na memória. */
export function precarregarArteDeErro() {
  if (typeof Image === 'undefined' || guardadas.length) return;
  for (const src of ARTE_ERRO) {
    const img = new Image();
    img.src = src;
    guardadas.push(img);
  }
}
