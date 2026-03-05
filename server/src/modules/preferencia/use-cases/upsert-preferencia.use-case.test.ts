import { UpsertPreferenciaUseCase } from './upsert-preferencia.use-case';
import { PreferenciaRepository } from '../preferencia.types';

describe('UpsertPreferenciaUseCase', () => {
  let useCase: UpsertPreferenciaUseCase;
  let mockRepository: jest.Mocked<PreferenciaRepository>;

  const mockUsuarioId = 'user-123';

  beforeEach(() => {
    mockRepository = {
      findAllByUsuario: jest.fn(),
      upsert: jest.fn(),
      upsertMany: jest.fn(),
    };
    useCase = new UpsertPreferenciaUseCase(mockRepository);
  });

  it('deve criar/atualizar uma preferência individual', async () => {
    // Arrange
    const mockResult = {
      id: '1',
      chave: 'usa_identificador',
      valor: 'true',
      usuarioId: mockUsuarioId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRepository.upsert.mockResolvedValue(mockResult);

    // Act
    const resultado = await useCase.execute(mockUsuarioId, 'usa_identificador', 'true');

    // Assert
    expect(resultado).toEqual(mockResult);
    expect(mockRepository.upsert).toHaveBeenCalledWith(mockUsuarioId, 'usa_identificador', 'true');
  });
});
