export interface CreateFotoDTO {
  caminhoArquivo: string;
  plantaId?: string | null;
  titulo?: string;
  tags?: string;
  usuarioId: string;
  tipo?: 'FOTO' | 'VIDEO' | 'VISAO_FUTURA';
  descricao?: string;
  thumbnailUrl?: string;
  dataCaptura?: string | null;
}

export interface UpdateFotoDTO {
  titulo?: string;
  tags?: string;
  descricao?: string;
}

export interface FotoRepository {
  create(data: CreateFotoDTO): Promise<any>;
  findManyByPlanta(plantaId: string): Promise<any[]>;
  findByIdAndUser(id: string, usuarioId: string): Promise<any | null>;
  update(id: string, data: UpdateFotoDTO): Promise<any>;
  delete(id: string): Promise<void>;
  existsByIdAndUser(id: string, usuarioId: string): Promise<boolean>;
  checkPlantaBelongsToUser(plantaId: string, usuarioId: string): Promise<boolean>;
}