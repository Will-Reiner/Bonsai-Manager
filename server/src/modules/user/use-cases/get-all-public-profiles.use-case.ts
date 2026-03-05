import { UserRepository, GetAllPublicProfilesDTO, PublicUserProfileDTO } from '../types/user.types';

export class GetAllPublicProfilesUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(_data: GetAllPublicProfilesDTO): Promise<PublicUserProfileDTO[]> {
    try {
      const users = await this.userRepository.findAllPublicProfiles();
      return users;
    } catch (error) {
      throw new Error('Erro ao buscar utilizadores.');
    }
  }
}