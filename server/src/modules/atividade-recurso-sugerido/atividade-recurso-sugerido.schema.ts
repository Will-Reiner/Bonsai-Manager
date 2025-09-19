import { z } from 'zod';

export const atividadeRecursoSugeridoSchema = z.object({
  params: z.object({
    atividadeId: z.string().uuid(),
    tipoRecursoId: z.string().uuid(),
  }),
});