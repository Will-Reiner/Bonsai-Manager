import { z } from 'zod';

const uuid = (msg: string) => z.string().uuid({ message: msg });
export const intervaloDiasSchema = z
  .number({ invalid_type_error: 'Intervalo inválido.' })
  .int({ message: 'O intervalo deve ser em dias inteiros.' })
  .min(1, { message: 'O intervalo mínimo é 1 dia.' })
  .max(3650, { message: 'O intervalo máximo é 3650 dias.' });

export const criarRotinasSchema = z.object({
  body: z.object({
    plantaIds: z.array(uuid('ID de planta inválido.')).min(1, { message: 'Informe ao menos uma planta.' }).max(200),
    atividadeIds: z.array(uuid('ID de atividade inválido.')).min(1, { message: 'Informe ao menos um cuidado.' }).max(20),
    intervaloDias: intervaloDiasSchema,
    dataFim: z.string().datetime().optional(),
    primeiraData: z.string().datetime().optional(),
    detalhes: z.string().max(2000, { message: 'Observação muito longa.' }).optional(),
  }),
});

export const rotinaIdSchema = z.object({ params: z.object({ id: uuid('ID da rotina inválido.') }) });

export const atualizarRotinaSchema = z.object({
  params: z.object({ id: uuid('ID da rotina inválido.') }),
  body: z.object({
    intervaloDias: intervaloDiasSchema.optional(),
    dataFim: z.string().datetime().nullable().optional(),
  }),
});

export const listarRotinasSchema = z.object({
  query: z.object({ plantaId: uuid('ID de planta inválido.').optional() }),
});
