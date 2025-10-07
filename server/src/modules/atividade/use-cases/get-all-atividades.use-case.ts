import {
  AtividadeRepository,
  AtividadeResponseDTO,
} from '../atividade.types';

export class GetAllAtividadesUseCase {
  constructor(private atividadeRepository: AtividadeRepository) {}

  async execute(): Promise<AtividadeResponseDTO[]> {
    const atividades = await this.atividadeRepository.findAll();
    return atividades;
  }
}