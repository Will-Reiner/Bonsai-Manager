import { FotoRepository } from '../foto.types';

export class DeleteFotoUseCase {
  constructor(private fotoRepository: FotoRepository) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    const exists = await this.fotoRepository.existsByIdAndUser(id, usuarioId);
    
    if (!exists) {
      throw new Error('Foto não encontrada ou não pertence a si.');
    }

    await this.fotoRepository.delete(id);
  }
}