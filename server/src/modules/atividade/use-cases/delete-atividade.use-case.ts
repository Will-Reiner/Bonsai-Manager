import { AtividadeRepository } from '../atividade.types';

export class DeleteAtividadeUseCase {
  constructor(private atividadeRepository: AtividadeRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar se a atividade existe
    const atividadeExistente = await this.atividadeRepository.findById(id);
    
    if (!atividadeExistente) {
      throw new Error('Atividade não encontrada.');
    }

    // Deletar a atividade
    await this.atividadeRepository.delete(id);
  }
}