import { UpdatePlantaRequestDTO, UpdatePlantaDTO, PlantaWithEspecie, PlantaRepository, EspecieRepository } from '../types/planta.types';
import { Planta } from '@prisma/client';

export class UpdatePlantaUseCase {
  constructor(
    private plantaRepository: PlantaRepository,
    private especieRepository: EspecieRepository
  ) {}

  async execute(id: string, usuarioId: string, data: UpdatePlantaRequestDTO): Promise<Planta> {
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

    // Atualizar a planta
    return await this.plantaRepository.update(id, usuarioId, updateData);
  }
}