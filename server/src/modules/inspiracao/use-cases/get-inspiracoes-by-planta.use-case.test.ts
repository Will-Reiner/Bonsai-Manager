import { GetInspiracoesByPlantaUseCase } from './get-inspiracoes-by-planta.use-case';
import { InspiracaoRepository } from '../inspiracao.types';

describe('GetInspiracoesByPlantaUseCase', () => {
  let useCase: GetInspiracoesByPlantaUseCase;
  let mockRepository: jest.Mocked<InspiracaoRepository>;

  beforeEach(() => {
    mockRepository = {
      add: jest.fn(),
      remove: jest.fn(),
      exists: jest.fn(),
      plantaExistsAndBelongsToUser: jest.fn(),
      fotoExistsAndCanBeUsedAsInspiration: jest.fn(),
      inspiracaoExistsAndBelongsToUser: jest.fn(),
      findByPlanta: jest.fn(),
    };
    useCase = new GetInspiracoesByPlantaUseCase(mockRepository);
  });

  it('should return inspiracoes for a planta', async () => {
    const plantaId = 'planta-1';
    const usuarioId = 'user-1';
    const expected = [
      { plantaId, fotoId: 'foto-1' },
      { plantaId, fotoId: 'foto-2' },
    ];
    mockRepository.plantaExistsAndBelongsToUser.mockResolvedValue(true);
    mockRepository.findByPlanta.mockResolvedValue(expected);

    const result = await useCase.execute(plantaId, usuarioId);

    expect(mockRepository.plantaExistsAndBelongsToUser).toHaveBeenCalledWith(plantaId, usuarioId);
    expect(mockRepository.findByPlanta).toHaveBeenCalledWith(plantaId);
    expect(result).toEqual(expected);
  });

  it('should throw error when planta does not belong to user', async () => {
    mockRepository.plantaExistsAndBelongsToUser.mockResolvedValue(false);

    await expect(useCase.execute('planta-1', 'user-1'))
      .rejects.toThrow('Planta não encontrada ou não pertence ao utilizador.');
  });
});
