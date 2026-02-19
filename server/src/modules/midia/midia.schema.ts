import { z } from 'zod';

export const presignedUrlSchema = z.object({
  body: z.object({
    fileName: z.string().min(1, { message: 'O nome do arquivo é obrigatório.' }),
    fileType: z.string().min(1, { message: 'O tipo do arquivo é obrigatório.' }),
  }),
});
