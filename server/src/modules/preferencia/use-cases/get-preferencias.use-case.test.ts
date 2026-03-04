import { GetPreferenciasUseCase } from './get-preferencias.use-case';
import { PreferenciaRepository } from '../preferencia.types';

describe('GetPreferenciasUseCase', () => {
  let useCase: GetPreferenciasUseCase;
  let mockRepository: jest.Mocked<PreferenciaRepository>;

  const mockUsuarioId = 'user-123';

  beforeEach(() => {
    mockRepository = {
      findAllByUsuario: jest.fn(),
      upsert: jest.fn(),
      upsertMany: jest.fn(),
    };
    useCase = new GetPreferenciasUseCase(mockRepository);
  });

  it('deve retornar as preferências do usuário como objeto chave-valor', async () => {
    // Arrange
    mockRepository.findAllByUsuario.mockResolvedValue([
      { id: '1', chave: 'usa_identificador', valor: 'true', usuarioId: mockUsuarioId, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', chave: 'adubacao_modo', valor: 'GERAL', usuarioId: mockUsuarioId, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Act
    const resultado = await useCase.execute(mockUsuarioId);

    // Assert
    expect(resultado).toEqual({
      usa_identificador: 'true',
      adubacao_modo: 'GERAL',
    });
    expect(mockRepository.findAllByUsuario).toHaveBeenCalledWith(mockUsuarioId);
  });

  it('deve retornar objeto vazio se o usuário não tem preferências', async () => {
    // Arrange
    mockRepository.findAllByUsuario.mockResolvedValue([]);

    // Act
    const resultado = await useCase.execute(mockUsuarioId);

    // Assert
    expect(resultado).toEqual({});
  });
});
