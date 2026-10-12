import type { CSSProperties } from 'react';
import { Icone } from '@/components/Icone';
import { ESTACOES_LISTA } from '@/lib/cuidados';
import { estacaoAtual } from '@/lib/estacoes';
import type { NomeIcone } from '@/lib/icones';
import type { Estacao } from '@/types';

const ICONE: Record<Estacao, NomeIcone> = { PRIMAVERA: 'primavera', VERAO: 'verao', OUTONO: 'outono', INVERNO: 'inverno' };
const DA_PROXIMA: Record<Estacao, string> = { PRIMAVERA: 'a primavera', VERAO: 'o verão', OUTONO: 'o outono', INVERNO: 'o inverno' };
const nome = (e: Estacao) => ESTACOES_LISTA.find((x) => x.valor === e)!.nome;

/** Estação de agora na Bancada: ensō com o ícone da estação, dias para a próxima e quanto já passou (em pincelada). */
export function EstacaoDoAno() {
  const { estacao, proxima, diasParaProxima, progresso } = estacaoAtual();
  const pct = Math.round(progresso * 100);

  return (
    <section className="mb-3 flex items-center gap-3.5" aria-label={`Estação: ${nome(estacao)}`}>
      <span className="relative size-14 shrink-0">
        <img src="/arte/enso.webp" alt="" className="absolute inset-0 size-full opacity-90" />
        <Icone nome={ICONE[estacao]} size={22} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold italic leading-tight">{nome(estacao)}</p>
        <p className="text-sm text-muted">
          {diasParaProxima === 1 ? 'amanhã começa' : `${diasParaProxima} dias para`} {DA_PROXIMA[proxima]}
        </p>
        <div
          className="progresso-pincel mt-1.5 w-40"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da estação"
          style={{ '--pct': `${Math.max(pct, 2)}%` } as CSSProperties}
        />
      </div>
    </section>
  );
}
