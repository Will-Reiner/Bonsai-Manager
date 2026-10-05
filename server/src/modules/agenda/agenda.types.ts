import { AgendaStatus } from '@prisma/client';

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

export interface ConcluirAgendasDTO {
  dataConcluida: string;
  atividadeId?: string;
  detalhes?: string;
  observacaoFutura?: string;
  extras?: string[];
  proximos?: { atividadeId: string; dataAgendada: string }[];
  itens: { agendaId: string; detalhes?: string; observacaoFutura?: string; fotos?: string[] }[];
}

export interface PlanoConclusao {
  usuarioId: string;
  dataConcluida: Date;
  atualizacoes: { agendaId: string; atividadeId?: string; detalhes?: string; observacaoFutura?: string }[];
  fotos: { agendaId: string; plantaId: string; caminhoArquivo: string }[];
  criarConcluidas: { plantaId: string; atividadeId: string; data: Date; detalhes?: string }[];
  criarPendentes: { plantaId: string; atividadeId: string; dataAgendada: Date }[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
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
  proximos?: { atividadeId: string; dataAgendada: string }[];
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
  criarPendentes: { plantaId: string; atividadeId: string; dataAgendada: Date }[];
  revisoes: { plantaId: string; dataAgendada: Date }[];
}

export interface ResultadoConclusao {
  concluidas: any[];
  criadas: any[];
  revisoes: any[];
}

export interface ConclusaoRepository {
  /** Agendas PENDENTE do usuário dentre os ids informados. */
  findPendentesDoUsuario(ids: string[], usuarioId: string): Promise<{ id: string; plantaId: string }[]>;
  atividadesExistem(ids: string[]): Promise<boolean>;
  /** Valor normalizado da preferência (padrão 30, 0 = desligado). */
  getRevisaoDias(usuarioId: string): Promise<number>;
  /** Por planta, a data da próxima PENDENTE com dataAgendada >= aPartirDe, ignorando `excluir` (sem pendente = fora do Map). */
  proximasPendentes(plantaIds: string[], aPartirDe: Date, excluir: string[]): Promise<Map<string, Date>>;
  executar(plano: PlanoConclusao): Promise<ResultadoConclusao>;
  /** Quantas das plantas informadas são do usuário. */
  contarPlantasDoUsuario(plantaIds: string[], usuarioId: string): Promise<number>;
  registrar(plano: PlanoRegistro): Promise<ResultadoConclusao>;
}