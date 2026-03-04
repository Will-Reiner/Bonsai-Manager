import { UpsertPreferenciasEmLoteUseCase } from './upsert-preferencias-em-lote.use-case';
import { PreferenciaRepository } from '../preferencia.types';

describe('UpsertPreferenciasEmLoteUseCase', () => {
  let useCase: UpsertPreferenciasEmLoteUseCase;
  let mockRepository: jest.Mocked<PreferenciaRepository>;

  const mockUsuarioId = 'user-123';

  beforeEach(() => {
    mockRepository = {
      findAllByUsuario: jest.fn(),
      upsert: jest.fn(),
      upsertMany: jest.fn(),
    };
    useCase = new UpsertPreferenciasEmLoteUseCase(mockRepository);
  });

  it('deve fazer upsert de múltiplas preferências de uma vez', async () => {
    // Arrange
    const preferencias = {
      usa_identificador: 'true',
      adubacao_modo: 'GERAL',
      onboarding_concluido: 'true',
    };
    const mockResult = [
      { id: '1', chave: 'usa_identificador', valor: 'true', usuarioId: mockUsuarioId, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', chave: 'adubacao_modo', valor: 'GERAL', usuarioId: mockUsuarioId, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', chave: 'onboarding_concluido', valor: 'true', usuarioId: mockUsuarioId, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockRepository.upsertMany.mockResolvedValue(mockResult);

    // Act
    const resultado = await useCase.execute(mockUsuarioId, preferencias);

    // Assert
    expect(resultado).toEqual(mockResult);
    expect(mockRepository.upsertMany).toHaveBeenCalledWith(mockUsuarioId, preferencias);
  });

  it('deve lançar erro se o objeto de preferências estiver vazio', async () => {
    // Act & Assert
    await expect(useCase.execute(mockUsuarioId, {})).rejects.toThrow('Nenhuma preferência fornecida.');
  });
});
