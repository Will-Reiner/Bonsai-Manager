import { CreateEspecieUseCase } from './create-especie.use-case';
import { EspecieRepository, CreateEspecieRequestDTO, EspecieResponseDTO } from '../especie.types';
import { TipoPlanta } from '@prisma/client';

describe('CreateEspecieUseCase', () => {
  let createEspecieUseCase: CreateEspecieUseCase;
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

    createEspecieUseCase = new CreateEspecieUseCase(mockEspecieRepository);
  });

  it('should create a new especie successfully', async () => {
    // Arrange
    const createEspecieData: CreateEspecieRequestDTO = {
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      familia: 'Moraceae',
      origem: 'Ásia',
      tipoDePlanta: 'PERENE' as TipoPlanta,
      folhas: 'Pequenas e verdes',
      luminosidade: 'Luz indireta',
      rega: 'Moderada',
    };

    const expectedResponse: EspecieResponseDTO = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
      familia: 'Moraceae',
      origem: 'Ásia',
      tipoDePlanta: 'PERENE' as TipoPlanta,
      folhas: 'Pequenas e verdes',
      tronco: null,
      flores: null,
      frutos: null,
      raizes: null,
      luminosidade: 'Luz indireta',
      rega: 'Moderada',
      substratoIdeal: null,
      adubacao: null,
      clima: null,
      problemasComuns: null,
      pros: null,
      contras: null,
      linhasDeRaciocinio: null,
      observacoes: null,
    };

    mockEspecieRepository.existsByNomeCientifico.mockResolvedValue(false);
    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    // Act
    const result = await createEspecieUseCase.execute(createEspecieData);

    // Assert
    expect(mockEspecieRepository.existsByNomeCientifico).toHaveBeenCalledWith('Ficus benjamina');
    expect(mockEspecieRepository.create).toHaveBeenCalledWith(createEspecieData);
    expect(result).toEqual(expectedResponse);
  });

  it('should throw error when especie with same nomeCientifico already exists', async () => {
    // Arrange
    const createEspecieData: CreateEspecieRequestDTO = {
      nomeCientifico: 'Ficus benjamina',
      nomeComum: 'Ficus',
    };

    mockEspecieRepository.existsByNomeCientifico.mockResolvedValue(true);

    // Act & Assert
    await expect(createEspecieUseCase.execute(createEspecieData)).rejects.toThrow(
      'Já existe uma espécie com este nome científico.'
    );

    expect(mockEspecieRepository.existsByNomeCientifico).toHaveBeenCalledWith('Ficus benjamina');
    expect(mockEspecieRepository.create).not.toHaveBeenCalled();
  });

  it('should create especie with minimal required data', async () => {
    // Arrange
    const createEspecieData: CreateEspecieRequestDTO = {
      nomeCientifico: 'Juniperus chinensis',
    };

    const expectedResponse: EspecieResponseDTO = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      nomeCientifico: 'Juniperus chinensis',
      nomeComum: null,
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

    mockEspecieRepository.existsByNomeCientifico.mockResolvedValue(false);
    mockEspecieRepository.create.mockResolvedValue(expectedResponse);

    // Act
    const result = await createEspecieUseCase.execute(createEspecieData);

    // Assert
    expect(mockEspecieRepository.existsByNomeCientifico).toHaveBeenCalledWith('Juniperus chinensis');
    expect(mockEspecieRepository.create).toHaveBeenCalledWith(createEspecieData);
    expect(result).toEqual(expectedResponse);
  });
});