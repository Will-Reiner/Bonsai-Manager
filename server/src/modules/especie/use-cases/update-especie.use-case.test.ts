import { UpdateEspecieUseCase, UpdateEspecieUseCaseRequest } from './update-especie.use-case';
import { EspecieRepository, EspecieResponseDTO, EspecieWithRelationsResponseDTO } from '../especie.types';
import { TipoPlanta } from '@prisma/client';

describe('UpdateEspecieUseCase', () => {
  let updateEspecieUseCase: UpdateEspecieUseCase;
  let mockEspecieRepository: jest.Mocked<EspecieRepository>;

  beforeEach(() => {
    mockEspecieRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByNomeCientifico: jest.fn(),
      existsByNomeCientificoExcludingId: jest.fn(),
    };

    updateEspecieUseCase = new UpdateEspecieUseCase(mockEspecieRepository);
  });

  it('should update especie successfully', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData: UpdateEspecieUseCaseRequest = {
      id: especieId,
      nomeComum: 'Ficus Atualizado',
      luminosidade: 'Sol pleno',
      rega: 'Abundante',
    };

    const existingEspecie: EspecieWithRelationsResponseDTO = {
      id: especieId,
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      familia: 'Moraceae',
      origem: null,
      tipoDePlanta: null,
      folhas: null,
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: null,
      rega: null,
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
      guiasDeTecnicas: [],
      guiasSazonais: [],
    };

    const expectedResponse: EspecieResponseDTO = {
      id: especieId,
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus Atualizado',
      familia: 'Moraceae',
      origem: null,
      tipoDePlanta: null,
      folhas: null,
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: 'Sol pleno',
      rega: 'Abundante',
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
    };

    mockEspecieRepository.findById.mockResolvedValue(existingEspecie);
    mockEspecieRepository.update.mockResolvedValue(expectedResponse);

    // Act
    const result = await updateEspecieUseCase.execute(updateData);

    // Assert
    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockEspecieRepository.update).toHaveBeenCalledWith(especieId, {
      nomeComum: 'Ficus Atualizado',
      luminosidade: 'Sol pleno',
      rega: 'Abundante',
    });
    expect(result).toEqual(expectedResponse);
  });

  it('should throw error when especie is not found', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData: UpdateEspecieUseCaseRequest = {
      id: especieId,
      nomeComum: 'Ficus Atualizado',
    };

    mockEspecieRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(updateEspecieUseCase.execute(updateData)).rejects.toThrow(
      'Espécie não encontrada.'
    );

    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockEspecieRepository.update).not.toHaveBeenCalled();
  });

  it('should update nomeCientifico when it does not conflict', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData: UpdateEspecieUseCaseRequest = {
      id: especieId,
      nomeCientifico: 'Ficus elastica',
      nomeComum: 'Ficus Elástica',
    };

    const existingEspecie: EspecieWithRelationsResponseDTO = {
      id: especieId,
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      familia: null,
      origem: null,
      tipoDePlanta: null,
      folhas: null,
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: null,
      rega: null,
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
      guiasDeTecnicas: [],
      guiasSazonais: [],
    };

    const expectedResponse: EspecieResponseDTO = {
      id: especieId,
      nomeCientifico: 'Ficus elastica',
      nomeComum: 'Ficus Elástica',
      familia: null,
      origem: null,
      tipoDePlanta: null,
      folhas: null,
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: null,
      rega: null,
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
    };

    mockEspecieRepository.findById.mockResolvedValue(existingEspecie);
    mockEspecieRepository.existsByNomeCientificoExcludingId.mockResolvedValue(false);
    mockEspecieRepository.update.mockResolvedValue(expectedResponse);

    // Act
    const result = await updateEspecieUseCase.execute(updateData);

    // Assert
    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockEspecieRepository.existsByNomeCientificoExcludingId).toHaveBeenCalledWith(
      'Ficus elastica',
      especieId
    );
    expect(mockEspecieRepository.update).toHaveBeenCalledWith(especieId, {
      nomeCientifico: 'Ficus elastica',
      nomeComum: 'Ficus Elástica',
    });
    expect(result).toEqual(expectedResponse);
  });

  it('should throw error when trying to update to existing nomeCientifico', async () => {
    // Arrange
    const especieId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData: UpdateEspecieUseCaseRequest = {
      id: especieId,
      nomeCientifico: 'Juniperus chinensis',
    };

    const existingEspecie: EspecieWithRelationsResponseDTO = {
      id: especieId,
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      familia: null,
      origem: null,
      tipoDePlanta: null,
      folhas: null,
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: null,
      rega: null,
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
      guiasDeTecnicas: [],
      guiasSazonais: [],
    };

    mockEspecieRepository.findById.mockResolvedValue(existingEspecie);
    mockEspecieRepository.existsByNomeCientificoExcludingId.mockResolvedValue(true);

    // Act & Assert
    await expect(updateEspecieUseCase.execute(updateData)).rejects.toThrow(
      'Já existe uma espécie com este nome científico.'
    );

    expect(mockEspecieRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockEspecieRepository.existsByNomeCientificoExcludingId).toHaveBeenCalledWith(
      'Juniperus chinensis',
      especieId
    );
    expect(mockEspecieRepository.update).not.toHaveBeenCalled();
  });
});