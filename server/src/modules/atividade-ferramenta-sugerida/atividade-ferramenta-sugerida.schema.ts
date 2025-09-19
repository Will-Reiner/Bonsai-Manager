import { z } from 'zod';

export const atividadeFerramentaSugeridaSchema = z.object({
  params: z.object({
    atividadeId: z.string().uuid(),
    ferramentaId: z.string().uuid(),
  }),
});