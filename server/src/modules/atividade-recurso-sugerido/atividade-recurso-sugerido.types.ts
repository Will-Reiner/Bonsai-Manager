export interface CreateAtividadeRecursoSugeridoDTO {
  atividadeId: string;
  tipoRecursoId: string;
}

export interface DeleteAtividadeRecursoSugeridoDTO {
  atividadeId: string;
  tipoRecursoId: string;
}

export interface AtividadeRecursoSugeridoResponseDTO {
  atividadeId: string;
  tipoRecursoId: string;
}

export interface AtividadeRecursoSugeridoRepository {
  create(data: CreateAtividadeRecursoSugeridoDTO): Promise<AtividadeRecursoSugeridoResponseDTO>;
  delete(data: DeleteAtividadeRecursoSugeridoDTO): Promise<void>;
  exists(atividadeId: string, tipoRecursoId: string): Promise<boolean>;
  atividadeExists(atividadeId: string): Promise<boolean>;
  tipoRecursoExists(tipoRecursoId: string): Promise<boolean>;
}