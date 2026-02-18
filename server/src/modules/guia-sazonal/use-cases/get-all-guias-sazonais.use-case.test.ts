import { GetAllGuiasSazonaisUseCase } from './get-all-guias-sazonais.use-case';
import { GuiaSazonalRepository, GuiaSazonalResponseDTO } from '../guia-sazonal.types';

describe('GetAllGuiasSazonaisUseCase', () => {
  let useCase: GetAllGuiasSazonaisUseCase;
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
    useCase = new GetAllGuiasSazonaisUseCase(mockRepository);
  });

  it('should return all guias sazonais', async () => {
    // Arrange
    const expected: GuiaSazonalResponseDTO[] = [
      { especieId: '1', atividadeId: '1', estacao: 'PRIMAVERA', momentoIdeal: 'DEVE_FAZER', observacoes: null },
      { especieId: '1', atividadeId: '2', estacao: 'INVERNO', momentoIdeal: 'EVITAR', observacoes: null },
    ];
    mockRepository.findAll.mockResolvedValue(expected);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it('should return empty array when no guias exist', async () => {
    // Arrange
    mockRepository.findAll.mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual([]);
  });
});
