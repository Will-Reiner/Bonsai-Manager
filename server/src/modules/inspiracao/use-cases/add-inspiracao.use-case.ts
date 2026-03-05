import { InspiracaoRepository, AddInspiracaoDTO, InspiracaoResponseDTO } from '../inspiracao.types';

export class AddInspiracaoUseCase {
  constructor(private repository: InspiracaoRepository) {}

  async execute(data: AddInspiracaoDTO): Promise<{ success: boolean; data?: InspiracaoResponseDTO; error?: string }> {
    try {
      // 1. Verificar se a planta pertence ao utilizador logado
      const plantaExists = await this.repository.plantaExistsAndBelongsToUser(data.plantaId, data.usuarioId);
      if (!plantaExists) {
        return { success: false, error: 'A sua planta não foi encontrada.' };
      }

      // 2. Verificar se a foto existe e se pode ser usada como inspiração
      const fotoCanBeUsed = await this.repository.fotoExistsAndCanBeUsedAsInspiration(data.fotoId, data.usuarioId);
      if (!fotoCanBeUsed) {
        return { success: false, error: 'A foto de inspiração não foi encontrada ou não pode ser usada como inspiração.' };
      }

      // 3. Verificar se a inspiração já existe
      const inspiracaoExists = await this.repository.exists(data.plantaId, data.fotoId);
      if (inspiracaoExists) {
        return { success: false, error: 'Esta inspiração já existe para esta planta.' };
      }

      // 4. Criar a inspiração
      const inspiracao = await this.repository.add(data);

      return { success: true, data: inspiracao };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor.' };
    }
  }
}