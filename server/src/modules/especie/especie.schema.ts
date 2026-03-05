import { z } from 'zod';

// Replicamos os Enums do Prisma para validação com Zod
const TipoPlantaEnum = z.enum([
  'PERENE', 'CADUCIFOLIA', 'SEMI_CADUCA',
  'ARVORE', 'ARBUSTO', 'CONIFERA'
]);

const StatusEspecieEnum = z.enum(['VERIFICADO', 'SUGERIDO']);

const baseEspecieSchema = {
  nomeCientifico: z.string().min(3, { message: 'O nome científico deve ter pelo menos 3 caracteres.' }).optional(),
  nomeComum: z.string().optional(),
  familia: z.string().optional(),
  origem: z.string().optional(),
  tipoDePlanta: TipoPlantaEnum.optional(),
  status: StatusEspecieEnum.optional(),
  folhas: z.string().optional(),
  tronco: z.string().optional(),
  flores: z.string().optional(),
  frutos: z.string().optional(),
  raizes: z.string().optional(),
  luminosidade: z.string().optional(),
  rega: z.string().optional(),
  substratoIdeal: z.string().optional(),
  adubacao: z.string().optional(),
  clima: z.string().optional(),
  problemasComuns: z.string().optional(),
  pros: z.string().optional(),
  contras: z.string().optional(),
  linhasDeRaciocinio: z.string().optional(),
  observacoes: z.string().optional(),
};

export const createEspecieSchema = z.object({
  body: z.object(baseEspecieSchema),
});

export const updateEspecieSchema = z.object({
  // No update, todos os campos são opcionais
  body: z.object(baseEspecieSchema),
  params: z.object({
    id: z.string().uuid({ message: 'ID da espécie inválido.' }),
  }),
});

export const especieIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID da espécie inválido.' }),
  }),
});
