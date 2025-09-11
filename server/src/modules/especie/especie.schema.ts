import { z } from 'zod';

// Schema para criar uma nova espécie
export const createEspecieSchema = z.object({
  body: z.object({
    nomeCientifico: z
      .string()
      .min(3, { message: 'O nome científico deve ter pelo menos 3 caracteres.' }),
    nomeComum: z.string().optional(),
    informacoesGerais: z.string().optional(),
  }),
});

// Schema para atualizar uma espécie (todos os campos são opcionais)
export const updateEspecieSchema = z.object({
  body: z.object({
    nomeCientifico: z
      .string()
      .min(3, { message: 'O nome científico deve ter pelo menos 3 caracteres.' })
      .optional(),
    nomeComum: z.string().optional(),
    informacoesGerais: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID da espécie inválido.' }),
  }),
});

// Schema para validar apenas o ID (usado para buscar e deletar)
export const especieIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da espécie inválido.' }),
  }),
});
