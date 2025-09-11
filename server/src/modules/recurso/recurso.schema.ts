import { z } from 'zod';

export const createRecursoSchema = z.object({
  body: z.object({
    tipoRecursoId: z.string().uuid({ message: 'O ID do tipo de recurso é obrigatório.' }),
    quantidadeDisponivel: z.number().int().min(0, { message: 'A quantidade disponível deve ser um número inteiro não negativo.' }),
    unidadeMedida: z.string().optional(),
    status: z.enum(['DISPONIVEL', 'EM_FALTA', 'ENCOMENDADO']).optional(),
    observacoes: z.string().optional(),
  }),
});

export const updateRecursoSchema = z.object({
  body: z.object({
    tipoRecursoId: z.string().uuid().optional(),
    quantidadeDisponivel: z.number().int().min(0).optional(),
    unidadeMedida: z.string().optional(),
    status: z.enum(['DISPONIVEL', 'EM_FALTA', 'ENCOMENDADO']).optional(),
    observacoes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID do recurso inválido.' }),
  }),
});

export const recursoIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID do recurso inválido.' }),
  }),
});