import { UpdateEspecieUseCase, UpdateEspecieUseCaseRequest } from './update-especie.use-case';
import { EspecieRepository, EspecieResponseDTO, EspecieWithRelationsResponseDTO } from '../especie.types';
import { StatusEspecie } from '@prisma/client';

describe('UpdateEspecieUseCase', () => {
  let updateEspecieUseCase: UpdateEspecieUseCase;
  let mockEspecieRepository: jest.Mocked<EspecieRepository>;

  beforeEach(() => {
    mockEspecieRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByNomeCientifico: jest.fn(),
      existsByNomeCientificoExcludingId: jest.fn(),
    };

    updateEspecieUseCase = new UpdateEspecieUseCase(mockEspecieRepository);
  });

  const especieId = '123e4567-e89b-12d3-a456-426614174000';

  const buildExisting = (overrides: Partial<EspecieWithRelationsResponseDTO> = {}): EspecieWithRelationsResponseDTO => ({
    id: especieId,
    nomeCientifico: 'Ficus benjamina',
    nomeComum: 'Ficus',
    familia: 'Moraceae',
    origem: null,
    tipoDePlanta: null,
    status: 'SUGERIDO' as StatusEspecie,
    criadoPorId: 'user-123',
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
    ...overrides,
  });

  const buildResponse = (overrides: Partial<EspecieResponseDTO> = {}): EspecieResponseDTO => ({
    id: especieId,
    nomeCientifico: 'Ficus benjamina',
    nomeComum: 'Ficus',
    familia: 'Moraceae',
    origem: null,
    tipoDePlanta: null,
    status: 'SUGERIDO' as StatusEspecie,
    criadoPorId: 'user-123',
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
    ...overrides,
  });

  it('should update especie successfully', async () => {
    mockEspecieRepository.findById.mockResolvedValue(buildExisting());
    mockEspecieRepository.update.mockResolvedValue(buildResponse({ nomeComum: 'Ficus Atualizado' }));

    const result = await updateEspecieUseCase.execute({
      id: especieId,
      nomeComum: 'Ficus Atualizado',
    });

    expect(mockEspecieRepository.update).toHaveBeenCalledWith(especieId, {
      nomeComum: 'Ficus Atualizado',
    });
    expect(result.nomeComum).toBe('Ficus Atualizado');
  });

  it('should throw error when especie is not found', async () => {
    mockEspecieRepository.findById.mockResolvedValue(null);

    await expect(updateEspecieUseCase.execute({
      id: especieId,
      nomeComum: 'Ficus Atualizado',
    })).rejects.toThrow('Espécie não encontrada.');

    expect(mockEspecieRepository.update).not.toHaveBeenCalled();
  });

  it('should allow admin to change status from SUGERIDO to VERIFICADO', async () => {
    mockEspecieRepository.findById.mockResolvedValue(buildExisting());
    mockEspecieRepository.update.mockResolvedValue(buildResponse({ status: 'VERIFICADO' as StatusEspecie }));

    const result = await updateEspecieUseCase.execute({
      id: especieId,
      status: 'VERIFICADO' as StatusEspecie,
      isAdmin: true,
    });

    expect(mockEspecieRepository.update).toHaveBeenCalledWith(especieId, {
      status: 'VERIFICADO',
    });
    expect(result.status).toBe('VERIFICADO');
  });

  it('should throw error when non-admin tries to change status', async () => {
    mockEspecieRepository.findById.mockResolvedValue(buildExisting());

    await expect(updateEspecieUseCase.execute({
      id: especieId,
      status: 'VERIFICADO' as StatusEspecie,
      isAdmin: false,
    })).rejects.toThrow('Apenas administradores podem alterar o status da espécie.');

    expect(mockEspecieRepository.update).not.toHaveBeenCalled();
  });

  it('should update nomeCientifico when it does not conflict', async () => {
    mockEspecieRepository.findById.mockResolvedValue(buildExisting());
    mockEspecieRepository.existsByNomeCientificoExcludingId.mockResolvedValue(false);
    mockEspecieRepository.update.mockResolvedValue(buildResponse({ nomeCientifico: 'Ficus elastica' }));

    const result = await updateEspecieUseCase.execute({
      id: especieId,
      nomeCientifico: 'Ficus elastica',
    });

    expect(mockEspecieRepository.existsByNomeCientificoExcludingId).toHaveBeenCalledWith('Ficus elastica', especieId);
    expect(result.nomeCientifico).toBe('Ficus elastica');
  });

  it('should throw error when trying to update to existing nomeCientifico', async () => {
    mockEspecieRepository.findById.mockResolvedValue(buildExisting());
    mockEspecieRepository.existsByNomeCientificoExcludingId.mockResolvedValue(true);

    await expect(updateEspecieUseCase.execute({
      id: especieId,
      nomeCientifico: 'Juniperus chinensis',
    })).rejects.toThrow('Já existe uma espécie com este nome científico.');

    expect(mockEspecieRepository.update).not.toHaveBeenCalled();
  });
});
