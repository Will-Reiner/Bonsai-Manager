import { FotoRepository } from '../foto.types';

export class GetFotoByIdUseCase {
  constructor(private fotoRepository: FotoRepository) {}

  async execute(id: string, usuarioId: string) {
    const foto = await this.fotoRepository.findByIdAndUser(id, usuarioId);
    
    if (!foto) {
      throw new Error('Foto não encontrada ou não pertence a si.');
    }

    return foto;
  }
}