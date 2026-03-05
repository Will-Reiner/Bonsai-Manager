import { FotoRepository } from '../foto.types';

export class GetFotosByPlantaUseCase {
  constructor(private fotoRepository: FotoRepository) {}

  async execute(plantaId: string, usuarioId: string) {
    // Verifica se a planta pertence ao usuário
    const plantaBelongsToUser = await this.fotoRepository.checkPlantaBelongsToUser(plantaId, usuarioId);
    
    if (!plantaBelongsToUser) {
      throw new Error('Planta não encontrada ou não pertence a si.');
    }

    return await this.fotoRepository.findManyByPlanta(plantaId);
  }
}