import { z } from 'zod';

// Criamos um Zod Enum que corresponde ao Enum do Prisma
const ModoAquisicaoEnum = z.enum(['SEMENTE', 'ESTACA', 'ALPORQUIA', 'YAMADORI', 'COMPRA']);
const GrupoPlantaEnum = z.enum(['RECEM_TRANSPLANTADA', 'DEBILITADA', 'EM_CRESCIMENTO', 'REFINAMENTO']);

// ID da planta: inteiro positivo. Aceita texto só com dígitos ("14"), que é como a triagem de fotos manda.
const IdentificadorSchema = z.preprocess(
  (v) => (typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : v),
  z
    .number({ invalid_type_error: 'O código da planta deve ser um número.' })
    .int('O código da planta deve ser um número inteiro.')
    .min(1, 'O código da planta deve ser maior que zero.')
    .max(999_999_999, 'O código da planta é grande demais.'),
);

// Schema para criar uma nova planta com os campos atualizados
export const createPlantaSchema = z.object({
  body: z.object({
    especieId: z.string().uuid({ message: 'ID de espécie inválido.' }).optional(),
    nome: z.string().optional(),
    identificador: IdentificadorSchema.optional(),
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
    identificador: IdentificadorSchema.optional(),
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