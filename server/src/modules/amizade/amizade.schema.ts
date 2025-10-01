import { z } from 'zod';

export const amizadeSchema = z.object({
  params: z.object({
    // O ID do usuário a ser seguido ou deixado de seguir
    seguidoId: z.string().uuid({ message: 'O ID do usuário-alvo é inválido.' }),
  }),
});