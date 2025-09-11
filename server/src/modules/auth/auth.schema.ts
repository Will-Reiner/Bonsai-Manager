import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    nome: z.string().min(3, { message: 'O nome precisa ter pelo menos 3 caracteres.' }),
    email: z.string().email({ message: 'Email inválido.' }),
    senha: z.string().min(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email inválido.' }),
    senha: z.string().min(1, { message: 'A senha é obrigatória.' }),
  }),
});