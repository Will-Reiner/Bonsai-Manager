import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      errors: err.errors.map(e => ({
        campo: e.path.join('.'),
        mensagem: e.message,
      })),
    });
  }

  console.error('Erro não tratado:', err);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
};
