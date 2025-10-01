import { z } from 'zod';

// O Enum do Prisma é replicado aqui para validação
const AgendaStatus = z.enum(['PENDENTE', 'CONCLUIDO', 'CANCELADO']);

// Schema para criar um novo agendamento (continua simples)
export const createAgendaSchema = z.object({
  body: z.object({
    plantaId: z.string().uuid({ message: 'O ID da planta é obrigatório.' }),
    atividadeId: z.string().uuid({ message: 'O ID da atividade é obrigatório.' }),
    dataAgendada: z.string().datetime({ message: 'A data agendada deve ser uma data válida.' }),
    observacoes: z.string().optional(), // Observações iniciais do agendamento
  }),
});

// Schema para ATUALIZAR um agendamento.
// Agora inclui os campos de histórico e os recursos utilizados.
export const updateAgendaSchema = z.object({
  body: z.object({
    dataAgendada: z.string().datetime().optional(),
    dataConcluida: z.string().datetime().optional().nullable(),
    status: AgendaStatus.optional(),
    observacoes: z.string().optional(),
    // Novos campos que vêm do antigo "histórico"
    detalhes: z.string().optional(),
    observacaoFutura: z.string().optional(),
    // Campo para registrar os recursos do inventário que foram utilizados
    recursosUtilizados: z.array(z.object({
        recursoId: z.string().uuid(),
        quantidadeUtilizada: z.number().positive(),
    })).optional(),
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