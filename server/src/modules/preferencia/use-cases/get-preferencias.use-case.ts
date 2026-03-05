import { PreferenciaRepository, PreferenciaResponseDTO } from '../preferencia.types';

export class GetPreferenciasUseCase {
  constructor(private preferenciaRepository: PreferenciaRepository) {}

  async execute(usuarioId: string): Promise<Record<string, string>> {
    const preferencias = await this.preferenciaRepository.findAllByUsuario(usuarioId);

    // Transforma array em objeto { chave: valor }
    const resultado: Record<string, string> = {};
    for (const pref of preferencias) {
      resultado[pref.chave] = pref.valor;
    }
    return resultado;
  }
}
