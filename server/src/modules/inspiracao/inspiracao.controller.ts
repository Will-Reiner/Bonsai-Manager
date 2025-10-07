import { Request, Response } from 'express';
import { inspiracaoSchema } from './inspiracao.schema';
import { PrismaInspiracaoRepository } from './repositories/prisma-inspiracao.repository';
import { AddInspiracaoUseCase, RemoveInspiracaoUseCase } from './use-cases';

export class InspiracaoController {
  private repository: PrismaInspiracaoRepository;
  private addInspiracaoUseCase: AddInspiracaoUseCase;
  private removeInspiracaoUseCase: RemoveInspiracaoUseCase;

  constructor() {
    this.repository = new PrismaInspiracaoRepository();
    this.addInspiracaoUseCase = new AddInspiracaoUseCase(this.repository);
    this.removeInspiracaoUseCase = new RemoveInspiracaoUseCase(this.repository);
  }

  add = async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaId, fotoId } = inspiracaoSchema.parse(req).params;

      const result = await this.addInspiracaoUseCase.execute({
        plantaId,
        fotoId,
        usuarioId,
      });

      if (!result.success) {
        if (result.error === 'A sua planta não foi encontrada.') {
          return res.status(404).json({ message: result.error });
        }
        if (result.error === 'A foto de inspiração não foi encontrada ou não pode ser usada como inspiração.') {
          return res.status(404).json({ message: 'A foto de inspiração não foi encontrada.' });
        }
        if (result.error === 'Esta inspiração já existe para esta planta.') {
          return res.status(409).json({ message: result.error });
        }
        return res.status(400).json({ message: result.error });
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(400).json({ error });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaId, fotoId } = inspiracaoSchema.parse(req).params;

      const result = await this.removeInspiracaoUseCase.execute({
        plantaId,
        fotoId,
        usuarioId,
      });

      if (!result.success) {
        if (result.error === 'Ligação de inspiração não encontrada.') {
          return res.status(404).json({ message: result.error });
        }
        return res.status(400).json({ message: result.error });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  };
}