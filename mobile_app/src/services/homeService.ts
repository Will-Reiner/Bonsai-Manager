import { agendaService } from './agendaService';
import { plantaService } from './plantaService';
import { Agenda, Planta } from '../types';
import { isOverdue } from '../utils/dateHelpers';

export interface HomeData {
  plantas: Planta[];
  agendamentos: Agenda[];
  stats: {
    totalPlantas: number;
    tarefasAtrasadas: number;
    tarefasPendentes: number;
    transplantePendente: number;
    adubacaoSemana: number;
    plantasAtencao: number;
    concluidos: number;
  };
}

/**
 * Agrega dados da Home a partir de agenda + plantas.
 */
export const fetchHomeData = async (): Promise<HomeData> => {
  const [plantas, agendamentos] = await Promise.all([
    plantaService.getMinhasPlantas(),
    agendaService.getMinhaAgenda(),
  ]);

  const pendentes = agendamentos.filter(a => a.status === 'PENDENTE');
  const concluidos = agendamentos.filter(a => a.status === 'CONCLUIDO');

  const atrasadas = pendentes.filter(a => isOverdue(a.dataAgendada));

  // Transplantes pendentes (filtrar por nome da atividade)
  const transplantePendente = pendentes.filter(a =>
    a.atividade?.nome?.toLowerCase().includes('transplant')
  ).length;

  // Adubação da semana
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const adubacaoSemana = pendentes.filter(a => {
    const isAdubacao = a.atividade?.nome?.toLowerCase().includes('aduba');
    const dataAgendada = new Date(a.dataAgendada);
    return isAdubacao && dataAgendada <= endOfWeek;
  }).length;

  // Plantas que precisam de atenção: têm tarefas atrasadas
  const plantasComAtrasosSet = new Set(atrasadas.map(a => a.plantaId));
  const plantasAtencao = plantasComAtrasosSet.size;

  return {
    plantas,
    agendamentos,
    stats: {
      totalPlantas: plantas.length,
      tarefasAtrasadas: atrasadas.length,
      tarefasPendentes: pendentes.length,
      transplantePendente,
      adubacaoSemana,
      plantasAtencao,
      concluidos: concluidos.length,
    },
  };
};
