import { FotoRepository } from '../foto.types';
import { LimpezaDeMidia } from '../../midia/midia.types';

export class DeleteFotoUseCase {
  constructor(
    private fotoRepository: FotoRepository,
    private limpezaDeMidia: LimpezaDeMidia,
  ) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    const foto = await this.fotoRepository.findByIdAndUser(id, usuarioId);

    if (!foto) {
      throw new Error('Foto não encontrada ou não pertence a si.');
    }

    await this.fotoRepository.delete(id);

    // Se era a capa, a foto mais recente que sobrou assume (ou a planta fica sem capa)
    if (foto.plantaId) {
      const capa = await this.fotoRepository.findCapaDaPlanta(foto.plantaId);
      if (capa === foto.caminhoArquivo) {
        const novaCapa = await this.fotoRepository.findFotoMaisRecente(foto.plantaId);
        await this.fotoRepository.updateCapaDaPlanta(foto.plantaId, novaCapa);
      }
    }

    await this.limpezaDeMidia.execute([foto.caminhoArquivo, foto.thumbnailUrl]);
  }
}
