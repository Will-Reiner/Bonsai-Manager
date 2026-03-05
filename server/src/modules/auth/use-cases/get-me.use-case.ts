import { AuthRepository, GetMeDTO, GetMeResponseDTO } from '../types/auth.types';

export class GetMeUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: GetMeDTO): Promise<GetMeResponseDTO> {
    try {
      const user = await this.authRepository.findUserById(data.userId);
      
      if (!user) {
        throw new Error('Utilizador não encontrado.');
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao buscar dados do utilizador.');
    }
  }
}