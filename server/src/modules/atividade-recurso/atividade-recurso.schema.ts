import { z } from 'zod';

export const createAtividadeRecursoSchema = z.object({
  body: z.object({
    atividadeId: z.string().uuid({ message: 'O ID da atividade é obrigatório.' }),
    tipoRecursoId: z.string().uuid({ message: 'O ID do tipo de recurso é obrigatório.' }),
  }),
});

export const atividadeRecursoIdSchema = z.object({
  params: z.object({
    atividadeId: z.string().uuid({ message: 'ID da atividade inválido.' }),
    tipoRecursoId: z.string().uuid({ message: 'ID do tipo de recurso inválido.' }),
  }),
});

export const atividadeIdSchema = z.object({
  params: z.object({
    atividadeId: z.string().uuid({ message: 'ID da atividade inválido.' }),
  }),
});

export const tipoRecursoIdSchema = z.object({
  params: z.object({
    tipoRecursoId: z.string().uuid({ message: 'ID do tipo de recurso inválido.' }),
  }),
});