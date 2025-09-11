import { z } from 'zod';

export const createTipoRecursoSchema = z.object({
  body: z.object({
    nome: z.string().min(2, { message: 'O nome do tipo de recurso deve ter pelo menos 2 caracteres.' }),
  }),
});

export const updateTipoRecursoSchema = z.object({
  body: z.object({
    nome: z.string().min(2).optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID do tipo de recurso inválido.' }),
  }),
});

export const tipoRecursoIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID do tipo de recurso inválido.' }),
  }),
});