import { z } from 'zod';

export const createAtividadeSchema = z.object({
  body: z.object({
    nome: z.string().min(3, { message: 'O nome da atividade deve ter pelo menos 3 caracteres.' }),
    descricao: z.string().optional(),
    // Novos campos
    objetivos: z.string().optional(),
    preparacao: z.string().optional(),
    execucao: z.string().optional(),
    cuidadosPosProcedimento: z.string().optional(),
  }),
});

export const updateAtividadeSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
    descricao: z.string().optional(),
    // Novos campos
    objetivos: z.string().optional(),
    preparacao: z.string().optional(),
    execucao: z.string().optional(),
    cuidadosPosProcedimento: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID da atividade inválido.' }),
  }),
});

export const atividadeIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da atividade inválido.' }),
  }),
});