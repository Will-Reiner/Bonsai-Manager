import { PreferenciaRepository, PreferenciaResponseDTO } from '../preferencia.types';

export class UpsertPreferenciaUseCase {
  constructor(private preferenciaRepository: PreferenciaRepository) {}

  async execute(usuarioId: string, chave: string, valor: string): Promise<PreferenciaResponseDTO> {
    return await this.preferenciaRepository.upsert(usuarioId, chave, valor);
  }
}
