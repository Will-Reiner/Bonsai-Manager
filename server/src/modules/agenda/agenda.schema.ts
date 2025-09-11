import { z } from 'zod';

const AgendaStatus = z.enum(['PENDENTE', 'CONCLUIDO', 'CANCELADO']);

export const createAgendaSchema = z.object({
  body: z.object({
    plantaId: z.string().uuid({ message: 'O ID da planta é obrigatório.' }),
    atividadeId: z.string().uuid({ message: 'O ID da atividade é obrigatório.' }),
    dataAgendada: z.string().datetime({ message: 'A data agendada deve ser uma data válida.' }),
    observacoes: z.string().optional(),
  }),
});

export const updateAgendaSchema = z.object({
  body: z.object({
    dataAgendada: z.string().datetime().optional(),
    dataConcluida: z.string().datetime().optional().nullable(),
    status: AgendaStatus.optional(),
    observacoes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID da agenda inválido.' }),
  }),
});

export const agendaIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da agenda inválido.' }),
  }),
});
