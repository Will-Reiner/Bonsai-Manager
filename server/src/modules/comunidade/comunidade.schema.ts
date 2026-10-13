import { z } from 'zod';

const cursor = z.string().uuid('Página inválida.').optional();

export const feedSchema = z.object({
  query: z.object({ aba: z.enum(['seguindo', 'explorar']).default('seguindo'), cursor }),
});

export const idSchema = z.object({
  params: z.object({ id: z.string().uuid('Não encontrado.') }),
});

export const postsDoPerfilSchema = idSchema.extend({
  query: z.object({ cursor }),
});

export const buscaSchema = z.object({
  query: z.object({ q: z.string().max(60).default('') }),
});
