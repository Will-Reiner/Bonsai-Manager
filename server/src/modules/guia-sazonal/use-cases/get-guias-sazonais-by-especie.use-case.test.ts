import { GetGuiasSazonaisByEspecieUseCase } from './get-guias-sazonais-by-especie.use-case';
import { GuiaSazonalRepository, GuiaSazonalResponseDTO } from '../guia-sazonal.types';

describe('GetGuiasSazonaisByEspecieUseCase', () => {
  let useCase: GetGuiasSazonaisByEspecieUseCase;
  let mockRepository: jest.Mocked<GuiaSazonalRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      especieExists: jest.fn(),
      atividadeExists: jest.fn(),
      findAll: jest.fn(),
      findByEspecie: jest.fn(),
    };
    useCase = new GetGuiasSazonaisByEspecieUseCase(mockRepository);
  });

  it('should return guias sazonais for a given especie', async () => {
    // Arrange
    const especieId = 'especie-1';
    const expected: GuiaSazonalResponseDTO[] = [
      { especieId, atividadeId: '1', estacao: 'PRIMAVERA', momentoIdeal: 'DEVE_FAZER', observacoes: null },
    ];
    mockRepository.especieExists.mockResolvedValue(true);
    mockRepository.findByEspecie.mockResolvedValue(expected);

    // Act
    const result = await useCase.execute(especieId);

    // Assert
    expect(mockRepository.especieExists).toHaveBeenCalledWith(especieId);
    expect(mockRepository.findByEspecie).toHaveBeenCalledWith(especieId);
    expect(result).toEqual(expected);
  });

  it('should throw error when especie does not exist', async () => {
    // Arrange
    mockRepository.especieExists.mockResolvedValue(false);

    // Act & Assert
    await expect(useCase.execute('non-existent')).rejects.toThrow('Espécie não encontrada');
  });
});
