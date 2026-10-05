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

export const createAgendasLoteSchema = z.object({
  body: z
    .object({
      /** Legado: uma planta só. */
      plantaId: z.string().uuid({ message: 'ID de planta inválido.' }).optional(),
      plantaIds: z
        .array(z.string().uuid({ message: 'ID de planta inválido.' }))
        .max(500, { message: 'Máximo de 500 plantas por vez.' })
        .optional(),
      atividadeIds: z
        .array(z.string().uuid({ message: 'ID de atividade inválido.' }))
        .min(1, { message: 'Informe ao menos um cuidado.' })
        .max(20, { message: 'Máximo de 20 cuidados por vez.' }),
      dataAgendada: z.string().datetime({ message: 'A data agendada deve ser uma data válida.' }),
      detalhes: z.string().max(2000, { message: 'Observação muito longa.' }).optional(),
    })
    .transform(({ plantaId, plantaIds, ...resto }) => ({
      ...resto,
      plantaIds: plantaIds ?? (plantaId ? [plantaId] : []),
    })),
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

export const concluirAgendasSchema = z.object({
  body: z.object({
    dataConcluida: z.string().datetime({ message: 'Data de conclusão inválida.' }),
    atividadeId: z.string().uuid().optional(),
    detalhes: z.string().optional(),
    observacaoFutura: z.string().optional(),
    extras: z.array(z.string().uuid()).optional(),
    proximos: z
      .array(z.object({ atividadeId: z.string().uuid(), dataAgendada: z.string().datetime() }))
      .optional(),
    itens: z
      .array(
        z.object({
          agendaId: z.string().uuid(),
          detalhes: z.string().optional(),
          observacaoFutura: z.string().optional(),
          fotos: z.array(z.string().url()).optional(),
        }),
      )
      .min(1, { message: 'Informe ao menos uma tarefa.' })
      .max(50, { message: 'Máximo de 50 tarefas por vez.' })
      .refine((itens) => new Set(itens.map((i) => i.agendaId)).size === itens.length, {
        message: 'Tarefas repetidas na lista.',
      }),
  }),
});

export const registrarCuidadosSchema = z.object({
  body: z.object({
    data: z.string().datetime({ message: 'Data inválida.' }),
    plantas: z
      .array(
        z.object({
          plantaId: z.string().uuid({ message: 'ID de planta inválido.' }),
          atividadeIds: z
            .array(z.string().uuid({ message: 'ID de atividade inválido.' }))
            .min(1, { message: 'Informe ao menos um cuidado por planta.' })
            .max(20, { message: 'Máximo de 20 cuidados por planta.' }),
          detalhes: z.string().max(2000).optional(),
          observacaoFutura: z.string().max(2000).optional(),
          fotos: z
            .array(z.object({ caminhoArquivo: z.string().url(), dataCaptura: z.string().datetime().optional() }))
            .max(50, { message: 'Máximo de 50 fotos por planta.' })
            .optional(),
        }),
      )
      .min(1, { message: 'Informe ao menos uma planta.' })
      .max(200, { message: 'Máximo de 200 plantas por vez.' }),
    proximos: z
      .array(z.object({ atividadeId: z.string().uuid(), dataAgendada: z.string().datetime() }))
      .max(10)
      .optional(),
  }),
});
