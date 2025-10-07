import { RemoveInspiracaoUseCase } from './remove-inspiracao.use-case';
import { InspiracaoRepository } from '../inspiracao.types';

describe('RemoveInspiracaoUseCase', () => {
  let useCase: RemoveInspiracaoUseCase;
  let mockRepository: jest.Mocked<InspiracaoRepository>;

  beforeEach(() => {
    mockRepository = {
      add: jest.fn(),
      remove: jest.fn(),
      exists: jest.fn(),
      plantaExistsAndBelongsToUser: jest.fn(),
      fotoExistsAndCanBeUsedAsInspiration: jest.fn(),
      inspiracaoExistsAndBelongsToUser: jest.fn(),
    };
    useCase = new RemoveInspiracaoUseCase(mockRepository);
  });

  it('should remove inspiracao successfully', async () => {
    const data = {
      plantaId: 'planta-id',
      fotoId: 'foto-id',
      usuarioId: 'usuario-id',
    };

    mockRepository.inspiracaoExistsAndBelongsToUser.mockResolvedValue(true);
    mockRepository.remove.mockResolvedValue();

    const result = await useCase.execute(data);

    expect(result.success).toBe(true);
    expect(mockRepository.inspiracaoExistsAndBelongsToUser).toHaveBeenCalledWith('planta-id', 'foto-id', 'usuario-id');
    expect(mockRepository.remove).toHaveBeenCalledWith(data);
  });

  it('should return error when inspiracao does not exist or does not belong to user', async () => {
    const data = {
      plantaId: 'planta-id',
      fotoId: 'foto-id',
      usuarioId: 'usuario-id',
    };

    mockRepository.inspiracaoExistsAndBelongsToUser.mockResolvedValue(false);

    const result = await useCase.execute(data);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Ligação de inspiração não encontrada.');
    expect(mockRepository.inspiracaoExistsAndBelongsToUser).toHaveBeenCalledWith('planta-id', 'foto-id', 'usuario-id');
    expect(mockRepository.remove).not.toHaveBeenCalled();
  });
});