import { z } from 'zod';

// Todos os campos são opcionais, exceto o ID da espécie
export const createPlantaSchema = z.object({
  body: z.object({
    especieId: z.string().uuid({ message: 'O ID da espécie é obrigatório.' }),
    nome: z.string().optional(),
    dataAquisicao: z.string().datetime().optional(),
    statusAtual: z.string().optional(),
    visao: z.string().optional(),
    objetivoAno: z.string().optional(),
    dataProximoTransplante: z.string().datetime().optional(),
    prioridadeTransplante: z.number().int().optional(),
    observacoes: z.string().optional(),
  }),
});

// Para atualização, todos os campos, incluindo o ID da espécie, são opcionais
export const updatePlantaSchema = z.object({
  body: z.object({
    especieId: z.string().uuid().optional(),
    nome: z.string().optional(),
    dataAquisicao: z.string().datetime().optional(),
    statusAtual: z.string().optional(),
    visao: z.string().optional(),
    objetivoAno: z.string().optional(),
    dataProximoTransplante: z.string().datetime().optional(),
    prioridadeTransplante: z.number().int().optional(),
    observacoes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID da planta inválido.' }),
  }),
});

export const plantaIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da planta inválido.' }),
  }),
});
