export type RecomendacaoTecnica = 'RECOMENDADA' | 'NAO_RECOMENDADA' | 'COM_CUIDADO';

export interface CreateGuiaDeTecnicasDTO {
  especieId: string;
  atividadeId: string;
  recomendacao: RecomendacaoTecnica;
  observacoes?: string;
}

export interface UpdateGuiaDeTecnicasDTO {
  recomendacao?: RecomendacaoTecnica;
  observacoes?: string;
}

export interface DeleteGuiaDeTecnicasDTO {
  especieId: string;
  atividadeId: string;
}

export interface GuiaDeTecnicasResponseDTO {
  especieId: string;
  atividadeId: string;
  recomendacao: RecomendacaoTecnica;
  observacoes?: string;
}

export interface GuiaDeTecnicasRepository {
  create(data: CreateGuiaDeTecnicasDTO): Promise<GuiaDeTecnicasResponseDTO>;
  findAll(): Promise<GuiaDeTecnicasResponseDTO[]>;
  findByEspecie(especieId: string): Promise<GuiaDeTecnicasResponseDTO[]>;
  update(especieId: string, atividadeId: string, data: UpdateGuiaDeTecnicasDTO): Promise<GuiaDeTecnicasResponseDTO>;
  delete(data: DeleteGuiaDeTecnicasDTO): Promise<void>;
  exists(especieId: string, atividadeId: string): Promise<boolean>;
  especieExists(especieId: string): Promise<boolean>;
  atividadeExists(atividadeId: string): Promise<boolean>;
}