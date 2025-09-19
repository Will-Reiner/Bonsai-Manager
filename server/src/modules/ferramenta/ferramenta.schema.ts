import { z } from 'zod';

export const createFerramentaSchema = z.object({
  body: z.object({
    nome: z.string().min(3, { message: 'O nome da ferramenta deve ter pelo menos 3 caracteres.' }),
    descricao: z.string().optional(),
  }),
});

export const updateFerramentaSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
    descricao: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID da ferramenta inválido.' }),
  }),
});

export const ferramentaIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da ferramenta inválido.' }),
  }),
});