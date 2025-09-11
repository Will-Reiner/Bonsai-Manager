/**
 * Tipos para os status de um agendamento.
 * Baseado no enum AgendaStatus do schema.prisma.
 */
export type AgendaStatus = 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';

/**
 * Tipos para os status de um recurso.
 * Baseado no enum RecursoStatus do schema.prisma.
 */
export type RecursoStatus = 'DISPONIVEL' | 'EM_FALTA' | 'ENCOMENDADO';

/**
 * Interface para o modelo Usuario.
 * Omitimos o senhaHash por segurança.
 * Reflete a estrutura da tabela Usuario no banco de dados.
 */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  createdAt: string;
}

/**
 * Interface para o modelo Especie.
 * Reflete a estrutura da tabela Especie no banco de dados.
 */
export interface Especie {
  id: string;
  nomeCientifico: string;
  nomeComum?: string | null;
  informacoesGerais?: string | null;
}

/**
 * Interface para o modelo Planta.
 * As datas são recebidas como strings no formato ISO 8601 da API.
 * A API inclui o objeto 'especie' relacionado ao buscar as plantas.
 * Reflete a estrutura da tabela Planta no banco de dados.
 */
export interface Planta {
  id: string;
  nome?: string | null;
  dataAquisicao?: string | null;
  statusAtual?: string | null;
  visao?: string | null;
  objetivoAno?: string | null;
  dataProximoTransplante?: string | null;
  prioridadeTransplante?: number | null;
  observacoes?: string | null;
  createdAt: string;
  updatedAt: string;
  usuarioId: string;
  especieId: string;
  especie: Especie; // Objeto aninhado retornado pela API
}

/**
 * Interface para o modelo Atividade.
 * Reflete a estrutura da tabela Atividade no banco de dados.
 */
export interface Atividade {
  id: string;
  nome: string; // Mapeado de 'nome_atividade' no schema
  descricao?: string | null;
}

/**
 * Interface para o modelo TipoRecurso.
 * Reflete a estrutura da tabela TipoRecurso no banco de dados.
 */
export interface TipoRecurso {
  id: string;
  nome: string;
}

/**
 * Interface para o modelo Recurso.
 * Reflete a estrutura da tabela Recurso, que representa o inventário do usuário.
 */
export interface Recurso {
  id: string;
  quantidadeDisponivel: number;
  unidadeMedida?: string | null;
  status: RecursoStatus;
  observacoes?: string | null;
  usuarioId: string;
  tipoRecursoId: string;
  tipoRecurso: TipoRecurso; // Objeto aninhado retornado pela API
}

/**
 * Interface para a tabela de junção AtividadeRecursoNecessario.
 * Descreve quais Tipos de Recurso uma Atividade necessita.
 */
export interface AtividadeRecursoNecessario {
  atividadeId: string;
  tipoRecursoId: string;
  // Opcional: A API pode retornar informações aninhadas
  atividade?: Atividade;
  tipoRecurso?: TipoRecurso;
}

/**
 * Interface para o modelo Agenda.
 * Reflete a estrutura da tabela Agenda no banco de dados.
 */
export interface Agenda {
  id: string;
  dataAgendada: string;
  dataConcluida?: string | null;
  status: AgendaStatus;
  observacoes?: string | null;
  plantaId: string;
  atividadeId: string;
  // Opcional: A API pode retornar informações aninhadas
  planta?: Pick<Planta, 'id' | 'nome'>;
  atividade?: Pick<Atividade, 'id' | 'nome'>;
}

/**
 * Interface para o modelo RegistroAtividadeHistorico.
 * Reflete a estrutura da tabela RegistroAtividadeHistorico no banco de dados.
 */
export interface RegistroHistorico {
  id: string;
  dataRealizacao: string;
  atividadeRealizada: string;
  recursosUtilizados?: string | null;
  detalhes?: string | null;
  observacaoFutura?: string | null;
  plantaId: string;
}

/**
 * Interface para o modelo Foto.
 * Reflete a estrutura da tabela Foto no banco de dados.
 */
export interface Foto {
  id: string;
  caminhoArquivo: string;
  dataUpload: string;
  descricao?: string | null;
  plantaId: string;
}