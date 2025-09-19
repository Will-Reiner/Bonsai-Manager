import { z } from 'zod';

export const inspiracaoSchema = z.object({
  params: z.object({
    plantaId: z.string().uuid({ message: 'O ID da planta é inválido.' }),
    fotoId: z.string().uuid({ message: 'O ID da foto é inválido.' }),
  }),
});