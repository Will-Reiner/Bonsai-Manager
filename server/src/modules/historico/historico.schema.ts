import { z } from 'zod';

export const createHistoricoSchema = z.object({
  body: z.object({
    plantaId: z.string().uuid({ message: 'O ID da planta é obrigatório.' }),
    dataRealizacao: z.string().datetime({ message: 'A data de realização é obrigatória e deve estar no formato ISO.' }),
    atividadeRealizada: z.string().min(3, { message: 'A descrição da atividade realizada deve ter pelo menos 3 caracteres.' }),
    recursosUtilizados: z.string().optional(),
    detalhes: z.string().optional(),
    observacaoFutura: z.string().optional(),
  }),
});

export const updateHistoricoSchema = z.object({
  body: z.object({
    plantaId: z.string().uuid().optional(),
    dataRealizacao: z.string().datetime().optional(),
    atividadeRealizada: z.string().min(3).optional(),
    recursosUtilizados: z.string().optional(),
    detalhes: z.string().optional(),
    observacaoFutura: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID do registro histórico inválido.' }),
  }),
});

export const historicoIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID do registro histórico inválido.' }),
  }),
});

export const plantaIdSchema = z.object({
  params: z.object({
    plantaId: z.string().uuid({ message: 'ID da planta inválido.' }),
  }),
});