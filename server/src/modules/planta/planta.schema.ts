import { z } from 'zod';

// Criamos um Zod Enum que corresponde ao Enum do Prisma
const ModoAquisicaoEnum = z.enum(['SEMENTE', 'ESTACA', 'ALPORQUIA', 'YAMADORI', 'COMPRA']);

// Schema para criar uma nova planta com os campos atualizados
export const createPlantaSchema = z.object({
  body: z.object({
    especieId: z.string().uuid({ message: 'O ID da espécie é obrigatório.' }),
    nome: z.string().optional(),
    dataAquisicao: z.string().datetime().optional().nullable(),
    modoAquisicao: ModoAquisicaoEnum.optional().nullable(),
    visao: z.string().optional(),
    observacoes: z.string().optional(),
    fotoCapaUrl: z.string().url().optional().nullable(),
    plantaPublica: z.boolean().optional(),
    historicoPublico: z.boolean().optional(),
  }),
});

// Schema para atualizar uma planta com os campos atualizados
export const updatePlantaSchema = z.object({
  body: z.object({
    especieId: z.string().uuid().optional(),
    nome: z.string().optional(),
    dataAquisicao: z.string().datetime().optional().nullable(),
    modoAquisicao: ModoAquisicaoEnum.optional().nullable(),
    visao: z.string().optional(),
    observacoes: z.string().optional(),
    fotoCapaUrl: z.string().url().optional().nullable(),
    plantaPublica: z.boolean().optional(),
    historicoPublico: z.boolean().optional(),
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