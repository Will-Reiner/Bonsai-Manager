import { z } from 'zod';

// Enum para validação, correspondendo ao schema do Prisma
const RecomendacaoTecnicaEnum = z.enum([
  'RECOMENDADA',
  'NAO_RECOMENDADA',
  'COM_CUIDADO',
]);

export const createGuiaDeTecnicasSchema = z.object({
  body: z.object({
    especieId: z.string().uuid(),
    atividadeId: z.string().uuid(),
    recomendacao: RecomendacaoTecnicaEnum,
    observacoes: z.string().optional(),
  }),
});

export const updateGuiaDeTecnicasSchema = z.object({
  body: z.object({
    recomendacao: RecomendacaoTecnicaEnum.optional(),
    observacoes: z.string().optional(),
  }),
});

export const GuiaDeTecnicasIdSchema = z.object({
    params: z.object({
        especieId: z.string().uuid(),
        atividadeId: z.string().uuid(),
    }),
});