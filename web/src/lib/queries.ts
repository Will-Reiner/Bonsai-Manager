import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agendasApi,
  atividadesApi,
  especiesApi,
  fotosApi,
  plantasApi,
  preferenciasApi,
  rotinasApi,
  tiposRecursoApi,
} from './endpoints';
import { CHAVE_ATALHOS, lerAtalhos, type Atalho } from './atalhos';
import { lerFavoritas } from './favoritas';
import type { Preferencias } from '@/types';

export const keys = {
  plantas: ['plantas'] as const,
  planta: (id: string) => ['plantas', id] as const,
  agendas: ['agendas'] as const,
  fotos: (plantaId: string) => ['fotos', plantaId] as const,
  especies: ['especies'] as const,
  especiesSugeridas: ['especies', 'sugeridas'] as const,
  atividades: ['atividades'] as const,
  tiposRecurso: ['tipos-recurso'] as const,
  preferencias: ['preferencias'] as const,
  rotinas: ['rotinas'] as const,
  me: ['me'] as const,
};

export const usePlantas = () => useQuery({ queryKey: keys.plantas, queryFn: plantasApi.list });
export const usePlanta = (id: string) =>
  useQuery({ queryKey: keys.planta(id), queryFn: () => plantasApi.get(id), enabled: !!id });
export const useAgendas = () => useQuery({ queryKey: keys.agendas, queryFn: agendasApi.list });
/** Todas as rotinas do usuário (um cache só; filtre por planta no componente). */
export const useRotinas = () => useQuery({ queryKey: keys.rotinas, queryFn: rotinasApi.list });
export const useFotos = (plantaId: string) =>
  useQuery({ queryKey: keys.fotos(plantaId), queryFn: () => fotosApi.listByPlanta(plantaId) });
export const useEspecies = () =>
  useQuery({ queryKey: keys.especies, queryFn: especiesApi.list, staleTime: 5 * 60_000 });
export const useAtividades = () =>
  useQuery({ queryKey: keys.atividades, queryFn: atividadesApi.list, staleTime: 5 * 60_000 });
export const useTiposRecurso = () => useQuery({ queryKey: keys.tiposRecurso, queryFn: tiposRecursoApi.list });

export const usePreferencias = () =>
  useQuery({ queryKey: keys.preferencias, queryFn: preferenciasApi.get, staleTime: 5 * 60_000 });

/** Dias em Recém transplantada após um Transplante (padrão 15, 1–365) — mesma regra do backend. */
export function useTransplanteDias() {
  const prefs = usePreferencias();
  const dias = parseInt(prefs.data?.transplante_dias ?? '15', 10);
  return Number.isNaN(dias) ? 15 : Math.min(365, Math.max(1, dias));
}

/** Dias antes de um Transplante agendado em que a planta entra no Pré-transplante (padrão 30, 1–365) — mesma regra do backend. */
export function usePreTransplanteDias() {
  const prefs = usePreferencias();
  const dias = parseInt(prefs.data?.pre_transplante_dias ?? '30', 10);
  return Number.isNaN(dias) ? 30 : Math.min(365, Math.max(1, dias));
}

/** "Mover para Recém transplantadas" vem marcado ao registrar/concluir um Transplante? (padrão sim; última escolha). */
export function useMoverRecemTransplantada() {
  const prefs = usePreferencias();
  return prefs.data?.mover_recem_transplantada !== 'nao';
}

/** Lembra a escolha de "Mover para Recém transplantadas" como preferência da conta (em segundo plano). */
export function useLembrarMover() {
  const queryClient = useQueryClient();
  const atual = useMoverRecemTransplantada();
  return (usado: boolean) => {
    if (usado === atual) return;
    preferenciasApi
      .set('mover_recem_transplantada', usado ? 'sim' : 'nao')
      .then(() => queryClient.invalidateQueries({ queryKey: keys.preferencias }))
      .catch(() => {
        // falhou: só não lembra a escolha desta vez
      });
  };
}

/** Atalhos do Acesso rápido (preferência `atalhos_bancada`). */
export function useAtalhos() {
  const prefs = usePreferencias();
  return lerAtalhos(prefs.data?.atalhos_bancada);
}

/** Grava a lista de atalhos a partir da última do cache (duas edições seguidas não se perdem). */
export function useSalvarAtalhos() {
  const queryClient = useQueryClient();
  return async (mudar: (atuais: Atalho[]) => Atalho[]) => {
    // Sem as preferências no cache, busca antes: partir de uma lista vazia apagaria os atalhos salvos
    const prefs = await queryClient.ensureQueryData({ queryKey: keys.preferencias, queryFn: preferenciasApi.get });
    const atuais = lerAtalhos(prefs.atalhos_bancada);
    const valor = JSON.stringify(mudar(atuais));
    await preferenciasApi.set(CHAVE_ATALHOS, valor);
    queryClient.setQueryData<Preferencias>(keys.preferencias, (p) => ({ ...p, [CHAVE_ATALHOS]: valor }));
    await queryClient.invalidateQueries({ queryKey: keys.preferencias });
  };
}

/** Atividades ordenadas: as rastreadas nas preferências do usuário primeiro. */
export function useAtividadesOrdenadas() {
  const atividades = useAtividades();
  const prefs = usePreferencias();
  const rastreadas = lerFavoritas(prefs.data?.atividades_rastreadas);
  const lista = [...(atividades.data ?? [])].sort((a, b) => {
    const ra = rastreadas.includes(a.id) ? 0 : 1;
    const rb = rastreadas.includes(b.id) ? 0 : 1;
    return ra - rb || a.nome.localeCompare(b.nome, 'pt-BR');
  });
  return { ...atividades, data: lista };
}
