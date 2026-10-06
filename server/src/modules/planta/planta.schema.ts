import { z } from 'zod';

// Criamos um Zod Enum que corresponde ao Enum do Prisma
const ModoAquisicaoEnum = z.enum(['SEMENTE', 'ESTACA', 'ALPORQUIA', 'YAMADORI', 'COMPRA']);
const GrupoPlantaEnum = z.enum(['RECEM_TRANSPLANTADA', 'DEBILITADA', 'EM_CRESCIMENTO', 'REFINAMENTO']);

// Schema para criar uma nova planta com os campos atualizados
export const createPlantaSchema = z.object({
  body: z.object({
    especieId: z.string().uuid({ message: 'ID de espécie inválido.' }).optional(),
    nome: z.string().optional(),
    identificador: z.string().optional(),
    dataAquisicao: z.string().datetime().optional().nullable(),
    modoAquisicao: ModoAquisicaoEnum.optional().nullable(),
    observacoes: z.string().optional(),
    fotoCapaUrl: z.string().url().optional().nullable(),
    plantaPublica: z.boolean().optional(),
    historicoPublico: z.boolean().optional(),
    grupo: GrupoPlantaEnum.optional().nullable(),
  }),
});

// Schema para atualizar uma planta com os campos atualizados
export const updatePlantaSchema = z.object({
  body: z.object({
    especieId: z.string().uuid().optional(),
    nome: z.string().optional(),
    identificador: z.string().optional().nullable(),
    dataAquisicao: z.string().datetime().optional().nullable(),
    modoAquisicao: ModoAquisicaoEnum.optional().nullable(),
    observacoes: z.string().optional(),
    fotoCapaUrl: z.string().url().optional().nullable(),
    plantaPublica: z.boolean().optional(),
    historicoPublico: z.boolean().optional(),
    grupo: GrupoPlantaEnum.optional().nullable(),
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