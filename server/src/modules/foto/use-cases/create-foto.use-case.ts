import { CreateFotoDTO, FotoRepository } from '../foto.types';

export class CreateFotoUseCase {
  constructor(private fotoRepository: FotoRepository) {}

  async execute(data: Omit<CreateFotoDTO, 'usuarioId'>, usuarioId: string) {
    // Se um plantaId for fornecido, verifica se a planta pertence ao usuário
    if (data.plantaId) {
      const plantaBelongsToUser = await this.fotoRepository.checkPlantaBelongsToUser(data.plantaId, usuarioId);
      
      if (!plantaBelongsToUser) {
        throw new Error('Planta não encontrada ou não pertence a si.');
      }
    }

    return await this.fotoRepository.create({
      ...data,
      usuarioId,
    });
  }
}