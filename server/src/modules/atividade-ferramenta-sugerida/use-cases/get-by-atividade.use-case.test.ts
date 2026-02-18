import { GetFerramentasSugeridasByAtividadeUseCase } from './get-by-atividade.use-case';
import { AtividadeFerramentaSugeridaRepository } from '../atividade-ferramenta-sugerida.types';

describe('GetFerramentasSugeridasByAtividadeUseCase', () => {
  let useCase: GetFerramentasSugeridasByAtividadeUseCase;
  let mockRepository: jest.Mocked<AtividadeFerramentaSugeridaRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      atividadeExists: jest.fn(),
      ferramentaExists: jest.fn(),
      findByAtividade: jest.fn(),
    };
    useCase = new GetFerramentasSugeridasByAtividadeUseCase(mockRepository);
  });

  it('should return suggested tools for an atividade', async () => {
    const atividadeId = 'atividade-1';
    const expected = [
      { atividadeId, ferramentaId: 'ferramenta-1' },
    ];
    mockRepository.atividadeExists.mockResolvedValue(true);
    mockRepository.findByAtividade.mockResolvedValue(expected);

    const result = await useCase.execute(atividadeId);

    expect(mockRepository.atividadeExists).toHaveBeenCalledWith(atividadeId);
    expect(mockRepository.findByAtividade).toHaveBeenCalledWith(atividadeId);
    expect(result).toEqual(expected);
  });

  it('should throw error when atividade does not exist', async () => {
    mockRepository.atividadeExists.mockResolvedValue(false);

    await expect(useCase.execute('non-existent')).rejects.toThrow('Atividade não encontrada');
  });
});
