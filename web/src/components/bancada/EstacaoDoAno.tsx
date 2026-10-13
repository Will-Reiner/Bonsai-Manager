import { useState, type CSSProperties } from 'react';
import { Icone } from '@/components/Icone';
import { EstacaoSheet } from '@/components/bancada/EstacaoSheet';
import { ESTACOES_LISTA } from '@/lib/cuidados';
import { estacaoAtual, faltaParaProxima } from '@/lib/estacoes';
import { ICONE_DA_ESTACAO } from '@/lib/icones';

/** Estação de agora na Bancada: ensō com o ícone da estação, dias para a próxima e quanto já passou (em pincelada). Toque abre a tela da estação. */
export function EstacaoDoAno() {
  const [aberta, setAberta] = useState(false);
  const atual = estacaoAtual();
  const nome = ESTACOES_LISTA.find((x) => x.valor === atual.estacao)!.nome;
  const falta = faltaParaProxima(atual);
  const pct = Math.round(atual.progresso * 100);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        aria-label={`${nome}: ${falta}. Ver a estação`}
        className="mb-3 flex w-full items-center gap-3.5 rounded-2xl text-left transition active:scale-[0.99]"
      >
        <span className="relative size-14 shrink-0">
          <img src="/arte/enso.webp" alt="" className="absolute inset-0 size-full opacity-90" />
          <Icone nome={ICONE_DA_ESTACAO[atual.estacao]} size={22} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold italic leading-tight">{nome}</span>
          <span className="block text-sm text-muted">{falta}</span>
          <span className="progresso-pincel mt-1.5 block w-40" style={{ '--pct': `${Math.max(pct, 2)}%` } as CSSProperties} />
        </span>
      </button>
      <EstacaoSheet open={aberta} onClose={() => setAberta(false)} />
    </>
  );
}
