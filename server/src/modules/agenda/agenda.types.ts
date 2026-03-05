import { AgendaStatus } from '@prisma/client';

export interface CreateAgendaDTO {
  plantaId: string;
  atividadeId: string;
  dataAgendada: string;
  observacoes?: string;
}

export interface UpdateAgendaDTO {
  dataAgendada?: string;
  dataConcluida?: string | null;
  status?: AgendaStatus;
  observacoes?: string;
  detalhes?: string;
  observacaoFutura?: string;
  recursosUtilizados?: {
    recursoId: string;
    quantidadeUtilizada: number;
  }[];
}

export interface AgendaRepository {
  create(data: CreateAgendaDTO): Promise<any>;
  findManyByUser(usuarioId: string): Promise<any[]>;
  findByIdAndUser(id: string, usuarioId: string): Promise<any | null>;
  update(id: string, data: Omit<UpdateAgendaDTO, 'recursosUtilizados'>): Promise<any>;
  updateWithResources(id: string, data: UpdateAgendaDTO): Promise<any>;
  delete(id: string): Promise<void>;
  existsByIdAndUser(id: string, usuarioId: string): Promise<boolean>;
  checkPlantaBelongsToUser(plantaId: string, usuarioId: string): Promise<boolean>;
}