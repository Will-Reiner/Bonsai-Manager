import { Request, Response } from 'express';
import { presignedUrlSchema } from './midia.schema';
import { GeneratePresignedUrlUseCase } from './use-cases/generate-presigned-url.use-case';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../../config/r2';

export class MidiaController {
  private generatePresignedUrlUseCase: GeneratePresignedUrlUseCase;

  constructor() {
    this.generatePresignedUrlUseCase = new GeneratePresignedUrlUseCase(
      r2Client,
      R2_BUCKET,
      R2_PUBLIC_URL,
    );
  }

  async generatePresignedUrl(req: Request, res: Response) {
    try {
      const { body } = presignedUrlSchema.parse({ body: req.body });

      const result = await this.generatePresignedUrlUseCase.execute(body);

      res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao gerar URL assinada:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
