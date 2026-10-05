import { LimparMidiasOrfasUseCase } from './limpar-midias-orfas.use-case';
import { MidiaReferenciaRepository, MidiaStorage } from '../midia.types';

describe('LimparMidiasOrfasUseCase', () => {
  let useCase: LimparMidiasOrfasUseCase;
  let mockReferencias: jest.Mocked<MidiaReferenciaRepository>;
  let mockStorage: jest.Mocked<MidiaStorage>;

  beforeEach(() => {
    mockReferencias = { urlsEmUso: jest.fn().mockResolvedValue([]) };
    mockStorage = { removerPorUrls: jest.fn().mockResolvedValue(undefined) };
    useCase = new LimparMidiasOrfasUseCase(mockReferencias, mockStorage);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve remover do storage as URLs que não são mais usadas', async () => {
    // Act
    await useCase.execute(['https://cdn/a.webp', 'https://cdn/b.webp']);

    // Assert
    expect(mockReferencias.urlsEmUso).toHaveBeenCalledWith(['https://cdn/a.webp', 'https://cdn/b.webp']);
    expect(mockStorage.removerPorUrls).toHaveBeenCalledWith(['https://cdn/a.webp', 'https://cdn/b.webp']);
  });

  it('não deve remover URLs que ainda são referenciadas', async () => {
    // Arrange
    mockReferencias.urlsEmUso.mockResolvedValue(['https://cdn/a.webp']);

    // Act
    await useCase.execute(['https://cdn/a.webp', 'https://cdn/b.webp']);

    // Assert
    expect(mockStorage.removerPorUrls).toHaveBeenCalledWith(['https://cdn/b.webp']);
  });

  it('deve ignorar valores vazios e URLs repetidas', async () => {
    // Act
    await useCase.execute([null, 'https://cdn/a.webp', undefined, '', 'https://cdn/a.webp']);

    // Assert
    expect(mockReferencias.urlsEmUso).toHaveBeenCalledWith(['https://cdn/a.webp']);
    expect(mockStorage.removerPorUrls).toHaveBeenCalledWith(['https://cdn/a.webp']);
  });

  it('não deve consultar nada quando não há URLs', async () => {
    // Act
    await useCase.execute([null, undefined]);

    // Assert
    expect(mockReferencias.urlsEmUso).not.toHaveBeenCalled();
    expect(mockStorage.removerPorUrls).not.toHaveBeenCalled();
  });

  it('não deve chamar o storage quando todas as URLs estão em uso', async () => {
    // Arrange
    mockReferencias.urlsEmUso.mockResolvedValue(['https://cdn/a.webp']);

    // Act
    await useCase.execute(['https://cdn/a.webp']);

    // Assert
    expect(mockStorage.removerPorUrls).not.toHaveBeenCalled();
  });

  it('não deve lançar erro quando o storage falha (limpeza é best-effort)', async () => {
    // Arrange
    mockStorage.removerPorUrls.mockRejectedValue(new Error('R2 fora do ar'));

    // Act & Assert
    await expect(useCase.execute(['https://cdn/a.webp'])).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('não deve lançar erro quando a consulta de referências falha', async () => {
    // Arrange
    mockReferencias.urlsEmUso.mockRejectedValue(new Error('Erro do banco'));

    // Act & Assert
    await expect(useCase.execute(['https://cdn/a.webp'])).resolves.toBeUndefined();
    expect(mockStorage.removerPorUrls).not.toHaveBeenCalled();
  });
});
