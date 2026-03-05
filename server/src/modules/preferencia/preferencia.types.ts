// DTOs para requisições
export interface UpsertPreferenciaDTO {
  chave: string;
  valor: string;
}

export interface UpsertPreferenciasEmLoteDTO {
  preferencias: Record<string, string>;
}

// DTO para resposta
export interface PreferenciaResponseDTO {
  id: string;
  chave: string;
  valor: string;
  usuarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Repository interface
export interface PreferenciaRepository {
  findAllByUsuario(usuarioId: string): Promise<PreferenciaResponseDTO[]>;
  upsert(usuarioId: string, chave: string, valor: string): Promise<PreferenciaResponseDTO>;
  upsertMany(usuarioId: string, preferencias: Record<string, string>): Promise<PreferenciaResponseDTO[]>;
}
