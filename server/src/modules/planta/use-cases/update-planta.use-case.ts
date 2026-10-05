import { UpdatePlantaRequestDTO, UpdatePlantaDTO, PlantaWithEspecie, PlantaRepository, EspecieRepository } from '../types/planta.types';
import { LimpezaDeMidia } from '../../midia/midia.types';

export class UpdatePlantaUseCase {
  constructor(
    private plantaRepository: PlantaRepository,
    private especieRepository: EspecieRepository,
    private limpezaDeMidia: LimpezaDeMidia,
  ) {}

  async execute(id: string, usuarioId: string, data: UpdatePlantaRequestDTO): Promise<PlantaWithEspecie> {
    // Verificar se a planta existe e pertence ao usuário
    const plantaExists = await this.plantaRepository.existsByIdAndUser(id, usuarioId);
    if (!plantaExists) {
      throw new Error('Planta não encontrada ou não pertence ao usuário');
    }

    // Se especieId foi fornecido, validar se a espécie existe
    if (data.especieId) {
      const especieExists = await this.especieRepository.existsById(data.especieId);
      if (!especieExists) {
        throw new Error('Espécie não encontrada');
      }
    }

    // Transformar dataAquisicao de string para Date se fornecida
    const updateData: UpdatePlantaDTO = {
      ...data,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : undefined,
    };

    // Capa atual, para remover do storage se for substituída
    const capaAnterior =
      data.fotoCapaUrl !== undefined
        ? (await this.plantaRepository.findByIdAndUser(id, usuarioId))?.fotoCapaUrl
        : null;

    // Atualizar a planta
    const planta = await this.plantaRepository.update(id, usuarioId, updateData);

    if (capaAnterior && capaAnterior !== data.fotoCapaUrl) {
      await this.limpezaDeMidia.execute([capaAnterior]);
    }

    return planta;
  }
}