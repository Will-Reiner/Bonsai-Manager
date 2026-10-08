/** `state` de navegação que pede para não voltar ao topo (ex.: deslizar o carrossel troca a URL). */
export const MANTER_ROLAGEM = { manterRolagem: true } as const;

/** Tela nova abre no topo; no "voltar" (POP) ou com `MANTER_ROLAGEM` a rolagem fica onde está. */
export function deveRolarParaTopo(tipo: 'POP' | 'PUSH' | 'REPLACE', state: unknown): boolean {
  if (tipo === 'POP') return false;
  return !(state as { manterRolagem?: boolean } | null | undefined)?.manterRolagem;
}

/** O carrossel só se reposiciona quando a troca não veio do próprio deslizar (deep link, lista mudou). */
export function deveReposicionarCarrossel(p: { painelVisivel: number; atual: number; veioDaRolagem: boolean }): boolean {
  return !p.veioDaRolagem && p.painelVisivel !== p.atual;
}
