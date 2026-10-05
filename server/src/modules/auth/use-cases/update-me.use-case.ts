import { AuthRepository, UpdateMeDTO, UserResponseDTO } from '../types/auth.types';
import { LimpezaDeMidia } from '../../midia/midia.types';

export class UpdateMeUseCase {
  constructor(
    private authRepository: AuthRepository,
    private limpezaDeMidia: LimpezaDeMidia,
  ) {}

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

      // Foto de perfil substituída: a antiga sai do storage
      const fotoAnterior = userExists.fotoPerfilUrl;
      if (data.fotoPerfilUrl !== undefined && fotoAnterior && fotoAnterior !== data.fotoPerfilUrl) {
        await this.limpezaDeMidia.execute([fotoAnterior]);
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao atualizar dados do utilizador.');
    }
  }
}