import { UserRepository, GetProfileByIdDTO, DetailedUserProfileDTO } from '../types/user.types';

export class GetProfileByIdUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: GetProfileByIdDTO): Promise<DetailedUserProfileDTO> {
    try {
      const user = await this.userRepository.findPublicProfileById(data.id);
      
      if (!user) {
        throw new Error('Perfil não encontrado ou é privado.');
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao buscar perfil do utilizador.');
    }
  }
}