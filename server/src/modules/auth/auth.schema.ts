import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    nome: z.string().min(3, { message: 'O nome precisa ter pelo menos 3 caracteres.' }),
    email: z.string().email({ message: 'Email inválido.' }),
    senha: z.string().min(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' }),
    
    // Adicionando os novos campos opcionais ao registo
    nomePublico: z.string().optional(),
    localidade: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email inválido.' }),
    senha: z.string().min(1, { message: 'A senha é obrigatória.' }),
  }),
});

// --- NOVO SCHEMA ---
// Schema para a atualização do perfil do usuário
export const updateUserSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
    nomePublico: z.string().optional(),
    localidade: z.string().optional(),
    bio: z.string().optional(),
    fotoPerfilUrl: z.string().url().optional(),
    perfilPublico: z.boolean().optional(),
    recursosHabilitado: z.boolean().optional(),
  })
});