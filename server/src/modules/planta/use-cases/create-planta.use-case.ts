import { CreatePlantaRequestDTO, CreatePlantaDTO, PlantaWithEspecie, PlantaRepository, EspecieRepository } from '../types/planta.types';

export class CreatePlantaUseCase {
  constructor(
    private plantaRepository: PlantaRepository,
    private especieRepository: EspecieRepository
  ) {}

  async execute(data: CreatePlantaRequestDTO): Promise<PlantaWithEspecie> {
    // Validar se a espécie existe
    const especieExists = await this.especieRepository.existsById(data.especieId);
    if (!especieExists) {
      throw new Error('Espécie não encontrada');
    }

    // Transformar dataAquisicao de string para Date se fornecida
    const createData: CreatePlantaDTO = {
      ...data,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : undefined,
    };

    // Criar a planta
    return await this.plantaRepository.create(createData);
  }
}