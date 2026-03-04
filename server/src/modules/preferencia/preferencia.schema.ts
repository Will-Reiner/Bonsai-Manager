import { z } from 'zod';

export const upsertPreferenciaSchema = z.object({
  params: z.object({
    chave: z.string().min(1, { message: 'A chave da preferência é obrigatória.' }),
  }),
  body: z.object({
    valor: z.string({ required_error: 'O valor da preferência é obrigatório.' }),
  }),
});

export const upsertPreferenciasEmLoteSchema = z.object({
  body: z.object({
    preferencias: z.record(z.string(), z.string(), {
      required_error: 'O objeto de preferências é obrigatório.',
    }),
  }),
});
