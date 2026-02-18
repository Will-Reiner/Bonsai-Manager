import { AtividadeFerramentaSugeridaRepository } from '../atividade-ferramenta-sugerida.types';

export class GetFerramentasSugeridasByAtividadeUseCase {
  constructor(private repository: AtividadeFerramentaSugeridaRepository) {}

  async execute(atividadeId: string): Promise<any[]> {
    const atividadeExists = await this.repository.atividadeExists(atividadeId);
    if (!atividadeExists) {
      throw new Error('Atividade não encontrada');
    }

    return await this.repository.findByAtividade(atividadeId);
  }
}
