import { z } from 'zod';

// Criamos um Zod Enum que corresponde ao Enum do Prisma para UnidadeMedida
const UnidadeMedidaEnum = z.enum(['UNIDADE', 'KG', 'G', 'L', 'ML']);

export const createRecursoSchema = z.object({
  body: z.object({
    tipoRecursoId: z.string().uuid({ message: 'O ID do tipo de recurso é obrigatório.' }),
    quantidadeDisponivel: z.number().int().min(0, { message: 'A quantidade disponível deve ser um número inteiro não negativo.' }),
    unidadeMedida: UnidadeMedidaEnum.optional(),
    observacoes: z.string().optional(),
  }),
});

export const updateRecursoSchema = z.object({
  body: z.object({
    tipoRecursoId: z.string().uuid().optional(),
    quantidadeDisponivel: z.number().int().min(0).optional(),
    unidadeMedida: UnidadeMedidaEnum.optional(),
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