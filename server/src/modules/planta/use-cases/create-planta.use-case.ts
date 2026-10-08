import { CreatePlantaRequestDTO, CreatePlantaDTO, PlantaWithEspecie, PlantaRepository, EspecieRepository } from '../types/planta.types';

export class CreatePlantaUseCase {
  constructor(
    private plantaRepository: PlantaRepository,
    private especieRepository: EspecieRepository
  ) {}

  async execute(data: CreatePlantaRequestDTO): Promise<PlantaWithEspecie> {
    // Espécie é opcional (planta criada só com código + foto); se vier, precisa existir
    if (data.especieId && !(await this.especieRepository.existsById(data.especieId))) {
      throw new Error('Espécie não encontrada');
    }

    // Transformar dataAquisicao de string para Date se fornecida
    const createData: CreatePlantaDTO = {
      ...data,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : undefined,
    };

    // Criar a planta
    return this.plantaRepository.create(createData);
  }
}

