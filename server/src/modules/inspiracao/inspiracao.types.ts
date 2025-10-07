export interface AddInspiracaoDTO {
  plantaId: string;
  fotoId: string;
  usuarioId: string;
}

export interface RemoveInspiracaoDTO {
  plantaId: string;
  fotoId: string;
  usuarioId: string;
}

export interface InspiracaoResponseDTO {
  plantaId: string;
  fotoId: string;
}

export interface InspiracaoRepository {
  add(data: AddInspiracaoDTO): Promise<InspiracaoResponseDTO>;
  remove(data: RemoveInspiracaoDTO): Promise<void>;
  exists(plantaId: string, fotoId: string): Promise<boolean>;
  plantaExistsAndBelongsToUser(plantaId: string, usuarioId: string): Promise<boolean>;
  fotoExistsAndCanBeUsedAsInspiration(fotoId: string, usuarioId: string): Promise<boolean>;
  inspiracaoExistsAndBelongsToUser(plantaId: string, fotoId: string, usuarioId: string): Promise<boolean>;
}