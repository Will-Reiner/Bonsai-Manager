/**
 * Mapeamento de nomes de atividade para ícones MaterialCommunityIcons.
 */

const ACTIVITY_ICON_MAP: Record<string, string> = {
  aramacao: 'vector-curve',
  aramação: 'vector-curve',
  poda: 'content-cut',
  rega: 'water',
  adubacao: 'leaf-circle',
  adubação: 'leaf-circle',
  transplante: 'flower-pollen',
  limpeza: 'broom',
  tratamento: 'medical-bag',
  pinçagem: 'hand-pointing-up',
  pincagem: 'hand-pointing-up',
  desfolha: 'leaf-off',
  jin: 'tree',
  shari: 'tree',
  nebari: 'source-branch',
  selagem: 'shield-check',
  aplicacao: 'spray',
  aplicação: 'spray',
};

const DEFAULT_ICON = 'clipboard-text-outline';

/**
 * Retorna o nome do ícone MaterialCommunityIcons para uma atividade.
 */
export const getActivityIcon = (nomeAtividade: string): string => {
  const normalized = nomeAtividade.toLowerCase().trim();

  // Busca direta
  if (ACTIVITY_ICON_MAP[normalized]) {
    return ACTIVITY_ICON_MAP[normalized];
  }

  // Busca parcial — verifica se o nome contém alguma chave
  for (const [key, icon] of Object.entries(ACTIVITY_ICON_MAP)) {
    if (normalized.includes(key)) {
      return icon;
    }
  }

  return DEFAULT_ICON;
};
