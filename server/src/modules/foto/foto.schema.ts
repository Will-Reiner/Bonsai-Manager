import { z } from 'zod';

export const createFotoSchema = z.object({
  body: z.object({
    plantaId: z.string().uuid({ message: 'O ID da planta é obrigatório.' }),
    caminhoArquivo: z.string().min(1, { message: 'O caminho do arquivo é obrigatório.' }),
    descricao: z.string().optional(),
  }),
});

export const updateFotoSchema = z.object({
  body: z.object({
    plantaId: z.string().uuid().optional(),
    caminhoArquivo: z.string().min(1).optional(),
    descricao: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID da foto inválido.' }),
  }),
});

export const fotoIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da foto inválido.' }),
  }),
});

export const plantaIdSchema = z.object({
  params: z.object({
    plantaId: z.string().uuid({ message: 'ID da planta inválido.' }),
  }),
});