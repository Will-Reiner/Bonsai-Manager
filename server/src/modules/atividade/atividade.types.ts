// Request DTOs
export interface CreateAtividadeRequestDTO {
  nome: string;
  descricao?: string;
  objetivos?: string;
  preparacao?: string;
  execucao?: string;
  cuidadosPosProcedimento?: string;
}

export interface UpdateAtividadeRequestDTO {
  id: string;
  nome?: string;
  descricao?: string;
  objetivos?: string;
  preparacao?: string;
  execucao?: string;
  cuidadosPosProcedimento?: string;
}

// Response DTOs
export interface AtividadeResponseDTO {
  id: string;
  nome: string;
  descricao: string | null;
  objetivos: string | null;
  preparacao: string | null;
  execucao: string | null;
  cuidadosPosProcedimento: string | null;
  createdAt: Date;
}

export interface AtividadeWithRelationsResponseDTO extends AtividadeResponseDTO {
  agendas: Array<{
    id: string;
    dataAgendada: Date;
    dataConcluida: Date | null;
    status: string;
    detalhes: string | null;
    observacaoFutura: string | null;
    plantaId: string;
  }>;
  guiasDeTecnicas: Array<{
    especieId: string;
    recomendacao: string;
    observacoes: string | null;
  }>;
  guiasSazonais: Array<{
    especieId: string;
    estacao: string;
    momentoIdeal: string;
    observacoes: string | null;
  }>;
  recursosSugeridos: Array<{
    tipoRecursoId: string;
  }>;
  ferramentasSugeridas: Array<{
    ferramentaId: string;
  }>;
}

// Repository Interface
export interface AtividadeRepository {
  create(data: CreateAtividadeRequestDTO): Promise<AtividadeResponseDTO>;
  findAll(): Promise<AtividadeResponseDTO[]>;
  findById(id: string): Promise<AtividadeWithRelationsResponseDTO | null>;
  update(data: UpdateAtividadeRequestDTO): Promise<AtividadeResponseDTO>;
  delete(id: string): Promise<void>;
  existsByNome(nome: string): Promise<boolean>;
  existsByNomeExcludingId(nome: string, id: string): Promise<boolean>;
}