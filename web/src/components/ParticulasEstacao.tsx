import { useEffect, useRef } from 'react';
import { estacaoAtual } from '@/lib/estacoes';
import { useEscolha } from '@/lib/escolhas';
import { useMenosMovimento } from '@/lib/movimento';
import {
  CHAVE_ANIMACOES,
  CHAVE_ESTACAO_TESTE,
  OPCOES_ANIMACOES,
  PARAMETROS,
  animacoesLigadas,
  cenaDaEstacao,
  desenho,
  estacaoDasParticulas,
  mover,
  saiuDaTela,
  sortearParticula,
  ventoNoTempo,
  type CenaEstacao,
  type Particula,
} from '@/lib/particulas';

/** Só em desenvolvimento: localStorage bonsai_estacao_teste = OUTONO|INVERNO|… força a cena. */
function estacaoDeTeste(): string | null {
  if (!import.meta.env.DEV) return null;
  try {
    return localStorage.getItem(CHAVE_ESTACAO_TESTE);
  } catch {
    return null;
  }
}

function criarNo(cena: CenaEstacao): HTMLElement {
  if (cena.tipo === 'neve') {
    const ponto = document.createElement('span');
    ponto.className = 'particula-neve';
    return ponto;
  }
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  img.className = 'particula';
  return img;
}

/** Ajusta imagem e tamanho do nó para a partícula (só ao nascer ou repor, nunca por quadro). */
function vestir(no: HTMLElement, p: Particula) {
  if (p.sprite && no instanceof HTMLImageElement) no.src = p.sprite;
  no.style.width = `${p.tamanho}px`;
  if (!p.sprite) no.style.height = `${p.tamanho}px`;
}

/** Pétalas, folhas ou neve caindo atrás do conteúdo, conforme a estação. Verão: nada. */
export function ParticulasEstacao() {
  const [preferencia] = useEscolha(CHAVE_ANIMACOES, 'sim', OPCOES_ANIMACOES);
  const menosMovimento = useMenosMovimento();
  const cena = cenaDaEstacao(estacaoDasParticulas(estacaoAtual().estacao, estacaoDeTeste()));
  const ligada = animacoesLigadas({ preferencia, menosMovimento, cena });
  const camada = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = camada.current;
    if (!ligada || !cena || !el) return;

    let largura = window.innerWidth;
    let altura = window.innerHeight;
    const nos: HTMLElement[] = [];
    let particulas: Particula[] = [];
    for (let i = 0; i < PARAMETROS.quantidade; i++) {
      const p = sortearParticula(cena, largura, altura, Math.random, true);
      const no = criarNo(cena);
      vestir(no, p);
      el.appendChild(no);
      nos.push(no);
      particulas.push(p);
    }

    let raf = 0;
    let ultimo = performance.now();
    let t = 0;
    const quadro = (instante: number) => {
      const dt = Math.min((instante - ultimo) / 1000, PARAMETROS.dtMaximo);
      ultimo = instante;
      t += dt;
      const vento = ventoNoTempo(t);
      particulas = particulas.map((p, i) => {
        let q = mover(p, dt, vento);
        if (saiuDaTela(q, largura, altura)) {
          q = sortearParticula(cena, largura, altura, Math.random, false);
          vestir(nos[i], q);
        }
        const d = desenho(q, t, cena.tipo);
        nos[i].style.transform = `translate3d(${d.x}px, ${d.y}px, 0) rotate(${d.rotacao}deg) scaleX(${d.escalaX})`;
        return q;
      });
      raf = requestAnimationFrame(quadro);
    };

    // Aba no fundo: para o laço; ao voltar, recomeça o relógio (sem salto)
    const visibilidade = () => {
      cancelAnimationFrame(raf);
      if (document.hidden) return;
      ultimo = performance.now();
      raf = requestAnimationFrame(quadro);
    };
    const redimensionar = () => {
      largura = window.innerWidth;
      altura = window.innerHeight;
    };

    document.addEventListener('visibilitychange', visibilidade);
    window.addEventListener('resize', redimensionar);
    if (!document.hidden) raf = requestAnimationFrame(quadro);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibilidade);
      window.removeEventListener('resize', redimensionar);
      el.replaceChildren();
    };
  }, [ligada, cena]);

  if (!ligada) return null;
  return (
    <div
      ref={camada}
      aria-hidden="true"
      className="particulas-estacao pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: cena?.opacidade }}
    />
  );
}
