import { CreatePlantaRequestDTO, CreatePlantaDTO, PlantaWithEspecie, PlantaRepository, EspecieRepository, RevisaoInicialRepository } from '../types/planta.types';

export class CreatePlantaUseCase {
  constructor(
    private plantaRepository: PlantaRepository,
    private especieRepository: EspecieRepository,
    private revisaoRepository: RevisaoInicialRepository
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
    const planta = await this.plantaRepository.create(createData);
    await this.criarRevisao(planta.id, data.usuarioId);
    return planta;
  }

  /** Toda planta nova ganha a rotina de Revisão geral; se falhar, a planta continua criada (o usuário cria a rotina depois). */
  private async criarRevisao(plantaId: string, usuarioId: string) {
    try {
      const dias = await this.revisaoRepository.getRevisaoDias(usuarioId);
      if (dias > 0) await this.revisaoRepository.criarRevisao(plantaId, dias, new Date(Date.now() + dias * 86_400_000));
    } catch (error) {
      console.error('Erro ao criar a Revisão geral da planta nova:', error);
    }
  }
}