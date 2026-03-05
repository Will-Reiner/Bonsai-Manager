export interface CreateAtividadeRecursoDTO {
  atividadeId: string;
  tipoRecursoId: string;
}

export interface DeleteAtividadeRecursoDTO {
  atividadeId: string;
  tipoRecursoId: string;
}

export interface AtividadeRecursoResponseDTO {
  atividadeId: string;
  tipoRecursoId: string;
}

export interface AtividadeRecursoWithTipoRecursoDTO {
  atividadeId: string;
  tipoRecursoId: string;
  tipoRecurso: {
    id: string;
    nome: string;
  };
}

export interface AtividadeRecursoWithAtividadeDTO {
  atividadeId: string;
  tipoRecursoId: string;
  atividade: {
    id: string;
    nome: string;
    descricao: string | null;
    createdAt: Date;
  };
}

export interface AtividadeRecursoRepository {
  create(data: CreateAtividadeRecursoDTO): Promise<AtividadeRecursoResponseDTO>;
  delete(data: DeleteAtividadeRecursoDTO): Promise<void>;
  getByAtividade(atividadeId: string): Promise<AtividadeRecursoWithTipoRecursoDTO[]>;
  getByTipoRecurso(tipoRecursoId: string): Promise<AtividadeRecursoWithAtividadeDTO[]>;
  exists(data: CreateAtividadeRecursoDTO): Promise<boolean>;
  atividadeExists(atividadeId: string): Promise<boolean>;
  tipoRecursoExists(tipoRecursoId: string): Promise<boolean>;
}