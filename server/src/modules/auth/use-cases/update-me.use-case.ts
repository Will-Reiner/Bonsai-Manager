import { AuthRepository, UpdateMeDTO, UserResponseDTO } from '../types/auth.types';

export class UpdateMeUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: UpdateMeDTO): Promise<UserResponseDTO> {
    try {
      // Verificar se o usuário existe
      const userExists = await this.authRepository.findUserById(data.userId);
      if (!userExists) {
        throw new Error('Utilizador não encontrado.');
      }

      // Atualizar usuário (excluindo userId dos dados de atualização)
      const { userId, ...updateData } = data;
      const updatedUser = await this.authRepository.updateUser(userId, updateData);

      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao atualizar dados do utilizador.');
    }
  }
}