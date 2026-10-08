import { CreatePlantaRequestDTO, CreatePlantaDTO, PlantaWithEspecie, PlantaRepository, EspecieRepository } from '../types/planta.types';

/** Tentativas de gerar o ID quando outra criação simultânea pega o mesmo número. */
const TENTATIVAS_ID_AUTOMATICO = 3;

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
    const base = {
      ...data,
      dataAquisicao: data.dataAquisicao ? new Date(data.dataAquisicao) : undefined,
    };

    // ID informado pelo usuário: conflito vira 409 no controller, sem nova tentativa
    if (data.identificador !== undefined) {
      return this.plantaRepository.create({ ...base, identificador: data.identificador });
    }

    // Sem ID: próximo número livre do usuário
    for (let tentativa = 1; ; tentativa++) {
      const createData: CreatePlantaDTO = {
        ...base,
        identificador: (await this.plantaRepository.maiorIdentificador(data.usuarioId)) + 1,
      };
      try {
        return await this.plantaRepository.create(createData);
      } catch (error: any) {
        if (error?.code !== 'P2002' || tentativa >= TENTATIVAS_ID_AUTOMATICO) throw error;
      }
    }
  }
}
