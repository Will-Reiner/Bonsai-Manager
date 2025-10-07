import {
  AtividadeFerramentaSugeridaRepository,
  DeleteAtividadeFerramentaSugeridaDTO,
} from '../atividade-ferramenta-sugerida.types';

export class DeleteAtividadeFerramentaSugeridaUseCase {
  constructor(
    private atividadeFerramentaSugeridaRepository: AtividadeFerramentaSugeridaRepository
  ) {}

  async execute(data: DeleteAtividadeFerramentaSugeridaDTO): Promise<void> {
    // Verificar se a associação existe
    const associacaoExists = await this.atividadeFerramentaSugeridaRepository.exists(data);
    if (!associacaoExists) {
      throw new Error('Associação não encontrada');
    }

    await this.atividadeFerramentaSugeridaRepository.delete(data);
  }
}