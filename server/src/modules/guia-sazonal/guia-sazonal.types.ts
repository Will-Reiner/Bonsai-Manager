export type Estacao = 'PRIMAVERA' | 'VERAO' | 'OUTONO' | 'INVERNO';
export type MomentoIdeal = 'DEVE_FAZER' | 'PODE_FAZER' | 'EVITAR';

export interface CreateGuiaSazonalDTO {
  especieId: string;
  atividadeId: string;
  estacao: Estacao;
  momentoIdeal: MomentoIdeal;
  observacoes?: string;
}

export interface UpdateGuiaSazonalDTO {
  momentoIdeal?: MomentoIdeal;
  observacoes?: string;
}

export interface DeleteGuiaSazonalDTO {
  especieId: string;
  atividadeId: string;
  estacao: Estacao;
}

export interface GuiaSazonalResponseDTO {
  especieId: string;
  atividadeId: string;
  estacao: Estacao;
  momentoIdeal: MomentoIdeal;
  observacoes: string | null;
}

export interface GuiaSazonalRepository {
  create(data: CreateGuiaSazonalDTO): Promise<GuiaSazonalResponseDTO>;
  update(especieId: string, atividadeId: string, estacao: Estacao, data: UpdateGuiaSazonalDTO): Promise<GuiaSazonalResponseDTO>;
  delete(data: DeleteGuiaSazonalDTO): Promise<void>;
  exists(especieId: string, atividadeId: string, estacao: Estacao): Promise<boolean>;
  especieExists(especieId: string): Promise<boolean>;
  atividadeExists(atividadeId: string): Promise<boolean>;
}