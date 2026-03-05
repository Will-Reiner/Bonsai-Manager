import { PreferenciaRepository, PreferenciaResponseDTO } from '../preferencia.types';

export class UpsertPreferenciasEmLoteUseCase {
  constructor(private preferenciaRepository: PreferenciaRepository) {}

  async execute(usuarioId: string, preferencias: Record<string, string>): Promise<PreferenciaResponseDTO[]> {
    if (Object.keys(preferencias).length === 0) {
      throw new Error('Nenhuma preferência fornecida.');
    }

    return await this.preferenciaRepository.upsertMany(usuarioId, preferencias);
  }
}
