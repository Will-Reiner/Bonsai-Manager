import { Estacao } from '../types';

interface SeasonInfo {
  estacao: Estacao;
  label: string;
  icon: string;
  inicio: Date;
  fim: Date;
}

/**
 * Retorna as estações do ano para o hemisfério sul (Brasil).
 */
const getSeasonsForYear = (year: number): SeasonInfo[] => [
  {
    estacao: 'OUTONO',
    label: 'Outono',
    icon: 'leaf',
    inicio: new Date(year, 2, 20),  // 20 Mar
    fim: new Date(year, 5, 20),     // 20 Jun
  },
  {
    estacao: 'INVERNO',
    label: 'Inverno',
    icon: 'snowflake',
    inicio: new Date(year, 5, 21),  // 21 Jun
    fim: new Date(year, 8, 21),     // 21 Set
  },
  {
    estacao: 'PRIMAVERA',
    label: 'Primavera',
    icon: 'flower',
    inicio: new Date(year, 8, 22),  // 22 Set
    fim: new Date(year, 11, 20),    // 20 Dez
  },
  {
    estacao: 'VERAO',
    label: 'Verão',
    icon: 'white-balance-sunny',
    inicio: new Date(year, 11, 21), // 21 Dez
    fim: new Date(year + 1, 2, 19), // 19 Mar do ano seguinte
  },
];

/**
 * Retorna a estação atual com base na data.
 */
export const getCurrentSeason = (date: Date = new Date()): SeasonInfo => {
  const year = date.getFullYear();
  const seasons = getSeasonsForYear(year);

  for (const season of seasons) {
    if (date >= season.inicio && date <= season.fim) {
      return season;
    }
  }

  // Se não encontrou (ex: Jan-Mar pode ser verão do ano anterior)
  const prevSeasons = getSeasonsForYear(year - 1);
  const verao = prevSeasons.find(s => s.estacao === 'VERAO');
  if (verao && date >= verao.inicio && date <= verao.fim) {
    return verao;
  }

  // Fallback — verão corrente
  return seasons.find(s => s.estacao === 'VERAO') || seasons[0];
};

/**
 * Retorna o progresso (0–1) da estação atual.
 */
export const getSeasonProgress = (date: Date = new Date()): number => {
  const season = getCurrentSeason(date);
  const total = season.fim.getTime() - season.inicio.getTime();
  const elapsed = date.getTime() - season.inicio.getTime();
  return Math.min(Math.max(elapsed / total, 0), 1);
};

/**
 * Retorna o tempo restante até a próxima estação em dias.
 */
export const getTimeUntilNextSeason = (date: Date = new Date()): number => {
  const season = getCurrentSeason(date);
  const diff = season.fim.getTime() - date.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
};

/**
 * Calcula a idade de uma planta a partir da data de aquisição.
 */
export const calculatePlantAge = (dataAquisicao: string | null | undefined): string => {
  if (!dataAquisicao) return 'Desconhecida';

  const start = new Date(dataAquisicao);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 30) return `${days} dia${days !== 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} ano${years !== 1 ? 's' : ''}`;
  return `${years} ano${years !== 1 ? 's' : ''} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
};

/**
 * Verifica se uma data agendada está em atraso (passada e não concluída).
 */
export const isOverdue = (dataAgendada: string): boolean => {
  const scheduled = new Date(dataAgendada);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return scheduled < today;
};

/**
 * Retorna dica sazonal genérica baseada na estação atual.
 */
export const getSeasonalTip = (): string => {
  const season = getCurrentSeason();
  const tips: Record<Estacao, string> = {
    PRIMAVERA: 'Época ideal para transplantes, podas de formação e adubação rica em nitrogénio. As plantas estão em pleno crescimento!',
    VERAO: 'Atenção redobrada à rega — o calor intenso exige hidratação frequente. Evite podas drásticas nesta estação.',
    OUTONO: 'Reduza a adubação e prepare as plantas para o repouso invernal. Bom momento para aramações.',
    INVERNO: 'Período de dormência. Reduza a rega e evite transplantes. Aproveite para planejar os cuidados da primavera.',
  };
  return tips[season.estacao];
};
