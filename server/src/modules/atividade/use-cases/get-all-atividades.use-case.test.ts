import { GetAllAtividadesUseCase } from './get-all-atividades.use-case';
import { AtividadeRepository, AtividadeResponseDTO } from '../atividade.types';

describe('GetAllAtividadesUseCase', () => {
  let getAllAtividadesUseCase: GetAllAtividadesUseCase;
  let mockAtividadeRepository: jest.Mocked<AtividadeRepository>;

  beforeEach(() => {
    mockAtividadeRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByNome: jest.fn(),
      existsByNomeExcludingId: jest.fn(),
    };

    getAllAtividadesUseCase = new GetAllAtividadesUseCase(mockAtividadeRepository);
  });

  it('should return all atividades successfully', async () => {
    // Arrange
    const expectedAtividades: AtividadeResponseDTO[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        nome: 'Poda de Formação',
        descricao: 'Poda para dar forma à planta',
        objetivos: 'Melhorar a estrutura da planta',
        preparacao: 'Preparar ferramentas de poda',
        execucao: 'Cortar galhos desnecessários',
        cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
        createdAt: new Date(),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        nome: 'Rega',
        descricao: 'Irrigação da planta',
        objetivos: null,
        preparacao: null,
        execucao: null,
        cuidadosPosProcedimento: null,
        createdAt: new Date(),
      },
    ];

    mockAtividadeRepository.findAll.mockResolvedValue(expectedAtividades);

    // Act
    const result = await getAllAtividadesUseCase.execute();

    // Assert
    expect(mockAtividadeRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedAtividades);
  });

  it('should return empty array when no atividades exist', async () => {
    // Arrange
    mockAtividadeRepository.findAll.mockResolvedValue([]);

    // Act
    const result = await getAllAtividadesUseCase.execute();

    // Assert
    expect(mockAtividadeRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});