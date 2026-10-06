// Tipos espelhando os DTOs do backend (adaptado de mobile_app/src/types/index.ts)

export type Role = 'USER' | 'ADMIN';
export type AgendaStatus = 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';
export type ModoAquisicao = 'SEMENTE' | 'ESTACA' | 'ALPORQUIA' | 'YAMADORI' | 'COMPRA';
export type TipoPlanta = 'PERENE' | 'CADUCIFOLIA' | 'SEMI_CADUCA' | 'ARVORE' | 'ARBUSTO' | 'CONIFERA';
export type StatusEspecie = 'VERIFICADO' | 'SUGERIDO';
export type TipoMidia = 'FOTO' | 'VIDEO' | 'VISAO_FUTURA';

export interface Usuario {
  id: string;
  nome: string;
  nomePublico?: string | null;
  email: string;
  localidade?: string | null;
  fotoPerfilUrl?: string | null;
  bio?: string | null;
  perfilPublico: boolean;
  recursosHabilitado: boolean;
  createdAt: string;
  role: Role;
  seguindo?: { seguido: Partial<Usuario> }[];
  seguidores?: { seguidor: Partial<Usuario> }[];
  plantas?: Partial<Planta>[];
}

export interface Especie {
  id: string;
  nomeCientifico: string | null;
  nomeComum?: string | null;
  status: StatusEspecie;
  familia?: string | null;
  origem?: string | null;
  tipoDePlanta?: TipoPlanta | null;
  folhas?: string | null;
  tronco?: string | null;
  flores?: string | null;
  frutos?: string | null;
  raizes?: string | null;
  luminosidade?: string | null;
  rega?: string | null;
  substratoIdeal?: string | null;
  adubacao?: string | null;
  clima?: string | null;
  problemasComuns?: string | null;
  pros?: string | null;
  contras?: string | null;
  linhasDeRaciocinio?: string | null;
  observacoes?: string | null;
}

export interface Planta {
  id: string;
  nome?: string | null;
  identificador?: string | null;
  dataAquisicao?: string | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string | null;
  fotoCapaUrl?: string | null;
  plantaPublica: boolean;
  historicoPublico: boolean;
  createdAt: string;
  updatedAt: string;
  usuarioId: string;
  especieId: string | null;
  especie: (Pick<Especie, 'nomeCientifico' | 'nomeComum'> & Partial<Especie>) | null;
}

export interface Atividade {
  id: string;
  nome: string;
  descricao?: string | null;
  objetivos?: string | null;
  preparacao?: string | null;
  execucao?: string | null;
  cuidadosPosProcedimento?: string | null;
}

export interface Foto {
  id: string;
  caminhoArquivo: string;
  titulo?: string | null;
  createdAt: string;
  plantaId?: string | null;
  usuarioId: string;
  tipo: TipoMidia;
  descricao?: string | null;
  dataCaptura?: string | null;
  /** Cuidado em que a foto foi registrada (conclusão de tarefa). */
  agendaId?: string | null;
}

export interface TipoRecurso {
  id: string;
  nome: string;
}

export interface Rotina {
  id: string;
  intervaloDias: number;
  pausada: boolean;
  dataFim?: string | null;
  plantaId: string;
  atividadeId: string;
  atividade?: Pick<Atividade, 'id' | 'nome'>;
  planta?: Pick<Planta, 'id' | 'nome' | 'identificador'>;
  /** Pendente atual da rotina (null = pausada, encerrada ou sem próxima). */
  proxima?: { id: string; dataAgendada: string } | null;
}

export interface Agenda {
  id: string;
  dataAgendada: string;
  dataConcluida?: string | null;
  status: AgendaStatus;
  detalhes?: string | null;
  observacaoFutura?: string | null;
  plantaId: string;
  atividadeId: string;
  rotinaId?: string | null;
  rotina?: Pick<Rotina, 'id' | 'intervaloDias' | 'pausada'> | null;
  pulada?: boolean;
  planta?: Pick<Planta, 'id' | 'nome' | 'identificador' | 'fotoCapaUrl'> & { especie?: Partial<Especie> };
  atividade?: Pick<Atividade, 'id' | 'nome'>;
  fotos?: { id: string; caminhoArquivo: string }[];
}

export interface Preferencias {
  atividades_rastreadas?: string;
  usa_identificador?: string;
  usa_nome_planta?: string;
  revisao_automatica_dias?: string;
  [chave: string]: string | undefined;
}

export const MODOS_AQUISICAO: { value: ModoAquisicao; label: string }[] = [
  { value: 'COMPRA', label: 'Compra' },
  { value: 'SEMENTE', label: 'Semente' },
  { value: 'ESTACA', label: 'Estaca' },
  { value: 'ALPORQUIA', label: 'Alporquia' },
  { value: 'YAMADORI', label: 'Yamadori' },
];

export const TIPOS_PLANTA: { value: TipoPlanta; label: string }[] = [
  { value: 'PERENE', label: 'Perene' },
  { value: 'CADUCIFOLIA', label: 'Caducifólia' },
  { value: 'SEMI_CADUCA', label: 'Semi-caduca' },
  { value: 'ARVORE', label: 'Árvore' },
  { value: 'ARBUSTO', label: 'Arbusto' },
  { value: 'CONIFERA', label: 'Conífera' },
];
