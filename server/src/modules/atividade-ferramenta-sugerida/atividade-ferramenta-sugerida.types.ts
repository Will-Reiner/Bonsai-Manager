export interface CreateAtividadeFerramentaSugeridaDTO {
  atividadeId: string;
  ferramentaId: string;
}

export interface DeleteAtividadeFerramentaSugeridaDTO {
  atividadeId: string;
  ferramentaId: string;
}

export interface AtividadeFerramentaSugeridaResponseDTO {
  atividadeId: string;
  ferramentaId: string;
}

export interface AtividadeFerramentaSugeridaRepository {
  create(data: CreateAtividadeFerramentaSugeridaDTO): Promise<AtividadeFerramentaSugeridaResponseDTO>;
  delete(data: DeleteAtividadeFerramentaSugeridaDTO): Promise<void>;
  exists(data: CreateAtividadeFerramentaSugeridaDTO): Promise<boolean>;
  atividadeExists(atividadeId: string): Promise<boolean>;
  ferramentaExists(ferramentaId: string): Promise<boolean>;
}