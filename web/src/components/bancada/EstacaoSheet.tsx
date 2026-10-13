import { Icone } from '@/components/Icone';
import { Sheet } from '@/components/Sheet';
import { ilustracaoDaEstacao } from '@/lib/arte';
import { ESTACOES_LISTA } from '@/lib/cuidados';
import { estacaoAtual, faltaParaProxima, periodoDaEstacao } from '@/lib/estacoes';
import { ICONE_DA_ESTACAO } from '@/lib/icones';

/** Tela da estação: período, dias para a próxima, ilustração grande e as 4 estações (a atual com a pincelada vermelhão). */
export function EstacaoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const atual = estacaoAtual();
  const nome = ESTACOES_LISTA.find((e) => e.valor === atual.estacao)!.nome;

  return (
    <Sheet open={open} onClose={onClose} title={nome}>
      <div className="pb-safe">
        <p className="text-sm text-muted">{periodoDaEstacao(atual.estacao)}</p>
        <p className="text-sm text-muted">{faltaParaProxima(atual)}</p>
        <img src={ilustracaoDaEstacao(atual.estacao)} alt="" className="mx-auto my-4 h-64 w-auto max-w-full object-contain" />
        <ul className="grid grid-cols-4 gap-2 pb-4" aria-label="Estações do ano">
          {ESTACOES_LISTA.map((e) => {
            const eAtual = e.valor === atual.estacao;
            return (
              <li
                key={e.valor}
                aria-current={eAtual ? 'true' : undefined}
                className={`flex flex-col items-center gap-1.5 text-xs font-medium ${eAtual ? 'text-ink' : 'text-muted'}`}
              >
                <Icone nome={ICONE_DA_ESTACAO[e.valor]} size={26} />
                <span className="relative pb-2">
                  {e.nome}
                  {eAtual && <span className="estacao-pincel" />}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
