import { z } from 'zod';

/** Posição da página: "ISO_uuid" (ver codificarCursor). */
const cursor = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z_[0-9a-f-]{36}$/, 'Página inválida.')
  .optional();

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
