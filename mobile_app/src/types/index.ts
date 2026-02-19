// --- ENUMS ---
// Replicamos os Enums do Prisma para uso no nosso código TypeScript

export type Role = 'USER' | 'ADMIN';
export type AgendaStatus = 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';
export type UnidadeMedida = 'UNIDADE' | 'KG' | 'G' | 'L' | 'ML';
export type ModoAquisicao = 'SEMENTE' | 'ESTACA' | 'ALPORQUIA' | 'YAMADORI' | 'COMPRA';
export type Estacao = 'PRIMAVERA' | 'VERAO' | 'OUTONO' | 'INVERNO';
export type MomentoIdeal = 'DEVE_FAZER' | 'PODE_FAZER' | 'EVITAR';
export type RecomendacaoTecnica = 'RECOMENDADA' | 'NAO_RECOMENDADA' | 'COM_CUIDADO';
export type TipoPlanta = 'PERENE' | 'CADUCIFOLIA' | 'SEMI_CADUCA' | 'ARVORE' | 'ARBUSTO' | 'CONIFERA';
export type StatusEspecie = 'VERIFICADO' | 'SUGERIDO';
export type TipoMidia = 'FOTO' | 'VIDEO';

// --- INTERFACES DOS MODELOS ---

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
  criadoPorId?: string | null;
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
  guiasDeTecnicas?: GuiaDeTecnicas[];
  guiasSazonais?: GuiaSazonal[];
}

export interface Planta {
  id: string;
  nome?: string | null;
  dataAquisicao?: string | null;
  modoAquisicao?: ModoAquisicao | null;
  visao?: string | null;
  observacoes?: string | null;
  fotoCapaUrl?: string | null;
  plantaPublica: boolean;
  historicoPublico: boolean;
  createdAt: string;
  updatedAt: string;
  usuarioId: string;
  especieId: string;
  especie: Especie;
  inspiracoes?: Inspiracao[];
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
  tags?: string | null;
  createdAt: string;
  plantaId?: string | null;
  usuarioId: string;
  tipo: TipoMidia;
  thumbnailUrl?: string | null;
}

export interface TipoRecurso {
  id: string;
  nome: string;
}

export interface Recurso {
  id: string;
  quantidadeDisponivel: number;
  unidadeMedida?: UnidadeMedida | null;
  observacoes?: string | null;
  usuarioId: string;
  tipoRecursoId: string;
  tipoRecurso: TipoRecurso;
}

export interface AgendaRecursoUtilizado {
  agendaId: string;
  recursoId: string;
  quantidadeUtilizada: number;
  recurso?: Recurso;
}

export interface Agenda {
  id: string;
  dataAgendada: string;
  dataConcluida?: string | null;
  status: AgendaStatus;
  detalhes?: string | null;
  observacaoFutura?: string | null;
  observacoes?: string | null;
  plantaId: string;
  atividadeId: string;
  planta?: Partial<Planta>;
  atividade?: Partial<Atividade>;
  recursosUtilizados?: AgendaRecursoUtilizado[];
}

export interface Ferramenta {
  id: string;
  nome: string;
  descricao?: string | null;
}

export interface GuiaDeTecnicas {
  especieId: string;
  atividadeId: string;
  recomendacao: RecomendacaoTecnica;
  observacoes?: string | null;
  atividade?: Atividade;
}

export interface GuiaSazonal {
  especieId: string;
  atividadeId: string;
  estacao: Estacao;
  momentoIdeal: MomentoIdeal;
  observacoes?: string | null;
  atividade?: Atividade;
}

export interface Inspiracao {
  plantaId: string;
  fotoId: string;
  foto?: Foto;
}

export interface AtividadeFerramentaSugerida {
  atividadeId: string;
  ferramentaId: string;
  ferramenta?: Ferramenta;
}

export interface AtividadeRecursoSugerido {
  atividadeId: string;
  tipoRecursoId: string;
  tipoRecurso?: TipoRecurso;
}

// --- DTOs (Data Transfer Objects) ---

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