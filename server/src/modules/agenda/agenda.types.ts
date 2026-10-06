import { AgendaStatus } from '@prisma/client';
import { PendenteReconciliavel } from './dominio/reconciliar';
import { Estacao } from './dominio/estacoes';
import { RevisaoEstado, RotinaEstado } from './dominio/rotina';
import { EstadoGrupo } from '../planta/dominio/grupo';

export interface CreateAgendaDTO {
  plantaId: string;
  atividadeId: string;
  dataAgendada: string;
  observacoes?: string;
  detalhes?: string;
}

export interface CreateAgendasLoteDTO {
  plantaIds: string[];
  atividadeIds: string[];
  dataAgendada: string;
  /** Instrução para quando o cuidado for feito (ex.: qual adubo usar). */
  detalhes?: string;
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
  /** Cria todas numa transação: ou entram todas, ou nenhuma. */
  createMany(data: CreateAgendaDTO[]): Promise<any[]>;
  findManyByUser(usuarioId: string): Promise<any[]>;
  findByIdAndUser(id: string, usuarioId: string): Promise<any | null>;
  update(id: string, data: Omit<UpdateAgendaDTO, 'recursosUtilizados'>): Promise<any>;
  updateWithResources(id: string, data: UpdateAgendaDTO): Promise<any>;
  delete(id: string): Promise<void>;
  existsByIdAndUser(id: string, usuarioId: string): Promise<boolean>;
  checkPlantaBelongsToUser(plantaId: string, usuarioId: string): Promise<boolean>;
  /** Quantas das plantas informadas são do usuário. */
  contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>;
  /** true se todas as atividades informadas (sem repetição) existem. */
  atividadesExistem(ids: string[]): Promise<boolean>;
}

export const ATIVIDADE_REVISAO = 'Revisão geral';
export const PREF_REVISAO_DIAS = 'revisao_automatica_dias';
export const ATIVIDADE_TRANSPLANTE = 'Transplante';
export const PREF_TRANSPLANTE_DIAS = 'transplante_dias';

export type AtualizacaoGrupo = { plantaId: string } & EstadoGrupo;

/** Próximo passo; com `repetir`, vira (ou usa) a rotina da planta+atividade. */
export interface Proximo {
  atividadeId: string;
  dataAgendada: string;
  repetir?: { intervaloDias: number; dataFim?: string; estacoes?: Estacao[] };
}

export interface NovaRotinaDePasso {
  plantaId: string;
  atividadeId: string;
  intervaloDias: number;
  dataFim: Date | null;
  estacoes: Estacao[];
  dataAgendada: Date;
}

export interface ConcluirAgendasDTO {
  dataConcluida: string;
  atividadeId?: string;
  detalhes?: string;
  observacaoFutura?: string;
  extras?: string[];
  proximos?: Proximo[];
  itens: { agendaId: string; detalhes?: string; observacaoFutura?: string; fotos?: string[] }[];
}

/** Pendente a criar; com `rotinaId` quando é a próxima de uma rotina. */
export interface NovaPendente {
  plantaId: string;
  atividadeId: string;
  dataAgendada: Date;
  rotinaId?: string;
}

export interface PlanoConclusao {
  usuarioId: string;
  dataConcluida: Date;
  atualizacoes: {
    agendaId: string;
    atividadeId?: string;
    detalhes?: string;
    observacaoFutura?: string;
    /** Tarefa de rotina concluída como outra atividade: deixa de pertencer à rotina. */
    desvincularRotina?: boolean;
  }[];
  fotos: { agendaId: string; plantaId: string; caminhoArquivo: string }[];
  criarConcluidas: { plantaId: string; atividadeId: string; data: Date; detalhes?: string }[];
  criarPendentes: NovaPendente[];
  criarRotinas: NovaRotinaDePasso[];
  /** Pendentes (Revisão geral) remarcadas para uma nova data. */
  moverPendentes: { agendaId: string; dataAgendada: Date }[];
}

export interface RegistrarCuidadosDTO {
  data: string;
  plantas: {
    plantaId: string;
    atividadeIds: string[];
    detalhes?: string;
    observacaoFutura?: string;
    fotos?: { caminhoArquivo: string; dataCaptura?: string }[];
  }[];
  proximos?: Proximo[];
  /** Pendentes que este registro conclui (escolhidas na tela). */
  concluirAgendaIds?: string[];
  /** Plantas com Transplante registrado vão para Recém transplantada (por `transplante_dias`). */
  moverRecemTransplantada?: boolean;
}

export interface PlanoRegistro {
  usuarioId: string;
  data: Date;
  /** Uma entrada por planta; detalhes/obs. e fotos vão no primeiro cuidado dela. */
  cuidados: {
    plantaId: string;
    atividadeIds: string[];
    detalhes?: string;
    observacaoFutura?: string;
    fotos: { caminhoArquivo: string; dataCaptura: Date }[];
  }[];
  /** Pendentes que viram o registro do cuidado (em vez de criar agenda nova). */
  absorver: { agendaId: string; plantaId: string; atividadeId: string }[];
  /** Pendentes repetidas do mesmo cuidado: canceladas. */
  cancelar: string[];
  criarPendentes: NovaPendente[];
  criarRotinas: NovaRotinaDePasso[];
  /** Pendentes (Revisão geral) remarcadas para uma nova data. */
  moverPendentes: { agendaId: string; dataAgendada: Date }[];
  /** Mudanças de grupo (Transplante → Recém transplantada). */
  atualizarGrupos: AtualizacaoGrupo[];
}

export interface ResultadoConclusao {
  concluidas: any[];
  criadas: any[];
}

export interface ConclusaoRepository {
  /** Agendas PENDENTE do usuário dentre os ids informados. */
  findPendentesDoUsuario(
    ids: string[],
    usuarioId: string,
  ): Promise<{ id: string; plantaId: string; atividadeId: string; rotinaId: string | null }[]>;
  /** Agendas PENDENTE do usuário dentre os ids, com planta, atividade e data. */
  findPendentesParaReconciliar(ids: string[], usuarioId: string): Promise<PendenteReconciliavel[]>;
  atividadesExistem(ids: string[]): Promise<boolean>;
  /** Rotinas de Revisão geral das plantas, com a pendente atual (ignorando `excluirAgendaIds`). */
  revisoesDasPlantas(plantaIds: string[], excluirAgendaIds: string[]): Promise<RevisaoEstado[]>;
  /** Estado das rotinas; `temPendente` ignora as agendas em `excluirAgendaIds` (as que estão sendo concluídas). */
  estadoRotinas(rotinaIds: string[], excluirAgendaIds: string[]): Promise<RotinaEstado[]>;
  executar(plano: PlanoConclusao): Promise<ResultadoConclusao>;
  /** Quantas das plantas informadas são do usuário. */
  contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>;
  registrar(plano: PlanoRegistro): Promise<ResultadoConclusao>;
  /** Id da atividade Transplante (null se não existir), dias da preferência e grupo atual das plantas do usuário. */
  transplanteDasPlantas(
    plantaIds: string[],
    usuarioId: string,
  ): Promise<{ atividadeId: string | null; dias: number; plantas: AtualizacaoGrupo[] }>;
}