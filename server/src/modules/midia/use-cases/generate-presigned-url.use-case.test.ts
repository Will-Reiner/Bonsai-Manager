import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GeneratePresignedUrlUseCase } from './generate-presigned-url.use-case';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe('GeneratePresignedUrlUseCase', () => {
  let useCase: GeneratePresignedUrlUseCase;
  let mockS3Client: jest.Mocked<S3Client>;
  const mockBucket = 'test-bucket';
  const mockPublicUrl = 'https://pub-test.r2.dev';
  const mockSignedUrl = 'https://r2.cloudflarestorage.com/signed-url?X-Amz-Signature=abc';

  beforeEach(() => {
    mockS3Client = new S3Client({}) as jest.Mocked<S3Client>;
    (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);
    useCase = new GeneratePresignedUrlUseCase(mockS3Client, mockBucket, mockPublicUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar uploadUrl, publicUrl e key para uma imagem', async () => {
    const result = await useCase.execute({
      fileName: 'foto.webp',
      fileType: 'image/webp',
    });

    expect(result.uploadUrl).toBe(mockSignedUrl);
    expect(result.key).toMatch(/^media\/[0-9a-f-]{36}\/foto\.webp$/);
    expect(result.publicUrl).toMatch(new RegExp(`^${mockPublicUrl}/media/`));
  });

  it('deve sanitizar o nome do arquivo removendo caracteres especiais', async () => {
    const result = await useCase.execute({
      fileName: 'minha foto especial!@#.jpg',
      fileType: 'image/jpeg',
    });

    expect(result.key).not.toMatch(/[!@#\s]/);
    expect(result.key).toMatch(/^media\/[0-9a-f-]{36}\//);
  });

  it('deve gerar chaves únicas para uploads diferentes', async () => {
    const result1 = await useCase.execute({ fileName: 'video.mp4', fileType: 'video/mp4' });
    const result2 = await useCase.execute({ fileName: 'video.mp4', fileType: 'video/mp4' });

    expect(result1.key).not.toBe(result2.key);
  });

  it('deve montar a publicUrl corretamente com a chave gerada', async () => {
    const result = await useCase.execute({ fileName: 'thumb.webp', fileType: 'image/webp' });

    expect(result.publicUrl).toBe(`${mockPublicUrl}/${result.key}`);
  });

  it('deve chamar getSignedUrl com expiresIn de 300 segundos', async () => {
    await useCase.execute({ fileName: 'foto.webp', fileType: 'image/webp' });

    expect(getSignedUrl).toHaveBeenCalledWith(
      mockS3Client,
      expect.anything(),
      { expiresIn: 300 },
    );
  });
});
