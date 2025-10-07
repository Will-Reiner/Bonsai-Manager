import { InspiracaoRepository, RemoveInspiracaoDTO } from '../inspiracao.types';

export class RemoveInspiracaoUseCase {
  constructor(private repository: InspiracaoRepository) {}

  async execute(data: RemoveInspiracaoDTO): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se a inspiração existe e pertence ao utilizador
      const inspiracaoExists = await this.repository.inspiracaoExistsAndBelongsToUser(
        data.plantaId, 
        data.fotoId, 
        data.usuarioId
      );
      
      if (!inspiracaoExists) {
        return { success: false, error: 'Ligação de inspiração não encontrada.' };
      }

      // Remover a inspiração
      await this.repository.remove(data);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor.' };
    }
  }
}