import { RotinaBase } from '../agenda/dominio/rotina';

export interface CriarRotinasDTO {
  plantaIds: string[];
  atividadeIds: string[];
  intervaloDias: number;
  dataFim?: string;
  /** Data da 1ª tarefa; padrão = hoje + intervalo. */
  primeiraData?: string;
  detalhes?: string;
}

export interface AtualizarRotinaDTO {
  intervaloDias?: number;
  dataFim?: string | null;
}

export interface RotinaInfo extends RotinaBase {
  pendenteId: string | null;
  ultimaConclusao: Date | null;
}

export interface NovaRotina {
  plantaId: string;
  atividadeId: string;
  intervaloDias: number;
  dataFim: Date | null;
  primeiraData: Date;
  detalhes?: string;
}

/** O que fazer com a pendente da rotina ao mudar a rotina. */
export type AjustePendente =
  | { tipo: 'manter' }
  | { tipo: 'mover'; agendaId: string; data: Date }
  | { tipo: 'cancelar'; agendaId: string }
  | { tipo: 'criar'; data: Date };

export interface RotinaRepository {
  contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>;
  atividadesExistem(ids: string[]): Promise<boolean>;
  /** Pares (planta, atividade) que já têm rotina. */
  existentes(plantaIds: string[], atividadeIds: string[]): Promise<{ plantaId: string; atividadeId: string }[]>;
  /** Cria as rotinas e a 1ª pendente de cada (tudo ou nada). */
  criar(itens: NovaRotina[]): Promise<any[]>;
  listar(usuarioId: string, plantaId?: string): Promise<any[]>;
  findDoUsuario(id: string, usuarioId: string): Promise<RotinaInfo | null>;
  /** Atualiza a rotina e ajusta a pendente numa transação. */
  atualizar(
    id: string,
    dados: { intervaloDias?: number; dataFim?: Date | null; pausada?: boolean },
    ajuste: AjustePendente,
  ): Promise<any>;
  /** Cancela a pendente e apaga a rotina (o histórico fica, sem vínculo). */
  apagar(id: string): Promise<void>;
}
