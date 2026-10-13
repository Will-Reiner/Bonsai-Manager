import type { Estacao } from '@/types';

/** Valores aprovados na prévia (outono-folhas.html). */
export const PARAMETROS = {
  quantidade: 7,
  tamanho: 17, // px
  variacaoTamanho: 0.35,
  velocidade: 112, // px/s
  fatorVelocidade: 0.55,
  variacaoVelocidade: 0.3,
  vento: 0.4,
  /** Maior passo de tempo por quadro: a aba voltando do fundo não dá salto. */
  dtMaximo: 0.05,
} as const;

/** Neve é ponto de tinta, menor que folha e pétala. */
const ESCALA_NEVE = 0.55;

export type TipoParticula = 'petala' | 'folha' | 'neve';

export interface CenaEstacao {
  tipo: TipoParticula;
  sprites: readonly string[];
  /** Folhas (tinta escura) ficam em 38%, o valor aprovado; pétalas e neve são claras e precisam de mais. */
  opacidade: number;
}

const sprites = (prefixo: string, total: number) =>
  Array.from({ length: total }, (_, i) => `/arte/particulas/${prefixo}-${i + 1}.webp`);

// Objetos fixos: a mesma estação devolve sempre a mesma cena (dependência estável de efeito)
const CENAS: Record<Estacao, CenaEstacao | null> = {
  PRIMAVERA: { tipo: 'petala', sprites: sprites('petala', 15), opacidade: 0.65 },
  VERAO: null,
  OUTONO: { tipo: 'folha', sprites: sprites('folha', 10), opacidade: 0.38 },
  INVERNO: { tipo: 'neve', sprites: [], opacidade: 0.6 },
};

/** O que cai em cada estação; verão = nada. */
export function cenaDaEstacao(e: Estacao): CenaEstacao | null {
  return CENAS[e];
}

/** Estação forçada para conferir as cenas no navegador (só em desenvolvimento). */
export const CHAVE_ESTACAO_TESTE = 'bonsai_estacao_teste';

export function estacaoDasParticulas(real: Estacao, teste: string | null): Estacao {
  return teste && Object.hasOwn(CENAS, teste) ? (teste as Estacao) : real;
}

/** Número em [0, 1), como Math.random. */
export type Sorteio = () => number;

export interface Particula {
  sprite: string | null;
  tamanho: number;
  x: number;
  y: number;
  /** Fator da velocidade de queda (±30%). */
  queda: number;
  /** Balanço lateral, em px. */
  amplitude: number;
  frequencia: number;
  fase: number;
  /** Rotação atual, em graus. */
  giro: number;
  velocidadeGiro: number;
  /** Ritmo da "virada" (achata como se girasse de lado). */
  virada: number;
}

const entre = (sorteio: Sorteio, min: number, max: number) => min + sorteio() * (max - min);

/** Partícula nova: no começo espalhada pela tela; na reposição, logo acima do topo. */
export function sortearParticula(cena: CenaEstacao, largura: number, altura: number, sorteio: Sorteio, inicio: boolean): Particula {
  const { tamanho, variacaoTamanho, variacaoVelocidade } = PARAMETROS;
  const escala = cena.tipo === 'neve' ? ESCALA_NEVE : 1;
  return {
    sprite: cena.sprites.length ? cena.sprites[Math.floor(sorteio() * cena.sprites.length)] : null,
    tamanho: tamanho * escala * entre(sorteio, 1 - variacaoTamanho, 1 + variacaoTamanho),
    x: entre(sorteio, -20, largura),
    y: inicio ? entre(sorteio, -altura * 0.2, altura) : entre(sorteio, -80, -30),
    queda: entre(sorteio, 1 - variacaoVelocidade, 1 + variacaoVelocidade),
    amplitude: entre(sorteio, 12, 34),
    frequencia: entre(sorteio, 0.5, 1.1),
    fase: entre(sorteio, 0, Math.PI * 2),
    giro: entre(sorteio, 0, 360),
    velocidadeGiro: entre(sorteio, -40, 40),
    virada: entre(sorteio, 0.6, 1.6),
  };
}

/** Vento em px/s: sopra para a direita e oscila devagar. */
export function ventoNoTempo(t: number): number {
  return PARAMETROS.vento * 28 * (0.6 + 0.4 * Math.sin(t * 0.25));
}

/** Avança a partícula `dt` segundos (limitado a `dtMaximo`). */
export function mover(p: Particula, dt: number, vento: number): Particula {
  const passo = Math.min(dt, PARAMETROS.dtMaximo);
  return {
    ...p,
    y: p.y + PARAMETROS.velocidade * PARAMETROS.fatorVelocidade * p.queda * passo,
    x: p.x + vento * passo,
    giro: p.giro + p.velocidadeGiro * passo,
  };
}

export interface Desenho {
  x: number;
  y: number;
  rotacao: number;
  escalaX: number;
}

/** Onde e como desenhar no instante `t` (balanço, giro e virada); neve só balança. */
export function desenho(p: Particula, t: number, tipo: TipoParticula): Desenho {
  const balanco = Math.sin(t * p.frequencia + p.fase) * p.amplitude;
  if (tipo === 'neve') return { x: p.x + balanco, y: p.y, rotacao: 0, escalaX: 1 };
  const vira = Math.cos(t * p.virada + p.fase);
  return { x: p.x + balanco, y: p.y, rotacao: p.giro + balanco * 0.8, escalaX: 0.35 + 0.65 * Math.abs(vira) };
}

/** Passou do fundo ou da borda direita: hora de repor no topo. */
export function saiuDaTela(p: Particula, largura: number, altura: number): boolean {
  return p.y > altura + 40 || p.x > largura + 60;
}

/** Preferência "Animações sazonais", guardada no aparelho. */
export const CHAVE_ANIMACOES = 'bonsai_animacoes_sazonais';
export type Animacoes = 'sim' | 'nao';
export const OPCOES_ANIMACOES: { value: Animacoes }[] = [{ value: 'sim' }, { value: 'nao' }];

export function animacoesLigadas({ preferencia, menosMovimento, cena }: { preferencia: Animacoes; menosMovimento: boolean; cena: CenaEstacao | null }): boolean {
  return preferencia === 'sim' && !menosMovimento && cena !== null;
}
