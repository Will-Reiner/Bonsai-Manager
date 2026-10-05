import { S3Client } from '@aws-sdk/client-s3';
import { R2MidiaStorage } from './r2-midia-storage';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  DeleteObjectsCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe('R2MidiaStorage', () => {
  const publicUrl = 'https://pub-test.r2.dev';
  let send: jest.Mock;
  let storage: R2MidiaStorage;

  beforeEach(() => {
    send = jest.fn().mockResolvedValue({});
    storage = new R2MidiaStorage({ send } as unknown as S3Client, 'bucket-teste', publicUrl);
  });

  it('deve converter as URLs públicas em chaves e apagar em uma chamada', async () => {
    // Act
    await storage.removerPorUrls([`${publicUrl}/media/1/a.webp`, `${publicUrl}/media/2/b.webp`]);

    // Assert
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'bucket-teste',
      Delete: { Objects: [{ Key: 'media/1/a.webp' }, { Key: 'media/2/b.webp' }], Quiet: true },
    });
  });

  it('deve decodificar caracteres escapados na URL', async () => {
    // Act
    await storage.removerPorUrls([`${publicUrl}/media/1/minha%20foto.webp`]);

    // Assert
    expect(send.mock.calls[0][0].input.Delete.Objects).toEqual([{ Key: 'media/1/minha foto.webp' }]);
  });

  it('deve ignorar URLs que não são do bucket', async () => {
    // Act
    await storage.removerPorUrls(['https://outro-site.com/foto.jpg', `${publicUrl}/media/1/a.webp`]);

    // Assert
    expect(send.mock.calls[0][0].input.Delete.Objects).toEqual([{ Key: 'media/1/a.webp' }]);
  });

  it('não deve chamar o R2 quando nenhuma URL é do bucket', async () => {
    // Act
    await storage.removerPorUrls(['https://outro-site.com/foto.jpg']);

    // Assert
    expect(send).not.toHaveBeenCalled();
  });

  it('deve dividir em lotes de 1000 chaves (limite do DeleteObjects)', async () => {
    // Arrange
    const urls = Array.from({ length: 1001 }, (_, i) => `${publicUrl}/media/${i}.webp`);

    // Act
    await storage.removerPorUrls(urls);

    // Assert
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].input.Delete.Objects).toHaveLength(1000);
    expect(send.mock.calls[1][0].input.Delete.Objects).toHaveLength(1);
  });

  it('deve lançar erro quando o R2 informa falhas na remoção', async () => {
    // Arrange
    send.mockResolvedValue({ Errors: [{ Key: 'media/1/a.webp', Code: 'AccessDenied' }] });

    // Act & Assert
    await expect(storage.removerPorUrls([`${publicUrl}/media/1/a.webp`])).rejects.toThrow('media/1/a.webp');
  });
});
