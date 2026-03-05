import { CreateAtividadeUseCase, CreateAtividadeUseCaseRequest } from './create-atividade.use-case';
import { AtividadeRepository, AtividadeResponseDTO } from '../atividade.types';

describe('CreateAtividadeUseCase', () => {
  let createAtividadeUseCase: CreateAtividadeUseCase;
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

    createAtividadeUseCase = new CreateAtividadeUseCase(mockAtividadeRepository);
  });

  it('should create a new atividade successfully', async () => {
    // Arrange
    const request: CreateAtividadeUseCaseRequest = {
      nome: 'Poda de Formação',
      descricao: 'Poda para dar forma à planta',
      objetivos: 'Melhorar a estrutura da planta',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
    };

    const expectedResponse: AtividadeResponseDTO = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      nome: 'Poda de Formação',
      descricao: 'Poda para dar forma à planta',
      objetivos: 'Melhorar a estrutura da planta',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
      createdAt: new Date(),
    };

    mockAtividadeRepository.existsByNome.mockResolvedValue(false);
    mockAtividadeRepository.create.mockResolvedValue(expectedResponse);

    // Act
    const result = await createAtividadeUseCase.execute(request);

    // Assert
    expect(mockAtividadeRepository.existsByNome).toHaveBeenCalledWith('Poda de Formação');
    expect(mockAtividadeRepository.create).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it('should throw error when atividade with same name already exists', async () => {
    // Arrange
    const request: CreateAtividadeUseCaseRequest = {
      nome: 'Poda de Formação',
      descricao: 'Poda para dar forma à planta',
    };

    mockAtividadeRepository.existsByNome.mockResolvedValue(true);

    // Act & Assert
    await expect(createAtividadeUseCase.execute(request)).rejects.toThrow(
      'Já existe uma atividade com este nome.'
    );

    expect(mockAtividadeRepository.existsByNome).toHaveBeenCalledWith('Poda de Formação');
    expect(mockAtividadeRepository.create).not.toHaveBeenCalled();
  });

  it('should create atividade with only required fields', async () => {
    // Arrange
    const request: CreateAtividadeUseCaseRequest = {
      nome: 'Rega',
    };

    const expectedResponse: AtividadeResponseDTO = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      nome: 'Rega',
      descricao: null,
      objetivos: null,
      preparacao: null,
      execucao: null,
      cuidadosPosProcedimento: null,
      createdAt: new Date(),
    };

    mockAtividadeRepository.existsByNome.mockResolvedValue(false);
    mockAtividadeRepository.create.mockResolvedValue(expectedResponse);

    // Act
    const result = await createAtividadeUseCase.execute(request);

    // Assert
    expect(mockAtividadeRepository.existsByNome).toHaveBeenCalledWith('Rega');
    expect(mockAtividadeRepository.create).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });
});