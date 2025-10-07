import { UpdateAtividadeUseCase, UpdateAtividadeUseCaseRequest } from './update-atividade.use-case';
import { AtividadeRepository, AtividadeResponseDTO, AtividadeWithRelationsResponseDTO } from '../atividade.types';

describe('UpdateAtividadeUseCase', () => {
  let updateAtividadeUseCase: UpdateAtividadeUseCase;
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

    updateAtividadeUseCase = new UpdateAtividadeUseCase(mockAtividadeRepository);
  });

  it('should update atividade successfully', async () => {
    // Arrange
    const atividadeId = '123e4567-e89b-12d3-a456-426614174000';
    const request: UpdateAtividadeUseCaseRequest = {
      id: atividadeId,
      nome: 'Poda de Manutenção',
      descricao: 'Poda para manter a forma da planta',
      objetivos: 'Manter a estrutura da planta',
    };

    const existingAtividade: AtividadeWithRelationsResponseDTO = {
      id: atividadeId,
      nome: 'Poda de Formação',
      descricao: 'Poda para dar forma à planta',
      objetivos: 'Melhorar a estrutura da planta',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
      createdAt: new Date(),
      agendas: [],
      guiasDeTecnicas: [],
      guiasSazonais: [],
      recursosSugeridos: [],
      ferramentasSugeridas: [],
    };

    const expectedResponse: AtividadeResponseDTO = {
      id: atividadeId,
      nome: 'Poda de Manutenção',
      descricao: 'Poda para manter a forma da planta',
      objetivos: 'Manter a estrutura da planta',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
      createdAt: new Date(),
    };

    mockAtividadeRepository.findById.mockResolvedValue(existingAtividade);
    mockAtividadeRepository.existsByNomeExcludingId.mockResolvedValue(false);
    mockAtividadeRepository.update.mockResolvedValue(expectedResponse);

    // Act
    const result = await updateAtividadeUseCase.execute(request);

    // Assert
    expect(mockAtividadeRepository.findById).toHaveBeenCalledWith(atividadeId);
    expect(mockAtividadeRepository.existsByNomeExcludingId).toHaveBeenCalledWith('Poda de Manutenção', atividadeId);
    expect(mockAtividadeRepository.update).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it('should throw error when atividade is not found', async () => {
    // Arrange
    const request: UpdateAtividadeUseCaseRequest = {
      id: 'non-existent-id',
      nome: 'Poda de Manutenção',
    };

    mockAtividadeRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(updateAtividadeUseCase.execute(request)).rejects.toThrow(
      'Atividade não encontrada.'
    );

    expect(mockAtividadeRepository.findById).toHaveBeenCalledWith('non-existent-id');
    expect(mockAtividadeRepository.existsByNomeExcludingId).not.toHaveBeenCalled();
    expect(mockAtividadeRepository.update).not.toHaveBeenCalled();
  });

  it('should update atividade without changing nome', async () => {
    // Arrange
    const atividadeId = '123e4567-e89b-12d3-a456-426614174000';
    const request: UpdateAtividadeUseCaseRequest = {
      id: atividadeId,
      descricao: 'Nova descrição',
      objetivos: 'Novos objetivos',
    };

    const existingAtividade: AtividadeWithRelationsResponseDTO = {
      id: atividadeId,
      nome: 'Poda de Formação',
      descricao: 'Poda para dar forma à planta',
      objetivos: 'Melhorar a estrutura da planta',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
      createdAt: new Date(),
      agendas: [],
      guiasDeTecnicas: [],
      guiasSazonais: [],
      recursosSugeridos: [],
      ferramentasSugeridas: [],
    };

    const expectedResponse: AtividadeResponseDTO = {
      id: atividadeId,
      nome: 'Poda de Formação',
      descricao: 'Nova descrição',
      objetivos: 'Novos objetivos',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
      createdAt: new Date(),
    };

    mockAtividadeRepository.findById.mockResolvedValue(existingAtividade);
    mockAtividadeRepository.update.mockResolvedValue(expectedResponse);

    // Act
    const result = await updateAtividadeUseCase.execute(request);

    // Assert
    expect(mockAtividadeRepository.findById).toHaveBeenCalledWith(atividadeId);
    expect(mockAtividadeRepository.existsByNomeExcludingId).not.toHaveBeenCalled();
    expect(mockAtividadeRepository.update).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it('should throw error when trying to update to existing nome', async () => {
    // Arrange
    const atividadeId = '123e4567-e89b-12d3-a456-426614174000';
    const request: UpdateAtividadeUseCaseRequest = {
      id: atividadeId,
      nome: 'Rega',
    };

    const existingAtividade: AtividadeWithRelationsResponseDTO = {
      id: atividadeId,
      nome: 'Poda de Formação',
      descricao: 'Poda para dar forma à planta',
      objetivos: 'Melhorar a estrutura da planta',
      preparacao: 'Preparar ferramentas de poda',
      execucao: 'Cortar galhos desnecessários',
      cuidadosPosProcedimento: 'Aplicar cicatrizante nos cortes',
      createdAt: new Date(),
      agendas: [],
      guiasDeTecnicas: [],
      guiasSazonais: [],
      recursosSugeridos: [],
      ferramentasSugeridas: [],
    };

    mockAtividadeRepository.findById.mockResolvedValue(existingAtividade);
    mockAtividadeRepository.existsByNomeExcludingId.mockResolvedValue(true);

    // Act & Assert
    await expect(updateAtividadeUseCase.execute(request)).rejects.toThrow(
      'Já existe uma atividade com este nome.'
    );

    expect(mockAtividadeRepository.findById).toHaveBeenCalledWith(atividadeId);
    expect(mockAtividadeRepository.existsByNomeExcludingId).toHaveBeenCalledWith('Rega', atividadeId);
    expect(mockAtividadeRepository.update).not.toHaveBeenCalled();
  });
});