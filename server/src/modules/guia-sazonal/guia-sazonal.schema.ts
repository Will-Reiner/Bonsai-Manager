import { z } from 'zod';

// Enums para validação, correspondendo ao schema do Prisma
const EstacaoEnum = z.enum(['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO']);
const MomentoIdealEnum = z.enum(['DEVE_FAZER', 'PODE_FAZER', 'EVITAR']);

export const createGuiaSazonalSchema = z.object({
  body: z.object({
    especieId: z.string().uuid(),
    atividadeId: z.string().uuid(),
    estacao: EstacaoEnum,
    momentoIdeal: MomentoIdealEnum,
    observacoes: z.string().optional(),
  }),
});

export const updateGuiaSazonalSchema = z.object({
  body: z.object({
    momentoIdeal: MomentoIdealEnum.optional(),
    observacoes: z.string().optional(),
  }),
});

export const GuiaSazonalIdSchema = z.object({
    params: z.object({
        especieId: z.string().uuid(),
        atividadeId: z.string().uuid(),
        estacao: EstacaoEnum,
    }),
});