import { UpdateFotoDTO, FotoRepository } from '../foto.types';

export class UpdateFotoUseCase {
  constructor(private fotoRepository: FotoRepository) {}

  async execute(id: string, data: UpdateFotoDTO, usuarioId: string) {
    const exists = await this.fotoRepository.existsByIdAndUser(id, usuarioId);
    
    if (!exists) {
      throw new Error('Foto não encontrada ou não pertence a si.');
    }

    return await this.fotoRepository.update(id, data);
  }
}