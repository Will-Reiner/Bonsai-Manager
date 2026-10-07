import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { etapaValida, type Fluxo } from '@/lib/fluxos';

const idxHistorico = (): number => (window.history.state as { idx?: number } | null)?.idx ?? 0;

/** Etapa atual em `?etapa=` (com histórico): o voltar do navegador/Android volta uma etapa em vez de sair do fluxo. */
export function useEtapas<T extends string>(fluxo: Fluxo<T>, desvios: readonly T[] = []) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pedida = params.get('etapa');
  const etapa = etapaValida(fluxo, desvios, pedida);
  // Posição no histórico ao entrar no fluxo — para sair de uma vez, pulando as etapas
  const entrada = useRef<number | null>(null);
  if (entrada.current === null) entrada.current = idxHistorico();

  const ir = (e: T, replace = false) => {
    const p = new URLSearchParams(params);
    if (e === fluxo.sequencia[0]) p.delete('etapa');
    else p.set('etapa', e);
    const s = p.toString();
    navigate({ search: s ? `?${s}` : '' }, { replace });
  };

  // Etapa pedida indisponível (recarga, link direto, etapa que sumiu): troca pela válida sem criar histórico
  const corrigir = pedida !== null && pedida !== etapa;
  useEffect(() => {
    if (corrigir) ir(etapa, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corrigir, etapa]);

  return {
    etapa,
    ir,
    avancar() {
      const i = fluxo.sequencia.indexOf(etapa);
      if (i >= 0 && i + 1 < fluxo.sequencia.length) ir(fluxo.sequencia[i + 1]);
    },
    voltar: () => navigate(-1),
    /** Sai do fluxo (após salvar): volta para antes da 1ª etapa; aberto por link direto, vai para `fallback`. */
    sair(fallback = '/') {
      const inicio = entrada.current ?? 0;
      if (inicio > 0) navigate(-(idxHistorico() - inicio + 1));
      else navigate(fallback, { replace: true });
    },
  };
}
