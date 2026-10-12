import { Flower2, Leaf, Snowflake, Sun } from 'lucide-react';
import { ESTACOES_LISTA } from '@/lib/cuidados';
import { estacaoAtual } from '@/lib/estacoes';
import type { Estacao } from '@/types';

const ICONE = { PRIMAVERA: Flower2, VERAO: Sun, OUTONO: Leaf, INVERNO: Snowflake } as const;
const DA_PROXIMA: Record<Estacao, string> = { PRIMAVERA: 'a primavera', VERAO: 'o verão', OUTONO: 'o outono', INVERNO: 'o inverno' };
const nome = (e: Estacao) => ESTACOES_LISTA.find((x) => x.valor === e)!.nome;

/** Estação de agora na Bancada: quanto dela já passou e quantos dias faltam para a próxima. */
export function EstacaoDoAno() {
  const { estacao, proxima, diasParaProxima, progresso } = estacaoAtual();
  const Icone = ICONE[estacao];
  const pct = Math.round(progresso * 100);

  return (
    <section className="card mb-3 px-4 py-3" aria-label={`Estação: ${nome(estacao)}`}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <Icone size={18} className="text-accent" /> {nome(estacao)}
        </span>
        <span className="text-muted">
          {diasParaProxima === 1 ? 'amanhã começa' : `${diasParaProxima} dias para`} {DA_PROXIMA[proxima]}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-light"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da estação"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </section>
  );
}
