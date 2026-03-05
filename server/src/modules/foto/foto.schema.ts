import { z } from 'zod';

export const createFotoSchema = z.object({
  body: z.object({
    caminhoArquivo: z.string().min(1, { message: 'O caminho do arquivo é obrigatório.' }),
    // plantaId agora é opcional, mas se vier, deve ser um UUID
    plantaId: z.string().uuid({ message: 'ID da planta inválido.' }).optional().nullable(),
    titulo: z.string().optional(),
    tags: z.string().optional(),
    tipo: z.enum(['FOTO', 'VIDEO', 'VISAO_FUTURA']).optional(),
    descricao: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }),
});

export const updateFotoSchema = z.object({
  body: z.object({
    // Não permitimos mover a foto para outra planta, mas permitimos atualizar os outros campos
    titulo: z.string().optional(),
    tags: z.string().optional(),
    descricao: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID da foto inválido.' }),
  }),
});

export const fotoIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da foto inválido.' }),
  }),
});

export const plantaIdSchema = z.object({
  params: z.object({
    plantaId: z.string().uuid({ message: 'ID da planta inválido.' }),
  }),
});